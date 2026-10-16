from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.db.seed import seed_database
from app.routers import spaces, resources, reservations, incidents, external, config

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas automáticamente al iniciar
    Base.metadata.create_all(bind=engine)
    # Cargar datos oficiales de Campuslands
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sistema Central de Gestión Operativa de Campuslands - Hackatón 2026",
    lifespan=lifespan
)

# Configuración de CORS para permitir conexión fluida con el Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de Routers
app.include_router(spaces.router, prefix="/api")
app.include_router(resources.router, prefix="/api")
app.include_router(reservations.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(external.router, prefix="/api")
app.include_router(config.router, prefix="/api")

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "service": "Campuslands OpsCenter API",
        "version": settings.VERSION
    }
