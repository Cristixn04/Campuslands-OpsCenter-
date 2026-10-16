import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, ConfigDict

from app.db.session import get_db
from app.db.models import Espacio

router = APIRouter(prefix="/spaces", tags=["Espacios"])

ESTADOS_VALIDOS_ESPACIO = {"disponible", "ocupado", "inhabilitado"}

class EspacioIn(BaseModel):
    id: Optional[str] = None
    nombre: str = Field(..., min_length=1)
    tipo: str = Field(..., min_length=1)
    capacidad: int = Field(gt=0, description="Capacidad oficial, debe ser mayor a 0.")
    ubicacion: str = Field(..., min_length=1)
    estado: str = "disponible"

CrearEspacioIn = EspacioIn

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

def generar_id_espacio_unico(db: Session, prefijo: str = "esp-", max_intentos: int = 20) -> str:
    for _ in range(max_intentos):
        candidato = f"{prefijo}{uuid.uuid4().hex[:5]}"
        if not db.query(Espacio).filter(Espacio.id == candidato).first():
            return candidato
    return f"{prefijo}{uuid.uuid4().hex[:10]}"

@router.get("", response_model=List[EspacioOut])
def listar_espacios(db: Session = Depends(get_db)):
    return db.query(Espacio).order_by(Espacio.capacidad.desc()).all()

@router.post("", response_model=EspacioOut, status_code=status.HTTP_201_CREATED)
def crear_espacio(data: EspacioIn, db: Session = Depends(get_db)):
    nombre_limpio = data.nombre.strip()
    tipo_limpio = data.tipo.strip().lower()
    ubicacion_limpia = data.ubicacion.strip()
    estado_limpio = data.estado.strip().lower() if data.estado else "disponible"

    if not nombre_limpio or not tipo_limpio or not ubicacion_limpia:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los campos nombre, tipo y ubicacion no pueden estar vacíos."
        )

    if data.capacidad <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La capacidad debe ser estrictamente mayor a 0."
        )

    if estado_limpio not in ESTADOS_VALIDOS_ESPACIO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estado '{data.estado}' inválido. Permitidos: {', '.join(sorted(ESTADOS_VALIDOS_ESPACIO))}."
        )

    existente_nombre = db.query(Espacio).filter(Espacio.nombre.ilike(nombre_limpio)).first()
    if existente_nombre:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un espacio con el nombre '{nombre_limpio}'."
        )

    if data.id and data.id.strip():
        id_final = data.id.strip()
        existente_id = db.query(Espacio).filter(Espacio.id == id_final).first()
        if existente_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un espacio con el ID '{id_final}'."
            )
    else:
        id_final = generar_id_espacio_unico(db, prefijo="esp-")

    nuevo_espacio = Espacio(
        id=id_final,
        nombre=nombre_limpio,
        tipo=tipo_limpio,
        capacidad=data.capacidad,
        ubicacion=ubicacion_limpia,
        estado=estado_limpio
    )
    db.add(nuevo_espacio)
    db.commit()
    db.refresh(nuevo_espacio)
    return nuevo_espacio

@router.get("/{espacio_id}", response_model=EspacioOut)
def obtener_espacio(espacio_id: str, db: Session = Depends(get_db)):
    espacio = db.query(Espacio).filter(Espacio.id == espacio_id).first()
    if not espacio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Espacio no encontrado")
    return espacio

@router.patch("/{espacio_id}/status", response_model=EspacioOut)
def actualizar_estado_espacio(espacio_id: str, data: CambiarEstadoIn, db: Session = Depends(get_db)):
    espacio = db.query(Espacio).filter(Espacio.id == espacio_id).first()
    if not espacio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Espacio no encontrado")

    estado_limpio = data.estado.strip().lower()
    if estado_limpio not in ESTADOS_VALIDOS_ESPACIO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estado '{data.estado}' inválido. Permitidos: {', '.join(sorted(ESTADOS_VALIDOS_ESPACIO))}."
        )

    espacio.estado = estado_limpio
    db.commit()
    db.refresh(espacio)
    return espacio
