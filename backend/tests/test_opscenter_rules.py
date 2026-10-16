import uuid
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core import business_rules
from app.db.session import SessionLocal
from app.db.models import Espacio, Recurso, Reserva, Incidencia

client = TestClient(app)

SEED_ESPACIO_IDS = {f"esp-{i:02d}" for i in range(1, 13)}
SEED_RECURSO_IDS = {f"rec-{i:02d}" for i in range(1, 7)}

@pytest.fixture(autouse=True)
def reset_rules_and_data():
    """Resetea las reglas a su valor por defecto y asegura aislamiento de datos."""
    business_rules.FACTOR_TOLERANCIA_AFORO = 0.0
    business_rules.BUFFER_MINUTOS_ENTRE_RESERVAS = 0
    business_rules.SEVERIDADES_BLOQUEANTES = ["CRITICA", "ALTA"]

    db = SessionLocal()
    try:
        db.query(Reserva).delete()
        db.query(Incidencia).delete()
        # Eliminar registros creados dinámicamente por tests anteriores
        for e in db.query(Espacio).all():
            if e.id not in SEED_ESPACIO_IDS:
                db.delete(e)
            else:
                e.estado = "disponible"
        for r in db.query(Recurso).all():
            if r.id not in SEED_RECURSO_IDS:
                db.delete(r)
            else:
                r.estado = "disponible"
        db.commit()
    finally:
        db.close()
    yield



# ---------------------------------------------------------------------------
# 1. Auditorio con 101 personas y tolerancia cero: rechazo 400
# ---------------------------------------------------------------------------
def test_regla_1_auditorio_sobrecupo_rechazado_400():
    business_rules.FACTOR_TOLERANCIA_AFORO = 0.0
    # Auditorio tiene capacidad instalada de 100
    payload = {
        "espacio_id": "esp-01",
        "solicitante": "Test Runner",
        "motivo": "Charla Magistral Masiva",
        "asistentes": 101,
        "fecha_inicio": "2026-11-01T10:00:00Z",
        "fecha_fin": "2026-11-01T12:00:00Z"
    }
    response = client.post("/api/reservations", json=payload)
    assert response.status_code == 400
    assert "Conflicto de aforo" in response.json()["detail"]


