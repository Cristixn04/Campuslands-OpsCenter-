from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, Field, ConfigDict
from app.db.session import get_db
from app.db.models import Recurso

router = APIRouter(prefix="/resources", tags=["Recursos Tecnológicos"])

class RecursoIn(BaseModel):
    id: str
    nombre: str
    categoria: str
    serial: str
    estado: str = "disponible"
    ubicacion_actual: str

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

@router.get("", response_model=List[RecursoOut])
def listar_recursos(db: Session = Depends(get_db)):
    return db.query(Recurso).order_by(Recurso.id.asc()).all()

@router.get("/{recurso_id}", response_model=RecursoOut)
def obtener_recurso(recurso_id: str, db: Session = Depends(get_db)):
    recurso = db.query(Recurso).filter(Recurso.id == recurso_id).first()
    if not recurso:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    return recurso

@router.post("", response_model=RecursoOut, status_code=status.HTTP_201_CREATED)
def registrar_recurso(data: RecursoIn, db: Session = Depends(get_db)):
    existente = db.query(Recurso).filter((Recurso.id == data.id) | (Recurso.serial == data.serial)).first()
    if existente:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un recurso con ese ID o número serial.")

    nuevo = Recurso(
        id=data.id,
        nombre=data.nombre.strip(),
        categoria=data.categoria.strip(),
        serial=data.serial.strip(),
        estado=data.estado.strip(),
        ubicacion_actual=data.ubicacion_actual.strip()
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.patch("/{recurso_id}/status", response_model=RecursoOut)
def actualizar_estado_recurso(recurso_id: str, data: CambiarEstadoRecursoIn, db: Session = Depends(get_db)):
    recurso = db.query(Recurso).filter(Recurso.id == recurso_id).first()
    if not recurso:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")

    recurso.estado = data.estado.strip().lower()
    db.commit()
    db.refresh(recurso)
    return recurso

