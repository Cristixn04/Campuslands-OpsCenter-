from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
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

@router.get("", response_model=List[RecursoOut])
def listar_recursos(db: Session = Depends(get_db)):
    return db.query(Recurso).all()

@router.get("/{recurso_id}", response_model=RecursoOut)
def obtener_recurso(recurso_id: str, db: Session = Depends(get_db)):
    recurso = db.query(Recurso).filter(Recurso.id == recurso_id).first()
    if not recurso:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    return recurso
