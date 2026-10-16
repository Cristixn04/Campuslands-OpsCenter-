from fastapi import APIRouter
from typing import List, Optional
from pydantic import BaseModel, Field
from app.core.business_rules import (
    obtener_configuracion_reglas,
    actualizar_configuracion_reglas
)

router = APIRouter(prefix="/config", tags=["Configuración de Reglas"])

class ConfigRulesOut(BaseModel):
    factor_tolerancia_aforo: float = Field(description="Tolerancia de aforo (0.0 = estricto, 0.15 = 15%)")
    buffer_minutos_entre_reservas: int = Field(description="Buffer obligatorio entre reservas en minutos")
    severidades_bloqueantes: List[str] = Field(description="Severidades que bloquean automáticamente espacios o recursos")

class ConfigRulesUpdateIn(BaseModel):
    factor_tolerancia_aforo: Optional[float] = Field(None, ge=0.0, le=1.0, description="Factor entre 0.0 y 1.0")
    buffer_minutos_entre_reservas: Optional[int] = Field(None, ge=0, le=180, description="Buffer en minutos (0-180)")
    severidades_bloqueantes: Optional[List[str]] = Field(None, description="Lista de severidades (BAJA, MEDIA, ALTA, CRITICA)")

@router.get("", response_model=ConfigRulesOut)
def ver_configuracion_reglas():
    """Retorna las 3 reglas de negocio configuradas actualmente."""
    return obtener_configuracion_reglas()

@router.patch("", response_model=ConfigRulesOut)
def modificar_configuracion_reglas(data: ConfigRulesUpdateIn):
    """Permite ajustar en vivo la tolerancia de aforo, buffer entre reservas o severidades bloqueantes."""
    return actualizar_configuracion_reglas(
        factor_tolerancia=data.factor_tolerancia_aforo,
        buffer_minutos=data.buffer_minutos_entre_reservas,
        severidades=data.severidades_bloqueantes
    )
