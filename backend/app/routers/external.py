from fastapi import APIRouter

router = APIRouter(prefix="/external", tags=["APIs Externas"])

@router.get("/qr-url")
def generar_qr_checkin(tipo: str, id_item: str):
    """
    Genera la URL de un código QR rápido usando la API de qrserver.com
    para pases digitales de check-in en aulas o préstamos de recursos tecnológicos.
    """
    payload = f"CAMPUSLANDS-CHECKIN:{tipo.upper()}:{id_item}"
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={payload}"
    return {
        "payload": payload,
        "qr_url": qr_url
    }
