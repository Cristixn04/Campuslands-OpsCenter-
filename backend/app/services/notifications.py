import httpx
from app.core.config import settings

async def notificar_incidencia_critica(espacio: str, severidad: str, resumen: str, accion: str):
    """
    Envía notificación en tiempo real a canal de operaciones si hay webhook configurado.
    """
    print(f"\n🚨 [DISPATCH ALERTA] {severidad} en {espacio}: {resumen} | Acción: {accion}\n")

    if not settings.DISCORD_WEBHOOK_URL or not settings.DISCORD_WEBHOOK_URL.startswith("http"):
        return

    payload = {
        "content": f"🚨 **ALERTA OPERATIVA CAMPUSLANDS**\n**Severidad:** {severidad}\n**Espacio Afectado:** {espacio}\n**Detalle:** {resumen}\n**Acción Requerida:** {accion}"
    }
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.post(settings.DISCORD_WEBHOOK_URL, json=payload)
    except Exception as e:
        print(f"[NOTIFICACION ERROR] No se pudo despachar webhook: {e}")
