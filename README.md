# Campuslands OpsCenter 🚀
### Sistema Central de Gestión Operativa Asistido por Inteligencia Artificial
*Hackatón Campuslands 2026: El campus bajo presión*

---

## 👥 Integrantes del Equipo y Roles

- **Cristian**: Líder de Frontend y Experiencia de Usuario (UI/UX)
  - **Territorio:** Carpeta `/frontend` (Rama `feat/frontend`)
  - **Tecnologías:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Samuel**: Líder de Backend, Datos y Arquitectura de IA
  - **Territorio:** Carpeta `/backend` (Rama `feat/backend`)
  - **Tecnologías:** Python 3.12, FastAPI, PostgreSQL, SQLAlchemy, Google Gemini SDK (`google-genai`), Docker.

---

## 📋 Descripción del Problema y Misión

Campuslands enfrenta retos diarios en disponibilidad de espacios (12 aulas y cubículos), préstamos de recursos tecnológicos e incidencias operativas. Procesos manuales provocan solapamientos de clases, sobrecupos y asignación de salas inoperables.

**Campuslands OpsCenter** unifica en un solo flujo operativo:
1. **Control de Espacios y Aforos:** Visualización del estado en tiempo real y asignación con prevención de conflictos.
2. **Control y Trazabilidad de Recursos:** Catálogo de equipos tecnológicos asociados a espacios y personas.
3. **Triaje Inteligente de Incidencias con IA:** Clasificación automática, asignación de severidad y **bloqueo preventivo de aulas/equipos** ante riesgos operativos críticos.

---

## ⚙️ Stack Tecnológico

| Capa | Tecnología | Justificación Técnica |
|---|---|---|
| **Contenedores** | Docker & Docker Compose | Entorno reproducible y portable sin dependencias locales. |
| **Base de Datos** | PostgreSQL 16 | ACID, transaccional, relaciones entre espacios, reservas e incidencias. |
| **Backend API** | FastAPI + SQLAlchemy (Python 3.12) | Alto rendimiento, Swagger/OpenAPI autogenerado en `/docs`, validación Pydantic. |
| **Inteligencia Artificial** | Google Gemini SDK (`gemini-3.8-flash`) | Structured Outputs con esquema JSON para triaje determinista sin alucinaciones. |
| **Frontend** | React 19 + TypeScript + Tailwind CSS | Interfaz ultra responsiva, feedback visual inmediato y badges de estado. |
| **APIs Externas** | QR Server API & Discord Webhooks | Generación instantánea de pases de acceso QR y alertas críticas en tiempo real. |

---

## 🧠 Integración Estratégica de Inteligencia Artificial

- **Modelo:** `gemini-3.8-flash` mediante la librería oficial de Google GenAI SDK.
- **Flujo:** Cuando un usuario reporta una falla en lenguaje natural (*ej: "El proyector de Apolo sacó chispas y la sala quedó sin luz"*):
  1. La IA evalúa la descripción con respecto al mapa oficial del campus.
  2. Genera un objeto estructurado (`categoria`, `severidad`, `espacio_afectado`, `bloquear_espacio`, `accion_sugerida`).
  3. Si la severidad es **CRÍTICA** o **ALTA**, el backend **invalida y bloquea automáticamente** el aula (`Apolo`), impidiendo que nuevos usuarios la reserven hasta que mantenimiento la resuelva.
- **Sin Hardcoding:** La llamada se realiza a la API de Gemini usando variables de entorno seguras (`GEMINI_API_KEY`). Cuenta además con una heurística de contingencia para que el sistema nunca caiga en caso de falla de red o cuota.

---

## 🛡️ Las 3 Reglas de Negocio de Dominio (Auditables)

Todas las reglas de negocio están centralizadas en el archivo `backend/app/core/business_rules.py` para permitir el **reto de modificación en vivo en menos de 3 minutos**:

1. **Regla 1 (Aforo Estricto por Espacio):**
   - Una reserva es rechazada si el número de asistentes supera la capacidad instalada oficial de la sala (ej. Auditorio 100, Spooki 38, Apolo 34, etc.).
   - *Punto de modificación rápida:* Variable `FACTOR_TOLERANCIA_AFORO`.
2. **Regla 2 (No Solapamiento de Horarios):**
   - No se permiten dos reservas activas para un mismo espacio o recurso tecnológico en rangos horarios concurrentes (`inicio_A < fin_B && fin_A > inicio_B`).
   - *Punto de modificación rápida:* Variable `BUFFER_MINUTOS_ENTRE_RESERVAS`.
3. **Regla 3 (Integración Sistémica / Bloqueo por Incidencia):**
   - Si un espacio o recurso se encuentra inhabilitado por una incidencia de severidad `ALTA` o `CRÍTICA`, el sistema rechaza automáticamente cualquier intento de reserva con error `423 Locked`.
   - *Punto de modificación rápida:* Lista `SEVERIDADES_BLOQUEANTES`.

---

## 🏛️ Dataset Oficial de Capacidad Instalada (Zenith Tower - Piso 6)

- **Auditorio:** 100 personas
- **Sputnik:** 38 personas
- **Apolo:** 34 personas
- **Artemis:** 32 personas
- **Cosmos:** 25 personas
- **Skylab:** 20 personas
- **Sala Blanca:** 12 personas
- **Sala Azul:** 10 personas
- **Sala Amarilla A:** 6 personas
- **Sala Amarilla B:** 6 personas
- **Sala Verde A:** 6 personas
- **Sala Verde B:** 6 personas

*(Los datos se cargan automáticamente desde `data/campus_seed.json` al iniciar PostgreSQL).*

---

## 🚀 Guía de Instalación y Ejecución con Docker

### 1. Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd Hackaton
```

### 2. Configurar variables de entorno (Sin subir credenciales a Git)
```bash
cp .env.example .env
```
Edita `.env` y coloca tu API Key de Gemini:
```env
GEMINI_API_KEY=tu_api_key_aqui
```

### 3. Levantar la plataforma con Docker Compose
```bash
docker compose up --build -d
```

### 4. Acceso a los Servicios
- **Frontend (Cristian):** [http://localhost:5173](http://localhost:5173)
- **Backend API & Swagger Docs (Samuel):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Base de Datos PostgreSQL:** Puerto host `5435` (interno `5432`)

---

## 🌿 Flujo de Trabajo en Git (Cero Conflictos)

1. `main`: Rama protegida y base del proyecto.
2. `feat/frontend`: Cristian trabaja exclusivamente dentro de `/frontend`.
3. `feat/backend`: Samuel trabaja exclusivamente dentro de `/backend` (ver [SAMUEL_GUIA_BACKEND.md](./SAMUEL_GUIA_BACKEND.md)).
4. Los contratos de API compartidos están definidos en `frontend/src/types/index.ts` y documentados en Swagger `/docs`.
