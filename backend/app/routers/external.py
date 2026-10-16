from fastapi import APIRouter
from app.services.weather_service import obtener_alerta_clima_campus

router = APIRouter(prefix="/external", tags=["APIs Externas"])

@router.get("/weather")
async def consultar_clima():
    """
    Retorna datos climáticos en tiempo real y alertas preventivas para Campuslands.
    Utiliza la API de Open-Meteo sin necesidad de API key.
    """
    return await obtener_alerta_clima_campus()

@router.get("/qr-url")
def generar_qr_checkin(tipo: str, id_item: str):
    """
    Genera la URL de un código QR rápido usando la API pública api.qrserver.com
    para pases digitales de check-in en aulas o préstamos de recursos.
    """
    payload = f"CAMPUSLANDS-CHECKIN:{tipo.upper()}:{id_item}"
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={payload}"
    return {
        "payload": payload,
        "qr_url": qr_url
    }
