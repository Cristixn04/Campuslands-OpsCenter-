import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import Espacio

router = APIRouter(prefix="/spaces", tags=["Espacios"])

class EspacioOut(BaseModel):
    id: str
    nombre: str
    tipo: str
    capacidad: int
    ubicacion: str
    estado: str

    class Config:
        from_attributes = True

class CrearEspacioIn(BaseModel):
    id: Optional[str] = None
    nombre: str
    tipo: str
    capacidad: int
    ubicacion: str

@router.get("", response_model=List[EspacioOut])
def listar_espacios(db: Session = Depends(get_db)):
    return db.query(Espacio).order_by(Espacio.capacidad.desc()).all()

@router.post("", response_model=EspacioOut, status_code=status.HTTP_201_CREATED)
def crear_espacio(data: CrearEspacioIn, db: Session = Depends(get_db)):
    existente = db.query(Espacio).filter(Espacio.nombre.ilike(data.nombre)).first()
    if existente:
        raise HTTPException(status_code=400, detail=f"Ya existe un espacio con el nombre '{data.nombre}'.")

    nuevo_id = data.id or f"esp-{uuid.uuid4().hex[:5]}"
    nuevo_espacio = Espacio(
        id=nuevo_id,
        nombre=data.nombre,
        tipo=data.tipo.lower(),
        capacidad=data.capacidad,
        ubicacion=data.ubicacion,
        estado="disponible"
    )
    db.add(nuevo_espacio)
    db.commit()
    db.refresh(nuevo_espacio)
    return nuevo_espacio

@router.get("/{espacio_id}", response_model=EspacioOut)
def obtener_espacio(espacio_id: str, db: Session = Depends(get_db)):
    espacio = db.query(Espacio).filter(Espacio.id == espacio_id).first()
    if not espacio:
        raise HTTPException(status_code=404, detail="Espacio no encontrado")
    return espacio

class CambiarEstadoIn(BaseModel):
    estado: str # disponible, ocupado, inhabilitado

@router.patch("/{espacio_id}/status", response_model=EspacioOut)
def actualizar_estado_espacio(espacio_id: str, data: CambiarEstadoIn, db: Session = Depends(get_db)):
    espacio = db.query(Espacio).filter(Espacio.id == espacio_id).first()
    if not espacio:
        raise HTTPException(status_code=404, detail="Espacio no encontrado")
    espacio.estado = data.estado
    db.commit()
    db.refresh(espacio)
    return espacio
