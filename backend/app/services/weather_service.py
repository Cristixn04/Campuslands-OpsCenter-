import httpx
from app.core.config import settings

async def obtener_alerta_clima_campus() -> dict:
    """
    Consume la API pública de Open-Meteo para obtener condiciones meteorológicas
    en tiempo real para Campuslands (Bucaramanga / Floridablanca).
    Genera alertas preventivas operativas para el campus.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={settings.CAMPUS_LAT}&longitude={settings.CAMPUS_LON}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m"
    )
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                current = data.get("current", {})
                temp = current.get("temperature_2m", 25.0)
                precip = current.get("precipitation", 0.0)
                wind = current.get("wind_speed_10m", 5.0)

                # Regla de alerta meteorológica para espacios
                alerta = "Condiciones climáticas normales en el campus."
                nivel = "NORMAL"
                if precip > 2.0 or wind > 30.0:
                    alerta = "Alerta meteorológica: Lluvias intensas o vientos fuertes. Se recomienda suspender préstamos de equipos portátiles a cubículos descubiertos y revisar filtraciones."
                    nivel = "PRECAUCIÓN"

                return {
                    "ubicacion": "Campuslands (Floridablanca / Bucaramanga)",
                    "temperatura_c": temp,
                    "precipitacion_mm": precip,
                    "viento_kmh": wind,
                    "nivel_alerta": nivel,
                    "mensaje": alerta
                }
    except Exception as e:
        print(f"[WEATHER API ERROR] No se pudo consultar Open-Meteo: {e}")

    return {
        "ubicacion": "Campuslands",
        "temperatura_c": 24.0,
        "precipitacion_mm": 0.0,
        "viento_kmh": 8.0,
        "nivel_alerta": "NORMAL",
        "mensaje": "Condiciones meteorológicas estables."
    }
