from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import Reserva, Espacio, Recurso, Incidencia
from app.core.business_rules import (
    validar_aforo,
    validar_no_solapamiento,
    validar_estado_operativo,
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
    asistentes: int

class ReservaOut(BaseModel):
    id: int
    espacio_id: str
    recurso_id: Optional[str] = None
    solicitante: str
    motivo: str
    fecha_inicio: datetime
    fecha_fin: datetime
    asistentes: int
    estado: str

    class Config:
        from_attributes = True

@router.get("", response_model=List[ReservaOut])
def listar_reservas(db: Session = Depends(get_db)):
    return db.query(Reserva).order_by(Reserva.fecha_inicio.desc()).all()

@router.post("", response_model=ReservaOut, status_code=status.HTTP_201_CREATED)
def crear_reserva(data: ReservaIn, db: Session = Depends(get_db)):
    # 1. Verificar existencia del espacio
    espacio = db.query(Espacio).filter(Espacio.id == data.espacio_id).first()
    if not espacio:
        raise HTTPException(status_code=404, detail="El espacio solicitado no existe.")

    # 2. REGLA 3: Verificar que el espacio no esté inhabilitado por incidentes
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
    validar_estado_operativo(espacio.estado, espacio.nombre, descripciones_inc)

    # 3. REGLA 1: Validación estricta de aforo
    validar_aforo(espacio.capacidad, data.asistentes, espacio.nombre)

    # 4. REGLA 2: Validación de no solapamiento de horarios en el espacio
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
    validar_no_solapamiento(reservas_formateadas, data.fecha_inicio, data.fecha_fin, espacio.nombre)

    # 5. Validación opcional de recurso tecnológico solicitado
    if data.recurso_id:
        recurso = db.query(Recurso).filter(Recurso.id == data.recurso_id).first()
        if not recurso:
            raise HTTPException(status_code=404, detail="El recurso tecnológico solicitado no existe.")
        if recurso.estado != "disponible":
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
            data.fecha_inicio,
            data.fecha_fin,
            recurso.nombre
        )

    # Crear y persistir reserva
    nueva_reserva = Reserva(
        espacio_id=data.espacio_id,
        recurso_id=data.recurso_id,
        solicitante=data.solicitante,
        motivo=data.motivo,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        asistentes=data.asistentes,
        estado="activa"
    )
    db.add(nueva_reserva)
    db.commit()
    db.refresh(nueva_reserva)
    return nueva_reserva
