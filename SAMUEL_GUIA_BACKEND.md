# Guía Operativa de Backend para Samuel 🚀
### Campuslands OpsCenter — Hackatón 2026: El campus bajo presión
*Documento de contexto técnico, arquitectura, reglas de negocio y trabajo autónomo.*

---

## 👋 ¡Hola Samuel! Bienvenido al equipo

Cristian y tú están construyendo el **Sistema Central de Gestión Operativa Asistido por IA** para Campuslands. 
Este documento contiene **todo lo que necesitas saber** para trabajar de forma 100% autónoma en el Backend sin pisar el trabajo de Frontend de Cristian ni generar conflictos en Git.

---

## 🎯 1. Contexto del Reto y Misión Técnica

Campuslands enfrenta una saturación operativa en el préstamo de equipos, asignación de salas y gestión de incidentes. Los procesos manuales provocan que se reserven aulas dañadas, haya sobrecupos o se solapen clases.

Nuestra misión es entregar un **MVP funcional, robusto y testeable** que unifique:
1. **Módulo 1: Espacios:** 12 salas y cubículos con aforo estricto y disponibilidad en tiempo real.
2. **Módulo 2: Recursos Tecnológicos:** Inventario de hardware (laptops, proyectores, sonido) y trazabilidad de préstamos.
3. **Módulo 3: Incidencias & Triaje con IA:** Clasificación automática de reportes en lenguaje natural, evaluación de severidad y **bloqueo preventivo automático de salas/equipos inoperables**.

---

## 🏛️ 2. Tu Territorio de Trabajo: Carpeta `/backend`

El proyecto es un **Monorepo desacoplado**:
* **Cristian (Frontend):** Trabaja en `/frontend` en la rama `feat/frontend`.
* **Samuel (Backend - Tú):** Trabajas en `/backend` en la rama `feat/backend`.

### Estructura de tu carpeta `/backend`:
```
backend/
├── Dockerfile                  # Imagen Python 3.12-slim con dependencias
├── requirements.txt            # FastAPI, SQLAlchemy, psycopg, google-genai, pydantic
└── app/
    ├── main.py                 # Instancia FastAPI, CORS y ciclo de vida (startup/seed)
    ├── core/
    │   ├── config.py           # Variables de entorno (.env) validadas con Pydantic
    │   └── business_rules.py   # 🚨 LAS 3 REGLAS DE NEGOCIO (Reto en vivo < 3 min)
    ├── db/
    │   ├── session.py          # Conexión SQLAlchemy a PostgreSQL
    │   ├── models.py           # Modelos ORM: Espacio, Recurso, Reserva, Incidencia
    │   └── seed.py             # Carga automática del dataset oficial desde data/campus_seed.json
    ├── routers/
    │   ├── spaces.py           # GET/PATCH /api/spaces (disponibilidad y aforos)
    │   ├── resources.py        # GET/PATCH /api/resources (inventario tecnológico)
    │   ├── reservations.py     # GET/POST /api/reservations (motor de reservas con validaciones)
    │   ├── incidents.py        # GET/POST/PATCH /api/incidents (triaje IA y resolución)
    │   └── external.py         # GET /api/external/qr-url (Pases QR de check-in)
    └── services/
        ├── ai_triage.py        # Integración oficial Google Gemini SDK (gemini-3.8-flash)
        └── notifications.py    # Despacho asíncrono a webhooks (Discord/Slack)
```

---

## 📊 3. Base de Datos PostgreSQL y Dataset Oficial

El dataset oficial de salas y aforos entregado por Campuslands ya está cargado en `data/campus_seed.json` y se siembra automáticamente al levantar la base de datos:

| ID | Nombre del Espacio | Tipo | Capacidad Oficial | Ubicación |
|---|---|---|---|---|
| `esp-01` | **Auditorio** | Auditorio | **100** personas | Edificio Central - Piso 1 |
| `esp-02` | **Spooki** | Aula Magna | **38** personas | Edificio A - Piso 2 |
| `esp-03` | **Apolo** | Aula Tecnológica | **34** personas | Edificio B - Piso 1 |
| `esp-04` | **Artemis** | Aula Tecnológica | **32** personas | Edificio B - Piso 2 |
| `esp-05` | **Cosmos** | Aula Teórica | **25** personas | Edificio A - Piso 1 |
| `esp-06` | **Skilab** | Laboratorio IA | **20** personas | Edificio C - Piso 1 |
| `esp-07` | **Blanca** | Sala Reuniones | **12** personas | Co-working - Piso 2 |
| `esp-08` | **Azul** | Sala Reuniones | **10** personas | Co-working - Piso 2 |
| `esp-09` | **Amarilla 1** | Cubículo | **6** personas | Ala Norte |
| `esp-10` | **Amarilla 2** | Cubículo | **6** personas | Ala Norte |
| `esp-11` | **Verde 1** | Cubículo | **6** personas | Ala Sur |
| `esp-12` | **Verde 2** | Cubículo | **6** personas | Ala Sur |

---

## 🛡️ 4. Las 3 Reglas de Negocio de Dominio (Auditables)

Para asegurar los **25 puntos** del bloque técnico y los **15 puntos** del reto en vivo, las reglas están aisladas en `app/core/business_rules.py`:

