"""
MÓDULO CENTRAL DE REGLAS DE NEGOCIO (AUDITABLE Y CONFIGURABLE EN VIVO)
=============================================================================
Todas las validaciones de dominio están concentradas aquí con constantes
configurables para permitir cambios instantáneos y evaluación en vivo.
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status

# ---------------------------------------------------------------------------
# CONSTANTES CONFIGURABLES (MODIFICABLES EN VIVO O VÍA API DE CONFIGURACIÓN)
# ---------------------------------------------------------------------------
# Tolerancia de aforo (0.0 = Aforo estricto, 0.15 = 15% de sobrecupo permitido)
FACTOR_TOLERANCIA_AFORO: float = 0.0

# Margen de sanitización o preparación entre reservas (en minutos)
BUFFER_MINUTOS_ENTRE_RESERVAS: int = 0

# Severidades de incidencia que bloquean automáticamente un espacio o recurso
SEVERIDADES_BLOQUEANTES: List[str] = ["CRITICA", "ALTA"]


def obtener_configuracion_reglas() -> Dict[str, Any]:
    """Retorna las reglas operativas actualmente vigentes."""
    return {
        "factor_tolerancia_aforo": FACTOR_TOLERANCIA_AFORO,
        "buffer_minutos_entre_reservas": BUFFER_MINUTOS_ENTRE_RESERVAS,
        "severidades_bloqueantes": list(SEVERIDADES_BLOQUEANTES),
    }


def actualizar_configuracion_reglas(
    factor_tolerancia: Optional[float] = None,
    buffer_minutos: Optional[int] = None,
    severidades: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Actualiza en memoria las constantes de reglas para cambios inmediatos sin reiniciar."""
    global FACTOR_TOLERANCIA_AFORO, BUFFER_MINUTOS_ENTRE_RESERVAS, SEVERIDADES_BLOQUEANTES

    if factor_tolerancia is not None:
        if factor_tolerancia < 0.0 or factor_tolerancia > 1.0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El factor de tolerancia de aforo debe estar entre 0.0 y 1.0."
            )
        FACTOR_TOLERANCIA_AFORO = float(factor_tolerancia)

    if buffer_minutos is not None:
        if buffer_minutos < 0 or buffer_minutos > 180:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El buffer entre reservas debe estar entre 0 y 180 minutos."
            )
        BUFFER_MINUTOS_ENTRE_RESERVAS = int(buffer_minutos)

    if severidades is not None:
        valid_severities = {"BAJA", "MEDIA", "ALTA", "CRITICA"}
        cleaned = [s.strip().upper() for s in severidades if s.strip()]
        for s in cleaned:
            if s not in valid_severities:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Severidad inválida '{s}'. Valores permitidos: {sorted(valid_severities)}"
                )
        SEVERIDADES_BLOQUEANTES = cleaned

    return obtener_configuracion_reglas()


def normalizar_datetime_a_naive(dt: Any) -> datetime:
    """Convierte cualquier objeto datetime o string ISO a datetime naive para comparaciones seguras."""
    if isinstance(dt, str):
        # Tratar terminación Z de ISO 8601
        dt_clean = dt.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(dt_clean)
        return parsed.replace(tzinfo=None)
    elif isinstance(dt, datetime):
        return dt.replace(tzinfo=None)
    else:
        raise ValueError(f"Formato de fecha inválido: {dt}")


# ---------------------------------------------------------------------------
# REGLA 1: VALIDACIÓN DE AFORO ESTRICTO POR ESPACIO
# ---------------------------------------------------------------------------
def validar_aforo(capacidad_instalada: int, num_asistentes: int, nombre_espacio: str):
    """
    Regla 1: Rechaza reservas cuyo número de asistentes supere la capacidad autorizada
    aplicando el factor de tolerancia configurable.
    """
    if num_asistentes <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El número de asistentes debe ser mayor a 0."
        )

    capacidad_maxima_permitida = int(capacidad_instalada * (1.0 + FACTOR_TOLERANCIA_AFORO))
    if num_asistentes > capacidad_maxima_permitida:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Conflicto de aforo: El espacio '{nombre_espacio}' tiene una capacidad oficial de "
                f"{capacidad_instalada} personas (máx permitido con tolerancia: {capacidad_maxima_permitida}). "
                f"Se intentaron registrar {num_asistentes} asistentes."
            )
        )


# ---------------------------------------------------------------------------
# REGLA 2: VALIDACIÓN DE NO SOLAPAMIENTO DE HORARIOS Y BUFFER
# ---------------------------------------------------------------------------
def validar_no_solapamiento(
    reservas_existentes: List[dict],
    nuevo_inicio: Any,
    nuevo_fin: Any,
    nombre_item: str
):
    """
    Regla 2: Un espacio o recurso no puede tener reservas simultáneas ni violar
    el buffer mínimo configurable de separación entre reservas.
    """
    inicio_norm = normalizar_datetime_a_naive(nuevo_inicio)
    fin_norm = normalizar_datetime_a_naive(nuevo_fin)

    if inicio_norm >= fin_norm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha/hora de inicio debe ser anterior a la de finalización."
        )

    buffer_delta = timedelta(minutes=BUFFER_MINUTOS_ENTRE_RESERVAS)

    for res in reservas_existentes:
        res_inicio = normalizar_datetime_a_naive(res["inicio"])
        res_fin = normalizar_datetime_a_naive(res["fin"])

        # Conflicto considerando el buffer de preparación
        # Dos intervalos con buffer chocan si: nuevo_inicio < (res_fin + buffer) y nuevo_fin > (res_inicio - buffer)
        if (inicio_norm < (res_fin + buffer_delta)) and (fin_norm > (res_inicio - buffer_delta)):
            detalle_buffer = (
                f" (incluyendo buffer de {BUFFER_MINUTOS_ENTRE_RESERVAS} min)"
                if BUFFER_MINUTOS_ENTRE_RESERVAS > 0
                else ""
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Conflicto de horario: '{nombre_item}' ya cuenta con una reserva activa "
                    f"desde {res_inicio.strftime('%Y-%m-%d %H:%M')} hasta {res_fin.strftime('%Y-%m-%d %H:%M')}{detalle_buffer}."
                )
            )


# ---------------------------------------------------------------------------
# REGLA 3: INTEGRACIÓN SISTÉMICA (BLOQUEO POR INCIDENCIAS ACTIVAS)
# ---------------------------------------------------------------------------
def validar_estado_operativo(
    estado_item: str,
    nombre_item: str,
    tipo_item: str = "espacio",
    incidencias_activas: Optional[List[str]] = None
):
    """
    Regla 3: Un espacio o recurso inhabilitado o con incidencias bloqueantes
    no puede ser reservado ni asignado. Retorna HTTP 423 Locked.
    """
    if estado_item.lower() in ["inhabilitado", "bloqueado", "en_mantenimiento", "fuera_de_servicio"]:
        detalle_extra = f" Incidencias reportadas: {', '.join(incidencias_activas)}" if incidencias_activas else ""
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=(
                f"Operación denegada: El {tipo_item} '{nombre_item}' está actualmente "
                f"INHABILITADO por mantenimiento o incidentes.{detalle_extra}"
            )
        )