# ---------------------------------------------------------------------------
# 2. Aforo dentro del límite permitido con tolerancia configurada: aceptación
# ---------------------------------------------------------------------------
def test_regla_1_auditorio_con_tolerancia_aceptado_201():
    # Con 10% de tolerancia: 100 * 1.10 = 110 permitido
    business_rules.FACTOR_TOLERANCIA_AFORO = 0.10
    payload = {
        "espacio_id": "esp-01",
        "solicitante": "Test Runner",
        "motivo": "Charla Magistral con Sobrecupo Permitido",
        "asistentes": 108,
        "fecha_inicio": "2026-11-01T06:00:00Z",
        "fecha_fin": "2026-11-01T08:00:00Z"
    }
    response = client.post("/api/reservations", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["asistentes"] == 108
    assert data["estado"] == "activa"


# ---------------------------------------------------------------------------
# 3. Dos reservas solapadas para el mismo espacio: rechazo 409
# ---------------------------------------------------------------------------
def test_regla_2_solapamiento_mismo_espacio_rechazado_409():
    base_time = datetime(2026, 11, 2, 10, 0)
    # Reserva 1: 10:00 a 12:00 en Spooki (esp-02)
    payload_1 = {
        "espacio_id": "esp-02",
        "solicitante": "Docente A",
        "motivo": "Clase Programación",
        "asistentes": 20,
        "fecha_inicio": base_time.isoformat(),
        "fecha_fin": (base_time + timedelta(hours=2)).isoformat()
    }
    res_1 = client.post("/api/reservations", json=payload_1)
    assert res_1.status_code == 201

    # Reserva 2 solapada: 11:00 a 13:00 en Spooki
    payload_2 = {
        "espacio_id": "esp-02",
        "solicitante": "Docente B",
        "motivo": "Taller DevOps",
        "asistentes": 25,
        "fecha_inicio": (base_time + timedelta(hours=1)).isoformat(),
        "fecha_fin": (base_time + timedelta(hours=3)).isoformat()
    }
    res_2 = client.post("/api/reservations", json=payload_2)
    assert res_2.status_code == 409
    assert "Conflicto de horario" in res_2.json()["detail"]


# ---------------------------------------------------------------------------
# 4. Reservas separadas por menos del buffer configurado: rechazo 409
# ---------------------------------------------------------------------------
def test_regla_2_buffer_insuficiente_rechazado_409():
    business_rules.BUFFER_MINUTOS_ENTRE_RESERVAS = 15
    base_time = datetime(2026, 11, 3, 14, 0)
    # Reserva 1: 14:00 a 15:00 en Apolo (esp-03)
    payload_1 = {
        "espacio_id": "esp-03",
        "solicitante": "Grupo 1",
        "motivo": "Sustentación",
        "asistentes": 15,
        "fecha_inicio": base_time.isoformat(),
        "fecha_fin": (base_time + timedelta(hours=1)).isoformat()
    }
    res_1 = client.post("/api/reservations", json=payload_1)
    assert res_1.status_code == 201

    # Reserva 2: 15:05 a 16:00 (solo 5 min de margen, requiere 15)
    payload_2 = {
        "espacio_id": "esp-03",
        "solicitante": "Grupo 2",
        "motivo": "Sustentación 2",
        "asistentes": 15,
        "fecha_inicio": (base_time + timedelta(hours=1, minutes=5)).isoformat(),
        "fecha_fin": (base_time + timedelta(hours=2)).isoformat()
    }
    res_2 = client.post("/api/reservations", json=payload_2)
    assert res_2.status_code == 409
    assert "buffer" in res_2.json()["detail"].lower()


# ---------------------------------------------------------------------------
# 5. Reservas compatibles que respetan el buffer: aceptación
# ---------------------------------------------------------------------------
def test_regla_2_buffer_respetado_aceptado_201():
    business_rules.BUFFER_MINUTOS_ENTRE_RESERVAS = 15
    base_time = datetime(2026, 11, 4, 8, 0)
    # Reserva 1: 08:00 a 09:00 en Artemis (esp-04)
    payload_1 = {
        "espacio_id": "esp-04",
        "solicitante": "Grupo A",
        "motivo": "Reunión",
        "asistentes": 10,
        "fecha_inicio": base_time.isoformat(),
        "fecha_fin": (base_time + timedelta(hours=1)).isoformat()
    }
    res_1 = client.post("/api/reservations", json=payload_1)
    assert res_1.status_code == 201

    # Reserva 2: 09:15 a 10:15 (exactamente 15 min de margen)
    payload_2 = {
        "espacio_id": "esp-04",
        "solicitante": "Grupo B",
        "motivo": "Reunión B",
        "asistentes": 10,
        "fecha_inicio": (base_time + timedelta(hours=1, minutes=15)).isoformat(),
        "fecha_fin": (base_time + timedelta(hours=2, minutes=15)).isoformat()
    }
    res_2 = client.post("/api/reservations", json=payload_2)
    assert res_2.status_code == 201


# ---------------------------------------------------------------------------
# 6. Espacio bloqueado por incidente crítico: rechazo 423
# ---------------------------------------------------------------------------
def test_regla_3_bloqueo_por_incidencia_critica_rechazo_423():
    # Reportar incidente crítico en Cosmos (esp-05)
    inc_payload = {
        "descripcion": "Corto circuito con fuego y humo en el aula Cosmos",
        "espacio_id_manual": "esp-05"
    }
    inc_res = client.post("/api/incidents", json=inc_payload)
    assert inc_res.status_code == 201
    assert inc_res.json()["severidad"] in ["CRITICA", "ALTA"]

    # Verificar que el espacio Cosmos esté inhabilitado
    esp_res = client.get("/api/spaces/esp-05")
    assert esp_res.json()["estado"] == "inhabilitado"

    # Intentar reservar en Cosmos bloqueado
    reserva_payload = {
        "espacio_id": "esp-05",
        "solicitante": "Victima Inocente",
        "motivo": "Intento de clase",
        "asistentes": 10,
        "fecha_inicio": "2026-11-05T10:00:00Z",
        "fecha_fin": "2026-11-05T12:00:00Z"
    }
    res = client.post("/api/reservations", json=reserva_payload)
    assert res.status_code == 423
    assert "INHABILITADO" in res.json()["detail"]


# ---------------------------------------------------------------------------
# 7. Incidente de severidad media o baja: no bloquea indebidamente
# ---------------------------------------------------------------------------
def test_regla_3_incidente_leve_no_bloquea():
    # Skilab (esp-06) inicia disponible
    client.patch("/api/spaces/esp-06/status", json={"estado": "disponible"})

    # Incidente leve
    inc_payload = {
        "descripcion": "Una silla tiene la pata floja en Skilab",
        "espacio_id_manual": "esp-06"
    }
    inc_res = client.post("/api/incidents", json=inc_payload)
    assert inc_res.status_code == 201
    assert inc_res.json()["severidad"] in ["BAJA", "MEDIA"]

    # Skilab debe continuar disponible
    esp_res = client.get("/api/spaces/esp-06")
    assert esp_res.json()["estado"] == "disponible"

    # La reserva debe permitirse
    reserva_payload = {
        "espacio_id": "esp-06",
        "solicitante": "Profesor Skilab",
        "motivo": "Laboratorio IA",
        "asistentes": 12,
        "fecha_inicio": "2026-11-06T10:00:00Z",
        "fecha_fin": "2026-11-06T12:00:00Z"
    }
    res = client.post("/api/reservations", json=reserva_payload)
    assert res.status_code == 201


# ---------------------------------------------------------------------------
# 8. Dos incidentes bloqueantes sobre el mismo espacio: resolver uno mantiene el bloqueo
# ---------------------------------------------------------------------------
def test_regla_3_multi_incidente_mantiene_bloqueo():
    # Reportar 2 incidentes críticos en Blanca (esp-07)
    inc_1 = client.post("/api/incidents", json={
        "descripcion": "Fuga de agua grave en sala Blanca",
        "espacio_id_manual": "esp-07"
    }).json()

    inc_2 = client.post("/api/incidents", json={
        "descripcion": "Corto circuito en Blanca",
        "espacio_id_manual": "esp-07"
    }).json()

    # Blanca debe estar inhabilitada
    assert client.get("/api/spaces/esp-07").json()["estado"] == "inhabilitado"

    # Resolver solo el incidente 1
    client.patch(f"/api/incidents/{inc_1['id']}/resolve")

    # Blanca aún debe continuar inhabilitada porque inc_2 sigue abierto
    assert client.get("/api/spaces/esp-07").json()["estado"] == "inhabilitado"


# ---------------------------------------------------------------------------
# 9. Resolver el último incidente bloqueante permite volver a reservar
# ---------------------------------------------------------------------------
def test_regla_3_resolver_ultimo_incidente_reabilita_reserva():
    # Siguiendo con Blanca (esp-07), buscar incidentes abiertos y resolverlos todos
    incidencias = client.get("/api/incidents").json()
    for inc in incidencias:
        if inc["espacio_id"] == "esp-07" and inc["estado"] != "RESUELTA":
            client.patch(f"/api/incidents/{inc['id']}/resolve")

    # Ahora Blanca debe estar disponible
    assert client.get("/api/spaces/esp-07").json()["estado"] == "disponible"

    # Ahora sí debe permitir crear reserva
    res = client.post("/api/reservations", json={
        "espacio_id": "esp-07",
        "solicitante": "Equipo Directivo",
        "motivo": "Reunión Post Mantenimiento",
        "asistentes": 8,
        "fecha_inicio": "2026-11-07T14:00:00Z",
        "fecha_fin": "2026-11-07T16:00:00Z"
    })
    assert res.status_code == 201


# ---------------------------------------------------------------------------
# 10. Cancelar una reserva libera la disponibilidad
# ---------------------------------------------------------------------------
def test_cancelar_reserva_libera_disponibilidad():
    base_time = datetime(2026, 11, 8, 10, 0)
    # Crear reserva en Azul (esp-08)
    res_1 = client.post("/api/reservations", json={
        "espacio_id": "esp-08",
        "solicitante": "Usuario A",
        "motivo": "Entrevista",
        "asistentes": 5,
        "fecha_inicio": base_time.isoformat(),
        "fecha_fin": (base_time + timedelta(hours=2)).isoformat()
    }).json()

    # Cancelar la reserva
    cancel_res = client.patch(f"/api/reservations/{res_1['id']}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["estado"] == "cancelada"

    # Ahora otro usuario puede reservar el mismo horario exactamente
    res_2 = client.post("/api/reservations", json={
        "espacio_id": "esp-08",
        "solicitante": "Usuario B",
        "motivo": "Entrevista Reasignada",
        "asistentes": 5,
        "fecha_inicio": base_time.isoformat(),
        "fecha_fin": (base_time + timedelta(hours=2)).isoformat()
    })
    assert res_2.status_code == 201


# ---------------------------------------------------------------------------
# 11. Gemini sin clave o con fallo: fallback funcional, sin error 500
# ---------------------------------------------------------------------------
def test_gemini_fallback_sin_clave_retorna_201_sin_error_500():
    # Descripción de prueba sin API key
    res = client.post("/api/incidents", json={
        "descripcion": "Se cayó la conexión de red en Apolo y no hay internet",
        "espacio_id_manual": None
    })
    assert res.status_code == 201
    data = res.json()
    assert data["severidad"] in ["CRITICA", "ALTA", "MEDIA", "BAJA"]
    assert data["categoria"] is not None
    assert data["estado"] == "ABIERTA"


# ---------------------------------------------------------------------------
# 12. Persistencia e inicialización en PostgreSQL mediante endpoints reales
# ---------------------------------------------------------------------------
def test_persistencia_dataset_oficial_postgresql():
    spaces_res = client.get("/api/spaces")
    assert spaces_res.status_code == 200
    spaces = spaces_res.json()
    assert len(spaces) >= 12

    # Verificar que el Auditorio tiene capacidad 100 y Spooki 38
    auditorio = next((s for s in spaces if s["nombre"] == "Auditorio"), None)
    assert auditorio is not None
    assert auditorio["capacidad"] == 100

    spooki = next((s for s in spaces if s["nombre"] == "Spooki"), None)
    assert spooki is not None
    assert spooki["capacidad"] == 38

    resources_res = client.get("/api/resources")
    assert resources_res.status_code == 200
    resources = resources_res.json()
    assert len(resources) >= 6


# ---------------------------------------------------------------------------
# 13. Espacios: creación con ID automático y prefijo esp-
# ---------------------------------------------------------------------------
def test_espacio_creacion_id_automatico_prefijo_esp():
    nombre_dinamico = f"Sala Innovacion {uuid.uuid4().hex[:6]}"
    payload = {
        "nombre": nombre_dinamico,
        "tipo": "laboratorio",
        "capacidad": 15,
        "ubicacion": "Piso 5 - Ala Este",
        "estado": "disponible"
    }
    res = client.post("/api/spaces", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["id"].startswith("esp-")
    assert data["nombre"] == payload["nombre"]
    assert data["capacidad"] == 15
    assert data["estado"] == "disponible"


# ---------------------------------------------------------------------------
# 14. Espacios: rechazo de ID duplicado y nombre duplicado con HTTP 400
# ---------------------------------------------------------------------------
def test_espacio_rechazo_duplicados_id_y_nombre_400():
    # ID duplicado con espacio existente esp-01 (Auditorio)
    res_id = client.post("/api/spaces", json={
        "id": "esp-01",
        "nombre": "Auditorio Clonado",
        "tipo": "auditorio",
        "capacidad": 50,
        "ubicacion": "Piso 1"
    })
    assert res_id.status_code == 400
    assert "Ya existe un espacio con el ID" in res_id.json()["detail"]

    # Nombre duplicado con espacio existente "Auditorio"
    res_nom = client.post("/api/spaces", json={
        "nombre": "Auditorio",
        "tipo": "auditorio",
        "capacidad": 80,
        "ubicacion": "Piso 2"
    })
    assert res_nom.status_code == 400
    assert "Ya existe un espacio con el nombre" in res_nom.json()["detail"]


# ---------------------------------------------------------------------------
# 15. Espacios: validación de estado inválido y PATCH status
# ---------------------------------------------------------------------------
def test_espacio_validacion_estado_invalido_y_patch_status():
    # Creación con estado inválido
    res_inv = client.post("/api/spaces", json={
        "nombre": f"Sala Test Estado {uuid.uuid4().hex[:4]}",
        "tipo": "aula",
        "capacidad": 20,
        "ubicacion": "Piso 3",
        "estado": "destruido"
    })
    assert res_inv.status_code == 400
    assert "inválido" in res_inv.json()["detail"]

    # PATCH a estado válido
    patch_res = client.patch("/api/spaces/esp-01/status", json={"estado": "ocupado"})
    assert patch_res.status_code == 200
    assert patch_res.json()["estado"] == "ocupado"

    # PATCH a estado inválido
    patch_inv = client.patch("/api/spaces/esp-01/status", json={"estado": "fuera_de_servicio"})
    assert patch_inv.status_code == 400
    assert "inválido" in patch_inv.json()["detail"]


# ---------------------------------------------------------------------------
# 16. Recursos: creación con ID automático y prefijo rec-
# ---------------------------------------------------------------------------
def test_recurso_creacion_id_automatico_prefijo_rec():
    serial_dinamico = f"MON-UW-{uuid.uuid4().hex[:8]}"
    payload = {
        "nombre": "Monitor Curvo Ultrawide 34",
        "categoria": "computo",
        "serial": serial_dinamico,
        "ubicacion_actual": "Laboratorio IA"
    }
    res = client.post("/api/resources", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["id"].startswith("rec-")
    assert data["serial"] == serial_dinamico
    assert data["estado"] == "disponible"


# ---------------------------------------------------------------------------
# 17. Recursos: rechazo de ID duplicado y serial duplicado con HTTP 400
# ---------------------------------------------------------------------------
def test_recurso_rechazo_duplicados_id_y_serial_400():
    # ID duplicado con recurso existente rec-01
    res_id = client.post("/api/resources", json={
        "id": "rec-01",
        "nombre": "Copia Recurso 1",
        "categoria": "computo",
        "serial": "SERIAL-UNICO-9999",
        "ubicacion_actual": "Almacén"
    })
    assert res_id.status_code == 400
    assert "Ya existe un recurso con el ID" in res_id.json()["detail"]

    # Serial duplicado con rec-01 ("EPS-4K-9012")
    res_serial = client.post("/api/resources", json={
        "nombre": "Otro Proyector",
        "categoria": "audiovisual",
        "serial": "EPS-4K-9012",
        "ubicacion_actual": "Apolo"
    })
    assert res_serial.status_code == 400
    assert "Ya existe un recurso con el serial" in res_serial.json()["detail"]


# ---------------------------------------------------------------------------
# 18. Recursos: validación de estado inválido y PATCH status
# ---------------------------------------------------------------------------
def test_recurso_validacion_estado_invalido_y_patch_status():
    # Creación con estado inválido
    res_inv = client.post("/api/resources", json={
        "nombre": "Teclado Mecánico",
        "categoria": "computo",
        "serial": "KEY-MECH-001",
        "ubicacion_actual": "Almacén",
        "estado": "quemado"
    })
    assert res_inv.status_code == 400
    assert "inválido" in res_inv.json()["detail"]

    # PATCH a estado válido
    patch_res = client.patch("/api/resources/rec-01/status", json={"estado": "en_mantenimiento"})
    assert patch_res.status_code == 200
    assert patch_res.json()["estado"] == "en_mantenimiento"

    # PATCH a estado inválido
    patch_inv = client.patch("/api/resources/rec-01/status", json={"estado": "averiado"})
    assert patch_inv.status_code == 400
    assert "inválido" in patch_inv.json()["detail"]

