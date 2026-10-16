from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
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

@router.get("", response_model=List[EspacioOut])
def listar_espacios(db: Session = Depends(get_db)):
    return db.query(Espacio).order_by(Espacio.capacidad.desc()).all()

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
