import json
import os
from sqlalchemy.orm import Session
from app.db.models import Espacio, Recurso

def seed_database(db: Session):
    """
    Inserta el dataset oficial de Campuslands si la base de datos está vacía.
    Garantiza que Auditorio 100, Spooki 38, Apolo 34, etc. estén disponibles.
    """
    if db.query(Espacio).first():
        return # Ya sembrado

    # Buscar el archivo de seed en rutas posibles
    posibles_rutas = [
        "/app/data/campus_seed.json",
        "data/campus_seed.json",
        "../data/campus_seed.json"
    ]
    seed_file = None
    for r in posibles_rutas:
        if os.path.exists(r):
            seed_file = r
            break

    if not seed_file:
        print("[AVISO SEED] No se encontró campus_seed.json. Omitiendo seed automático.")
        return

    with open(seed_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    for item in data.get("espacios", []):
        db.add(Espacio(
            id=item["id"],
            nombre=item["nombre"],
            tipo=item["tipo"],
            capacidad=item["capacidad"],
            ubicacion=item["ubicacion"],
            estado=item.get("estado", "disponible")
        ))

    for item in data.get("recursos", []):
        db.add(Recurso(
            id=item["id"],
            nombre=item["nombre"],
            categoria=item["categoria"],
            serial=item["serial"],
            estado=item.get("estado", "disponible"),
            ubicacion_actual=item.get("ubicacion_actual", "Almacén Central")
        ))

    db.commit()
    print("[SUCCESS] Dataset oficial de Campuslands cargado con éxito en PostgreSQL.")
