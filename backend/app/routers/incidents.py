from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from app.db.session import get_db
from app.db.models import Incidencia, Espacio, Recurso
from app.services.ai_triage import analizar_incidencia_con_ia
from app.services.notifications import notificar_incidencia_critica
from app.core.business_rules import SEVERIDADES_BLOQUEANTES

router = APIRouter(prefix="/incidents", tags=["Incidencias & Triaje IA"])

class IncidenciaIn(BaseModel):
    descripcion: str
    espacio_id_manual: Optional[str] = None
    recurso_id_manual: Optional[str] = None

class IncidenciaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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


@router.get("", response_model=List[IncidenciaOut])
def listar_incidencias(db: Session = Depends(get_db)):
    return db.query(Incidencia).order_by(Incidencia.creada_en.desc()).all()

@router.get("/{incidencia_id}", response_model=IncidenciaOut)
def obtener_incidencia(incidencia_id: int, db: Session = Depends(get_db)):
    incidencia = db.query(Incidencia).filter(Incidencia.id == incidencia_id).first()
    if not incidencia:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")
    return incidencia

@router.post("", response_model=IncidenciaOut, status_code=status.HTTP_201_CREATED)
async def registrar_y_triar_incidencia(data: IncidenciaIn, db: Session = Depends(get_db)):
    if not data.descripcion or not data.descripcion.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La descripción no puede estar vacía.")

    # 1. Obtener lista oficial de nombres de espacios para asistir al modelo
    espacios = db.query(Espacio).all()
    espacios_nombres = [e.nombre for e in espacios]

    # 2. Ejecutar Triaje con Google Gemini SDK (o fallback)
    triage = analizar_incidencia_con_ia(data.descripcion, espacios_nombres)

    # 3. Vincular espacio afectado (manual o detectado por IA)
    espacio_obj = None
    if data.espacio_id_manual:
        espacio_obj = db.query(Espacio).filter(Espacio.id == data.espacio_id_manual).first()
    elif triage.espacio_afectado:
        # Match exacto insensible a mayúsculas
        espacio_obj = db.query(Espacio).filter(Espacio.nombre.ilike(triage.espacio_afectado)).first()

    # 4. Vincular recurso tecnológico afectado (manual o detectado por IA)
    recurso_obj = None
    if data.recurso_id_manual:
        recurso_obj = db.query(Recurso).filter(Recurso.id == data.recurso_id_manual).first()
    elif triage.recurso_afectado:
        recurso_obj = db.query(Recurso).filter(Recurso.nombre.ilike(f"%{triage.recurso_afectado}%")).first()

    # 5. REGLA 3: Si severidad es bloqueante (CRITICA o ALTA), inhabilitar espacio y/o recurso
    es_bloqueante = triage.severidad in SEVERIDADES_BLOQUEANTES or triage.bloquear_espacio
    if es_bloqueante:
        if espacio_obj:
            espacio_obj.estado = "inhabilitado"
        if recurso_obj:
            recurso_obj.estado = "inhabilitado"

    # 6. Crear registro persistente de incidencia
    nueva_incidencia = Incidencia(
        descripcion=data.descripcion.strip(),
        categoria=triage.categoria,
        severidad=triage.severidad,
        espacio_id=espacio_obj.id if espacio_obj else None,
        recurso_id=recurso_obj.id if recurso_obj else None,
        accion_sugerida=triage.accion_sugerida,
        estado="ABIERTA",
        creada_en=datetime.now(timezone.utc).replace(tzinfo=None)
    )
    db.add(nueva_incidencia)
    db.commit()
    db.refresh(nueva_incidencia)

    # 7. Despacho asíncrono de alertas si es severidad bloqueante
    if es_bloqueante:
        await notificar_incidencia_critica(
            espacio=espacio_obj.nombre if espacio_obj else (recurso_obj.nombre if recurso_obj else "General"),
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
    incidencia.resuelta_en = datetime.now(timezone.utc).replace(tzinfo=None)

    # REGLA CRÍTICA MULTI-INCIDENCIA:
    # 1. Si tenía un espacio asignado, verificar si NO quedan otras incidencias bloqueantes abiertas para ese espacio
    if incidencia.espacio_id:
        otras_abiertas_espacio = (
            db.query(Incidencia)
            .filter(
                Incidencia.espacio_id == incidencia.espacio_id,
                Incidencia.id != incidencia.id,
                Incidencia.estado != "RESUELTA",
                Incidencia.severidad.in_(SEVERIDADES_BLOQUEANTES)
            )
            .count()
        )
        if otras_abiertas_espacio == 0:
            espacio = db.query(Espacio).filter(Espacio.id == incidencia.espacio_id).first()
            if espacio and espacio.estado == "inhabilitado":
                espacio.estado = "disponible"

    # 2. Si tenía un recurso asignado, verificar si NO quedan otras incidencias bloqueantes abiertas para ese recurso
    if incidencia.recurso_id:
        otras_abiertas_recurso = (
            db.query(Incidencia)
            .filter(
                Incidencia.recurso_id == incidencia.recurso_id,
                Incidencia.id != incidencia.id,
                Incidencia.estado != "RESUELTA",
                Incidencia.severidad.in_(SEVERIDADES_BLOQUEANTES)
            )
            .count()
        )
        if otras_abiertas_recurso == 0:
            recurso = db.query(Recurso).filter(Recurso.id == incidencia.recurso_id).first()
            if recurso and recurso.estado == "inhabilitado":
                recurso.estado = "disponible"

    db.commit()
    db.refresh(incidencia)
    return incidencia

