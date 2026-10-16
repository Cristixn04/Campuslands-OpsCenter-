from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import Incidencia, Espacio, Recurso
from app.services.ai_triage import analizar_incidencia_con_ia
from app.services.notifications import notificar_incidencia_critica
from app.core.business_rules import SEVERIDADES_BLOQUEANTES

router = APIRouter(prefix="/incidents", tags=["Incidencias & Triaje IA"])

class IncidenciaIn(BaseModel):
    descripcion: str
    espacio_id_manual: Optional[str] = None

class IncidenciaOut(BaseModel):
    id: int
    descripcion: str
    categoria: str
    severidad: str
    espacio_id: Optional[str] = None
    recurso_id: Optional[str] = None
    accion_sugerida: Optional[str] = None
    estado: str
    creada_en: datetime
    resuelta_en: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("", response_model=List[IncidenciaOut])
def listar_incidencias(db: Session = Depends(get_db)):
    return db.query(Incidencia).order_by(Incidencia.creada_en.desc()).all()

@router.post("", response_model=IncidenciaOut, status_code=status.HTTP_201_CREATED)
async def registrar_y_triar_incidencia(data: IncidenciaIn, db: Session = Depends(get_db)):
    # 1. Obtener lista oficial de nombres de espacios para asistir a la IA
    espacios = db.query(Espacio).all()
    espacios_nombres = [e.nombre for e in espacios]

    # 2. Ejecutar Triaje con Google Gemini SDK
    triage = analizar_incidencia_con_ia(data.descripcion, espacios_nombres)

    # 3. Vincular espacio afectado (por IA o manual)
    espacio_obj = None
    if data.espacio_id_manual:
        espacio_obj = db.query(Espacio).filter(Espacio.id == data.espacio_id_manual).first()
    elif triage.espacio_afectado:
        # Match insensible a mayúsculas
        espacio_obj = db.query(Espacio).filter(Espacio.nombre.ilike(f"%{triage.espacio_afectado}%")).first()

    # 4. REGLA CENTRAL DE DOMINIO: Si severidad es CRITICA o ALTA, inhabilitar espacio
    if espacio_obj and (triage.severidad in SEVERIDADES_BLOQUEANTES or triage.bloquear_espacio):
        espacio_obj.estado = "inhabilitado"
        print(f"[REGLA DOMINIO] Espacio '{espacio_obj.nombre}' INHABILITADO automáticamente por incidencia {triage.severidad}.")

    # 5. Crear registro de incidencia
    nueva_incidencia = Incidencia(
        descripcion=data.descripcion,
        categoria=triage.categoria,
        severidad=triage.severidad,
        espacio_id=espacio_obj.id if espacio_obj else None,
        accion_sugerida=triage.accion_sugerida,
        estado="ABIERTA",
        creada_en=datetime.utcnow()
    )
    db.add(nueva_incidencia)
    db.commit()
    db.refresh(nueva_incidencia)

    # 6. Despacho asíncrono de alertas operativas
    if triage.severidad in SEVERIDADES_BLOQUEANTES:
        await notificar_incidencia_critica(
            espacio=espacio_obj.nombre if espacio_obj else "Sin asignar",
            severidad=triage.severidad,
            resumen=triage.resumen_ejecutivo,
            accion=triage.accion_sugerida
        )

    return nueva_incidencia

@router.patch("/{incidencia_id}/resolve", response_model=IncidenciaOut)
def resolver_incidencia(incidencia_id: int, db: Session = Depends(get_db)):
    incidencia = db.query(Incidencia).filter(Incidencia.id == incidencia_id).first()
    if not incidencia:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")

    incidencia.estado = "RESUELTA"
    incidencia.resuelta_en = datetime.utcnow()

    # Si tenía un espacio inhabilitado, verificar si no quedan otras incidencias críticas abiertas
    if incidencia.espacio_id:
        otras_abiertas = (
            db.query(Incidencia)
            .filter(
                Incidencia.espacio_id == incidencia.espacio_id,
                Incidencia.id != incidencia.id,
                Incidencia.estado != "RESUELTA",
                Incidencia.severidad.in_(SEVERIDADES_BLOQUEANTES)
            )
            .count()
        )
        if otras_abiertas == 0:
            espacio = db.query(Espacio).filter(Espacio.id == incidencia.espacio_id).first()
            if espacio and espacio.estado == "inhabilitado":
                espacio.estado = "disponible"
                print(f"[RESTABLECIMIENTO] Espacio '{espacio.nombre}' rehabilitado tras resolución de incidencia.")

    db.commit()
    db.refresh(incidencia)
    return incidencia
