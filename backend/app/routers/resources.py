import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, ConfigDict

from app.db.session import get_db
from app.db.models import Recurso

router = APIRouter(prefix="/resources", tags=["Recursos Tecnológicos"])

ESTADOS_VALIDOS_RECURSO = {"disponible", "en_uso", "en_mantenimiento", "inhabilitado"}

class RecursoIn(BaseModel):
    id: Optional[str] = None
    nombre: str = Field(..., min_length=1)
    categoria: str = Field(..., min_length=1)
    serial: str = Field(..., min_length=1)
    estado: str = "disponible"
    ubicacion_actual: str = Field(..., min_length=1)

CrearRecursoIn = RecursoIn

class RecursoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str
    categoria: str
    serial: str
    estado: str
    ubicacion_actual: str

class CambiarEstadoRecursoIn(BaseModel):
    estado: str = Field(description="disponible, en_uso, en_mantenimiento, inhabilitado")

def generar_id_recurso_unico(db: Session, prefijo: str = "rec-", max_intentos: int = 20) -> str:
    for _ in range(max_intentos):
        candidato = f"{prefijo}{uuid.uuid4().hex[:5]}"
        if not db.query(Recurso).filter(Recurso.id == candidato).first():
            return candidato
    return f"{prefijo}{uuid.uuid4().hex[:10]}"

@router.get("", response_model=List[RecursoOut])
def listar_recursos(db: Session = Depends(get_db)):
    return db.query(Recurso).order_by(Recurso.id.asc()).all()

@router.post("", response_model=RecursoOut, status_code=status.HTTP_201_CREATED)
def crear_recurso(data: RecursoIn, db: Session = Depends(get_db)):
    nombre_limpio = data.nombre.strip()
    categoria_limpia = data.categoria.strip().lower()
    serial_limpio = data.serial.strip()
    ubicacion_limpia = data.ubicacion_actual.strip()
    estado_limpio = data.estado.strip().lower() if data.estado else "disponible"

    if not nombre_limpio or not categoria_limpia or not serial_limpio or not ubicacion_limpia:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los campos nombre, categoria, serial y ubicacion_actual no pueden estar vacíos."
        )

    if estado_limpio not in ESTADOS_VALIDOS_RECURSO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estado '{data.estado}' inválido. Permitidos: {', '.join(sorted(ESTADOS_VALIDOS_RECURSO))}."
        )

    existente_serial = db.query(Recurso).filter(Recurso.serial.ilike(serial_limpio)).first()
    if existente_serial:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un recurso con el serial '{serial_limpio}'."
        )

    if data.id and data.id.strip():
        id_final = data.id.strip()
        existente_id = db.query(Recurso).filter(Recurso.id == id_final).first()
        if existente_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un recurso con el ID '{id_final}'."
            )
    else:
        id_final = generar_id_recurso_unico(db, prefijo="rec-")

    nuevo_recurso = Recurso(
        id=id_final,
        nombre=nombre_limpio,
        categoria=categoria_limpia,
        serial=serial_limpio,
        estado=estado_limpio,
        ubicacion_actual=ubicacion_limpia
    )
    db.add(nuevo_recurso)
    db.commit()
    db.refresh(nuevo_recurso)
    return nuevo_recurso

@router.get("/{recurso_id}", response_model=RecursoOut)
def obtener_recurso(recurso_id: str, db: Session = Depends(get_db)):
    recurso = db.query(Recurso).filter(Recurso.id == recurso_id).first()
    if not recurso:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurso no encontrado")
    return recurso

@router.patch("/{recurso_id}/status", response_model=RecursoOut)
def actualizar_estado_recurso(recurso_id: str, data: CambiarEstadoRecursoIn, db: Session = Depends(get_db)):
    recurso = db.query(Recurso).filter(Recurso.id == recurso_id).first()
    if not recurso:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurso no encontrado")

    estado_limpio = data.estado.strip().lower()
    if estado_limpio not in ESTADOS_VALIDOS_RECURSO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estado '{data.estado}' inválido. Permitidos: {', '.join(sorted(ESTADOS_VALIDOS_RECURSO))}."
        )

    recurso.estado = estado_limpio
    db.commit()
    db.refresh(recurso)
    return recurso
