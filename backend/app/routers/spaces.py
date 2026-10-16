from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, Field, ConfigDict
from app.db.session import get_db
from app.db.models import Espacio

router = APIRouter(prefix="/spaces", tags=["Espacios"])

class EspacioIn(BaseModel):
    id: str
    nombre: str
    tipo: str
    capacidad: int = Field(gt=0, description="Capacidad oficial, debe ser mayor a 0.")
    ubicacion: str
    estado: str = "disponible"

class EspacioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str
    tipo: str
    capacidad: int
    ubicacion: str
    estado: str


class CambiarEstadoIn(BaseModel):
    estado: str = Field(description="disponible, ocupado, inhabilitado")

@router.get("", response_model=List[EspacioOut])
def listar_espacios(db: Session = Depends(get_db)):
    return db.query(Espacio).order_by(Espacio.capacidad.desc()).all()

@router.get("/{espacio_id}", response_model=EspacioOut)
def obtener_espacio(espacio_id: str, db: Session = Depends(get_db)):
    espacio = db.query(Espacio).filter(Espacio.id == espacio_id).first()
    if not espacio:
        raise HTTPException(status_code=404, detail="Espacio no encontrado")
    return espacio

@router.post("", response_model=EspacioOut, status_code=status.HTTP_201_CREATED)
def registrar_espacio(data: EspacioIn, db: Session = Depends(get_db)):
    existente = db.query(Espacio).filter((Espacio.id == data.id) | (Espacio.nombre == data.nombre)).first()
    if existente:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un espacio con ese ID o nombre.")

    nuevo = Espacio(
        id=data.id,
        nombre=data.nombre.strip(),
        tipo=data.tipo.strip(),
        capacidad=data.capacidad,
        ubicacion=data.ubicacion.strip(),
        estado=data.estado.strip().lower()
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.patch("/{espacio_id}/status", response_model=EspacioOut)
def actualizar_estado_espacio(espacio_id: str, data: CambiarEstadoIn, db: Session = Depends(get_db)):
    espacio = db.query(Espacio).filter(Espacio.id == espacio_id).first()
    if not espacio:
        raise HTTPException(status_code=404, detail="Espacio no encontrado")
    espacio.estado = data.estado.strip().lower()
    db.commit()
    db.refresh(espacio)
    return espacio

