import json
import os
from sqlalchemy.orm import Session
from app.db.models import Espacio, Recurso

def seed_database(db: Session):
    """
    Inserta el dataset oficial de Campuslands si la base de datos está vacía.
    Garantiza que Auditorio 100, Spooki 38, Apolo 34, etc. estén disponibles.
    """
    # Buscar el archivo de seed en rutas posibles
    posibles_rutas = [
        "/app/data/campus_seed.json",
        "data/campus_seed.json",
        "../data/campus_seed.json",
        "../../data/campus_seed.json"
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


    inserted_spaces = 0
    for item in data.get("espacios", []):
        exists = db.query(Espacio).filter(Espacio.id == item["id"]).first()
        if not exists:
            db.add(Espacio(
                id=item["id"],
                nombre=item["nombre"],
                tipo=item["tipo"],
                capacidad=item["capacidad"],
                ubicacion=item["ubicacion"],
                estado=item.get("estado", "disponible")
            ))
            inserted_spaces += 1

    inserted_resources = 0
    for item in data.get("recursos", []):
        exists = db.query(Recurso).filter(Recurso.id == item["id"]).first()
        if not exists:
            db.add(Recurso(
                id=item["id"],
                nombre=item["nombre"],
                categoria=item["categoria"],
                serial=item["serial"],
                estado=item.get("estado", "disponible"),
                ubicacion_actual=item.get("ubicacion_actual", "Almacén Central")
            ))
            inserted_resources += 1

    if inserted_spaces > 0 or inserted_resources > 0:
        db.commit()
        print(f"[SUCCESS] Dataset oficial sembrado: {inserted_spaces} espacios y {inserted_resources} recursos.")
    else:
        print("[SEED] Dataset oficial ya se encuentra cargado e íntegro.")