### Regla 1: Control Estricto de Aforo
* **Lógica:** Si `asistentes > capacidad_oficial`, la API retorna `HTTP 400 Bad Request`.
* **Reto en vivo:** Si el jurado dice *"Permitan 10% o 15% de sobrecupo"*, solo modificas la constante:
  ```python
  FACTOR_TOLERANCIA_AFORO: float = 0.15  # Listo en 5 segundos
  ```

### Regla 2: No Solapamiento de Horarios (Conflict Detection)
* **Lógica:** Dos reservas en una misma sala o recurso no pueden coincidir en tiempo (`nuevo_inicio < res_fin and nuevo_fin > res_inicio`). Retorna `HTTP 409 Conflict`.
* **Reto en vivo:** Si el jurado pide un buffer de 15 minutos entre reservas para desinfección/cambio de clase:
  ```python
  BUFFER_MINUTOS_ENTRE_RESERVAS: int = 15
  ```

### Regla 3: Integración Sistémica (Bloqueo por Incidencia Crítica)
* **Lógica:** Si un usuario reporta un incidente clasificado como `CRITICA` o `ALTA`, el endpoint `/api/incidents` cambia automáticamente el estado del espacio a `inhabilitado`. Cualquier intento posterior de reserva sobre esa sala arroja `HTTP 423 Locked`.
* **Desbloqueo:** Cuando el personal resuelve la incidencia vía `PATCH /api/incidents/{id}/resolve`, la sala vuelve automáticamente a `disponible`.
* **Reto en vivo:** Si el jurado pide que las incidencias `MEDIA` también bloqueen la sala:
  ```python
  SEVERIDADES_BLOQUEANTES = ["CRITICA", "ALTA", "MEDIA"]
  ```

---

## 🧠 5. Integración con IA (Google Gemini SDK)

* **Archivo:** `app/services/ai_triage.py`
* **Modelo:** `gemini-3.8-flash` usando el SDK oficial más reciente `from google import genai`.
* **Structured Output:** Utilizamos `response_format` con esquema Pydantic (`IncidentTriageResult.model_json_schema()`), lo que garantiza que la IA devuelva siempre JSON estricto con:
  - `categoria`: (Eléctrico, Red, Infraestructura, etc.)
  - `severidad`: (`CRITICA`, `ALTA`, `MEDIA`, `BAJA`)
  - `espacio_afectado`: Nombre detectado de la sala (ej. "Apolo")
  - `bloquear_espacio`: `True` / `False`
  - `accion_sugerida`: Recomendación operativa
* **Modo Contingencia (Anti-Penalización):** Si la API Key no está configurada o no hay internet, el sistema incluye una heurística inteligente basada en palabras clave para que el servidor **nunca lance un 500 ni se caiga en la evaluación**.

---

## 🛠️ 6. Cómo Ejecutar y Probar el Backend

### Paso A: Clonar y crear tu rama
```bash
git clone <URL_REPOSITORIO>
cd Hackaton
git checkout -b feat/backend
```

### Paso B: Configurar `.env` (¡NUNCA lo subas a Git!)
```bash
cp .env.example .env
```
Edita `.env` y agrega tu clave de Gemini:
```env
GEMINI_API_KEY=AIzaSy...
```

### Paso C: Levantar con Docker Compose
```bash
# Levantar PostgreSQL y FastAPI en segundo plano:
docker compose up db backend --build -d

# Ver los logs en tiempo real:
docker compose logs -f backend
```

### Paso D: Swagger UI y Documentación Interactiva
Abre en tu navegador:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

Desde Swagger puedes probar interactivamente todos los endpoints:
- `GET /api/spaces`
- `GET /api/resources`
- `POST /api/reservations`
- `POST /api/incidents`
- `PATCH /api/incidents/{id}/resolve`
- `GET /api/external/qr-url`

---

## 🚀 7. Ideas de Trabajo Autónomo para Samuel (Para sumar puntos extras)

Si quieres seguir potenciando el backend mientras Cristian diseña el frontend, aquí tienes ideas de alto impacto:

1. **Endpoint de Métricas Operativas:**
   - Crear `GET /api/analytics/summary` que retorne porcentaje de ocupación del campus, número de incidencias abiertas vs resueltas y salas más solicitadas.
2. **Recomendador de Salas con IA:**
   - Crear `POST /api/spaces/recommend`: Un endpoint donde un usuario envía: *"Necesito ubicar a 28 estudiantes con proyector mañana de 2pm a 4pm"* y la IA sugiere las salas que cumplen aforo y están libres (ej: `Apolo` o `Artemis`).
3. **Filtro de Disponibilidad por Rango Horario:**
   - En `GET /api/spaces`, permitir query params `?fecha_inicio=...&fecha_fin=...` para listar únicamente las salas que NO tienen reservas en ese horario.
4. **Historial y Logs de Trazabilidad:**
   - Registrar quién inhabilitó una sala y a qué hora fue restaurada.

---

## 🔒 8. Reglas de Oro de Seguridad
- **NUNCA hagas `git add .env`**. El archivo `.gitignore` ya lo protege, pero siempre verifica con `git status` antes de hacer commit.
- Haz commits frecuentes y descriptivos en tu rama `feat/backend` (ej: `feat(api): add analytics endpoint`).
- Cuando termines un módulo importante, haz push a tu rama:
  ```bash
  git push -u origin feat/backend
  ```

¡Mucho éxito, Samuel! Tienes una base técnica sólida y lista para ganar la hackatón. 🏆
