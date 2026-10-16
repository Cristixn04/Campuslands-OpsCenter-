import os
import json
from typing import Optional, List
from pydantic import BaseModel, Field
from app.core.config import settings

class IncidentTriageResult(BaseModel):
    categoria: str = Field(description="Categoría del incidente: Infraestructura, Eléctrico, Hardware/Cómputo, Red/Conectividad, Audiovisual, Climatización o Aseo.")
    severidad: str = Field(description="Nivel de severidad estricto: BAJA, MEDIA, ALTA o CRITICA.")
    espacio_afectado: Optional[str] = Field(None, description="Nombre exacto del espacio afectado si se menciona (Auditorio, Spooki, Apolo, Artemis, Cosmos, Skilab, Blanca, Azul, Amarilla 1, Amarilla 2, Verde 1, Verde 2).")
    recurso_afectado: Optional[str] = Field(None, description="Recurso o equipo afectado si se detecta (ej. Proyector, Micrófonos, Laptop, Router).")
    bloquear_espacio: bool = Field(description="True si la severidad es ALTA o CRITICA e inhabilita el uso seguro del espacio.")
    accion_sugerida: str = Field(description="Acción inmediata recomendada para el personal de operaciones.")
    resumen_ejecutivo: str = Field(description="Resumen conciso en 1 frase de lo ocurrido.")

def analizar_incidencia_con_ia(descripcion: str, espacios_validos: List[str]) -> IncidentTriageResult:
    """
    Realiza el triaje automatizado de incidencias utilizando la API de Google Gemini (gemini-3.8-flash)
    con Structured Outputs (Pydantic Schema).
    """
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.startswith("your_"):
        print("[TRIAJE IA] GEMINI_API_KEY no configurada. Ejecutando motor de contingencia heurístico.")
        return _triage_heuristico_fallback(descripcion, espacios_validos)

    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        prompt = f"""
        Eres el Agente Inteligente de Operaciones y Seguridad de Campuslands.
        Tu misión es analizar el siguiente reporte de incidencia reportado por un miembro del campus,
        evaluar el riesgo operativo, determinar si pone en peligro a personas o clases, y generar el triaje.

        Lista oficial de espacios del campus: {', '.join(espacios_validos)}

        Reporte recibido:
        \"\"\"{descripcion}\"\"\"

        Reglas de Severidad:
        - CRITICA: Riesgo de incendio, fallas estructurales, corto circuito, inundación, sala totalmente inoperable.
        - ALTA: Falla de red general, daño en proyector principal sin reemplazo, aire acondicionado quemado en sala llena.
        - MEDIA: Computador individual lento/dañado, cable HDMI averiado, falta de marcadores.
        - BAJA: Silla desajustada, sugerencia estética, ruido leve.
        """

        interaction = client.interactions.create(
            model="gemini-3.8-flash",
            input=prompt,
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": IncidentTriageResult.model_json_schema()
            }
        )

        return IncidentTriageResult.model_validate_json(interaction.output_text)

    except Exception as e:
        print(f"[TRIAJE IA ERROR] Excepción al invocar Gemini: {e}. Usando contingencia.")
        return _triage_heuristico_fallback(descripcion, espacios_validos)

def _triage_heuristico_fallback(desc: str, espacios_validos: List[str]) -> IncidentTriageResult:
    """Heurística de contingencia para garantizar que el sistema nunca falle si no hay red/cuota."""
    desc_lower = desc.lower()

    # Detectar espacio
    espacio_detectado = None
    for esp in espacios_validos:
        if esp.lower() in desc_lower:
            espacio_detectado = esp
            break

    # Determinar severidad
    if any(k in desc_lower for k in ["fuego", "humo", "chispa", "quemado", "inundaci", "electro", "peligro", "explosi"]):
        severidad = "CRITICA"
        categoria = "Eléctrico / Seguridad"
        bloquear = True
        accion = "Evacuar sala de inmediato, cortar suministro eléctrico y reportar a brigada de emergencias."
    elif any(k in desc_lower for k in ["roto", "no enciende", "sin red", "caido", "apolo", "danado"]):
        severidad = "ALTA"
        categoria = "Hardware / Infraestructura"
        bloquear = True
        accion = "Inhabilitar espacio o equipo y despachar a técnico de soporte."
    else:
        severidad = "MEDIA"
        categoria = "General"
        bloquear = False
        accion = "Programar revisión técnica en la siguiente ronda de mantenimiento."

    return IncidentTriageResult(
        categoria=categoria,
        severidad=severidad,
        espacio_afectado=espacio_detectado,
        recurso_afectado=None,
        bloquear_espacio=bloquear,
        accion_sugerida=accion,
        resumen_ejecutivo=f"Incidente procesado en modo contingencia: {desc[:60]}..."
    )
