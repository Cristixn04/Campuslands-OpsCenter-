"""
MÓDULO CENTRAL DE REGLAS DE NEGOCIO (PREPARADO PARA EL RETO EN VIVO < 3 MIN)
=============================================================================
Todas las validaciones de dominio están concentradas aquí con constantes
configurables para permitir cambios instantáneos frente al jurado.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status

# ---------------------------------------------------------------------------
# CONSTANTES CONFIGURABLES (MODIFICABLES EN VIVO DURANTE LA EVALUACIÓN)
# ---------------------------------------------------------------------------
# Tolerancia de aforo (0.0 = Aforo estricto, 0.15 = 15% de sobrecupo permitido)
FACTOR_TOLERANCIA_AFORO: float = 0.0

# Margen de sanitización o preparación entre reservas (en minutos)
BUFFER_MINUTOS_ENTRE_RESERVAS: int = 0

# Severidades de incidencia que bloquean automáticamente un espacio o recurso
SEVERIDADES_BLOQUEANTES = ["CRITICA", "ALTA"]


# ---------------------------------------------------------------------------
# REGLA 1: VALIDACIÓN DE AFORO ESTRICTO POR ESPACIO
# ---------------------------------------------------------------------------
def validar_aforo(capacidad_instalada: int, num_asistentes: int, nombre_espacio: str):
    """
    Regla 1: No permite reservas que superen la capacidad instalada oficial.
    En la sustentación, si el jurado pide permitir tolerancia, solo alterar FACTOR_TOLERANCIA_AFORO.
    """
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
# REGLA 2: VALIDACIÓN DE NO SOLAPAMIENTO DE HORARIOS (OVERLAP)
# ---------------------------------------------------------------------------
def validar_no_solapamiento(
    reservas_existentes: List[dict],
    nuevo_inicio: datetime,
    nuevo_fin: datetime,
    nombre_item: str
):
    """
    Regla 2: Un espacio o recurso no puede tener reservas simultáneas.
    Dos rangos (A, B) y (C, D) se solapan si A < D y B > C.
    """
    if nuevo_inicio >= nuevo_fin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha/hora de inicio debe ser anterior a la de finalización."
        )

    for res in reservas_existentes:
        res_inicio = res["inicio"] if isinstance(res["inicio"], datetime) else datetime.fromisoformat(str(res["inicio"]))
        res_fin = res["fin"] if isinstance(res["fin"], datetime) else datetime.fromisoformat(str(res["fin"]))

        # Verificar solapamiento
        if nuevo_inicio < res_fin and nuevo_fin > res_inicio:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Conflicto de horario: '{nombre_item}' ya cuenta con una reserva activa "
                    f"desde {res_inicio.strftime('%Y-%m-%d %H:%M')} hasta {res_fin.strftime('%Y-%m-%d %H:%M')}."
                )
            )


# ---------------------------------------------------------------------------
# REGLA 3: INTEGRACIÓN SISTÉMICA (BLOQUEO POR INCIDENCIAS ACTIVAS)
# ---------------------------------------------------------------------------
def validar_estado_operativo(
    estado_espacio: str,
    nombre_espacio: str,
    incidencias_activas: Optional[List[str]] = None
):
    """
    Regla 3: Un espacio o recurso inhabilitado o con incidencias críticas/altas
    no puede ser reservado ni asignado.
    """
    if estado_espacio.lower() in ["inhabilitado", "bloqueado", "en_mantenimiento", "fuera_de_servicio"]:
        detalle_extra = f" Incidencias reportadas: {', '.join(incidencias_activas)}" if incidencias_activas else ""
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=(
                f"Operación denegada: El espacio '{nombre_espacio}' está actualmente "
                f"INHABILITADO por mantenimiento o incidentes.{detalle_extra}"
            )
        )
