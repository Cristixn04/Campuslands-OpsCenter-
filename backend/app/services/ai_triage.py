import os
import json
from typing import Optional, List
from pydantic import BaseModel, Field
from app.core.config import settings

class IncidentTriageResult(BaseModel):
    categoria: str = Field(description="Categoría del incidente: Infraestructura, Eléctrico, Hardware/Cómputo, Red/Conectividad, Audiovisual, Climatización o Aseo.")
    severidad: str = Field(description="Nivel de severidad estricto: BAJA, MEDIA, ALTA o CRITICA.")
    espacio_afectado: Optional[str] = Field(None, description="Nombre exacto del espacio afectado si se menciona explícitamente en el reporte, o null.")
    recurso_afectado: Optional[str] = Field(None, description="Recurso o equipo tecnológico afectado si se detecta, o null.")
    bloquear_espacio: bool = Field(description="True si la severidad es ALTA o CRITICA e inhabilita el uso seguro del espacio o recurso.")
    accion_sugerida: str = Field(description="Acción inmediata recomendada para el personal de operaciones.")
    resumen_ejecutivo: str = Field(description="Resumen conciso en 1 frase de lo ocurrido.")

def analizar_incidencia_con_ia(descripcion: str, espacios_validos: List[str]) -> IncidentTriageResult:
    """
    Realiza el triaje automatizado de incidencias utilizando la API de Google Gemini (google-genai SDK)
    con Structured Outputs (Pydantic Schema). Si la API no está configurada o falla, usa fallback heurístico.
    """
    api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""

    if not api_key or api_key.startswith("your_") or api_key == "tu_api_key_aqui":
        return _triage_heuristico_fallback(descripcion, espacios_validos)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

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

        Si el reporte no menciona explícitamente o claramente uno de los espacios oficiales, deja espacio_afectado en null.
        No inventes espacios que no aparezcan en el texto.
        """

        # En el SDK google-genai moderno, se usa client.models.generate_content
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=IncidentTriageResult
            )
        )

        raw_text = response.text or ""
        parsed_result = IncidentTriageResult.model_validate_json(raw_text)

        # Validar consistencia del espacio detectado contra la lista oficial
        if parsed_result.espacio_afectado:
            match = None
            for esp in espacios_validos:
                if esp.lower() == parsed_result.espacio_afectado.lower():
                    match = esp
                    break
            parsed_result.espacio_afectado = match

        # Consistencia obligatoria de bloqueo: solo ALTA o CRITICA
        if parsed_result.severidad in ["CRITICA", "ALTA"]:
            parsed_result.bloquear_espacio = True
        else:
            parsed_result.bloquear_espacio = False

        return parsed_result

    except Exception as e:
        print(f"[TRIAJE IA FALLBACK] Detalle: {e}. Activando contingencia determinista.")
        return _triage_heuristico_fallback(descripcion, espacios_validos)

def _triage_heuristico_fallback(desc: str, espacios_validos: List[str]) -> IncidentTriageResult:
    """Heurística determinista de contingencia para garantizar alta disponibilidad sin error 500."""
    desc_lower = desc.lower()

    # Detectar espacio únicamente si se menciona explícitamente
    espacio_detectado = None
    for esp in espacios_validos:
        # Búsqueda por palabra completa o match seguro
        if esp.lower() in desc_lower:
            espacio_detectado = esp
            break

    # Detectar recurso tecnológico si se menciona
    recurso_detectado = None
    palabras_recursos = {
        "proyector": "Proyector Láser Epson 4K",
        "micrófono": "Kit Micrófonos Inalámbricos Shure",
        "microfono": "Kit Micrófonos Inalámbricos Shure",
        "laptop": "Laptop Dell XPS Dev Lab",
        "dell": "Laptop Dell XPS Dev Lab",
        "cámara": "Cámara Streaming PTZ Sony",
        "camara": "Cámara Streaming PTZ Sony",
        "router": "Router Cisco Gigabit Móvil",
        "switch": "Switch de Red 24 Puertos PoE",
    }
    for palabra, rec_nom in palabras_recursos.items():
        if palabra in desc_lower:
            recurso_detectado = rec_nom
            break

    # Determinar severidad determinista
    palabras_criticas = ["fuego", "humo", "chispa", "quemado", "inundaci", "electro", "peligro", "explosi", "incendio", "corto circuito"]
    palabras_altas = ["roto", "no enciende", "sin red", "caido", "caído", "danado", "dañado", "sin luz", "apagado total", "inoperable"]
    palabras_medias = ["lento", "cable", "hdmi", "parpadea", "falla intermitente", "sin marcador"]

    if any(k in desc_lower for k in palabras_criticas):
        severidad = "CRITICA"
        categoria = "Eléctrico / Seguridad"
        bloquear = True
        accion = "Evacuar sala de inmediato, cortar suministro eléctrico y reportar a brigada de emergencias."
    elif any(k in desc_lower for k in palabras_altas):
        severidad = "ALTA"
        categoria = "Hardware / Infraestructura"
        bloquear = True
        accion = "Inhabilitar espacio o equipo afectado y despachar técnico de soporte urgente."
    elif any(k in desc_lower for k in palabras_medias):
        severidad = "MEDIA"
        categoria = "Tecnología / Soporte"
        bloquear = False
        accion = "Programar revisión técnica en la siguiente ronda de mantenimiento."
    else:
        severidad = "BAJA"
        categoria = "Mantenimiento General"
        bloquear = False
        accion = "Registrar observación en bitácora de mantenimiento preventivo."

    return IncidentTriageResult(
        categoria=categoria,
        severidad=severidad,
        espacio_afectado=espacio_detectado,
        recurso_afectado=recurso_detectado,
        bloquear_espacio=bloquear,
        accion_sugerida=accion,
        resumen_ejecutivo=f"Incidente procesado en modo contingencia: {desc[:60]}..."
    )

