import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import Recurso

router = APIRouter(prefix="/resources", tags=["Recursos Tecnológicos"])

class RecursoOut(BaseModel):
    id: str
    nombre: str
    categoria: str
    serial: str
    estado: str
    ubicacion_actual: str

    class Config:
        from_attributes = True

class CrearRecursoIn(BaseModel):
    id: Optional[str] = None
    nombre: str
    categoria: str
    serial: str
    ubicacion_actual: str

@router.get("", response_model=List[RecursoOut])
def listar_recursos(db: Session = Depends(get_db)):
    return db.query(Recurso).all()

@router.post("", response_model=RecursoOut, status_code=status.HTTP_201_CREATED)
def crear_recurso(data: CrearRecursoIn, db: Session = Depends(get_db)):
    existente = db.query(Recurso).filter(Recurso.serial.ilike(data.serial)).first()
    if existente:
        raise HTTPException(status_code=400, detail=f"Ya existe un recurso con el serial '{data.serial}'.")

    nuevo_id = data.id or f"rec-{uuid.uuid4().hex[:5]}"
    nuevo_recurso = Recurso(
        id=nuevo_id,
        nombre=data.nombre,
        categoria=data.categoria.lower(),
        serial=data.serial,
        estado="disponible",
        ubicacion_actual=data.ubicacion_actual
    )
    db.add(nuevo_recurso)
    db.commit()
    db.refresh(nuevo_recurso)
    return nuevo_recurso

@router.get("/{recurso_id}", response_model=RecursoOut)
def obtener_recurso(recurso_id: str, db: Session = Depends(get_db)):
    recurso = db.query(Recurso).filter(Recurso.id == recurso_id).first()
    if not recurso:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    return recurso
