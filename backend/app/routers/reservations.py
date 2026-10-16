from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, ConfigDict
from app.db.session import get_db
from app.db.models import Reserva, Espacio, Recurso, Incidencia
from app.core.business_rules import (
     validar_aforo,
     validar_no_solapamiento,
     validar_estado_operativo,
     normalizar_datetime_a_naive,
     SEVERIDADES_BLOQUEANTES
)

router = APIRouter(prefix="/reservations", tags=["Reservas"])

class ReservaIn(BaseModel):
    espacio_id: str
    recurso_id: Optional[str] = None
    solicitante: str
    motivo: str
    fecha_inicio: datetime
    fecha_fin: datetime
    asistentes: int = Field(gt=0, description="Número de asistentes, debe ser mayor a cero.")

class ReservaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    espacio_id: str
    recurso_id: Optional[str] = None
    solicitante: str
    motivo: str
    fecha_inicio: datetime
    fecha_fin: datetime
    asistentes: int
    estado: str


@router.get("", response_model=List[ReservaOut])
def listar_reservas(
    espacio_id: Optional[str] = Query(None, description="Filtrar por ID de espacio"),
    estado: Optional[str] = Query(None, description="Filtrar por estado: activa, completada, cancelada"),
    db: Session = Depends(get_db)
):
    query = db.query(Reserva)
    if espacio_id:
        query = query.filter(Reserva.espacio_id == espacio_id)
    if estado:
        query = query.filter(Reserva.estado == estado)
    return query.order_by(Reserva.fecha_inicio.desc()).all()

@router.get("/{reserva_id}", response_model=ReservaOut)
def obtener_reserva(reserva_id: int, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reserva

@router.post("", response_model=ReservaOut, status_code=status.HTTP_201_CREATED)
def crear_reserva(data: ReservaIn, db: Session = Depends(get_db)):
    # Normalizar datetimes a naive para comparaciones libres de error de offset
    inicio_naive = normalizar_datetime_a_naive(data.fecha_inicio)
    fin_naive = normalizar_datetime_a_naive(data.fecha_fin)

    if inicio_naive >= fin_naive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha/hora de inicio debe ser anterior a la de finalización."
        )

    # 1. Verificar existencia y bloquear fila del espacio para concurrencia segura
    espacio = db.query(Espacio).filter(Espacio.id == data.espacio_id).with_for_update().first()
    if not espacio:
        raise HTTPException(status_code=404, detail="El espacio solicitado no existe.")

    # 2. REGLA 3: Verificar que el espacio no esté inhabilitado
    incidencias_bloqueantes = (
        db.query(Incidencia)
        .filter(
            Incidencia.espacio_id == espacio.id,
            Incidencia.estado != "RESUELTA",
            Incidencia.severidad.in_(SEVERIDADES_BLOQUEANTES)
        )
        .all()
    )
    descripciones_inc = [f"[{i.severidad}] {i.descripcion}" for i in incidencias_bloqueantes]
    validar_estado_operativo(espacio.estado, espacio.nombre, tipo_item="espacio", incidencias_activas=descripciones_inc)

    # 3. REGLA 1: Validación estricta de aforo con tolerancia configurable
    validar_aforo(espacio.capacidad, data.asistentes, espacio.nombre)

    # 4. REGLA 2: Validación de no solapamiento de horarios y buffer en el espacio
    reservas_espacio = (
        db.query(Reserva)
        .filter(
            Reserva.espacio_id == espacio.id,
            Reserva.estado == "activa"
        )
        .all()
    )
    reservas_formateadas = [
        {"inicio": r.fecha_inicio, "fin": r.fecha_fin} for r in reservas_espacio
    ]
    validar_no_solapamiento(reservas_formateadas, inicio_naive, fin_naive, espacio.nombre)

    # 5. Validación opcional de recurso tecnológico solicitado
    recurso = None
    if data.recurso_id:
        recurso = db.query(Recurso).filter(Recurso.id == data.recurso_id).with_for_update().first()
        if not recurso:
            raise HTTPException(status_code=404, detail="El recurso tecnológico solicitado no existe.")
        
        # Validar estado del recurso (si está inhabilitado por incidencia -> 423)
        if recurso.estado.lower() in ["inhabilitado", "bloqueado"]:
            validar_estado_operativo(recurso.estado, recurso.nombre, tipo_item="recurso")
        elif recurso.estado != "disponible":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El recurso '{recurso.nombre}' no está disponible (Estado: {recurso.estado})."
            )

        # Verificar no solapamiento del recurso
        reservas_recurso = (
            db.query(Reserva)
            .filter(Reserva.recurso_id == recurso.id, Reserva.estado == "activa")
            .all()
        )
        validar_no_solapamiento(
            [{"inicio": r.fecha_inicio, "fin": r.fecha_fin} for r in reservas_recurso],
            inicio_naive,
            fin_naive,
            recurso.nombre
        )

    # Crear y persistir reserva
    nueva_reserva = Reserva(
        espacio_id=data.espacio_id,
        recurso_id=data.recurso_id,
        solicitante=data.solicitante.strip(),
        motivo=data.motivo.strip(),
        fecha_inicio=inicio_naive,
        fecha_fin=fin_naive,
        asistentes=data.asistentes,
        estado="activa"
    )
    db.add(nueva_reserva)
    db.commit()
    db.refresh(nueva_reserva)
    return nueva_reserva

@router.patch("/{reserva_id}/cancel", response_model=ReservaOut)
def cancelar_reserva(reserva_id: int, db: Session = Depends(get_db)):
    """Libera una reserva activa y restaura la disponibilidad del espacio/recurso."""
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="La reserva solicitada no existe.")

    if reserva.estado == "cancelada":
        return reserva

    reserva.estado = "cancelada"
    db.commit()
    db.refresh(reserva)
    return reserva

@router.delete("/{reserva_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_reserva(reserva_id: int, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="La reserva solicitada no existe.")
    
    db.delete(reserva)
    db.commit()
    return None
