# STACK TECNOLÓGICO — INFODETS

## Sistema de Gestión de Conocimiento Dinámico

> **Última actualización:** Mayo 2026
> **Versión del sistema:** Sprint Testeo / S5

---

## ÍNDICE

1. [Resumen de arquitectura](#1-resumen-de-arquitectura)
2. [Frontend](#2-frontend)
3. [Backend](#3-backend)
4. [Base de datos relacional](#4-base-de-datos-relacional)
5. [Base de datos vectorial](#5-base-de-datos-vectorial)
6. [Inteligencia Artificial](#6-inteligencia-artificial)
7. [Autenticación y autorización](#7-autenticación-y-autorización)
8. [APIs externas](#8-apis-externas)
9. [Orquestación y automatización](#9-orquestación-y-automatización)
10. [Infraestructura cloud](#10-infraestructura-cloud)
11. [CI/CD y DevOps](#11-cicd-y-devops)
12. [Contenedores y despliegue](#12-contenedores-y-despliegue)
13. [Comunicación en tiempo real](#13-comunicación-en-tiempo-real)
14. [Migraciones de base de datos](#14-migraciones-de-base-de-datos)
15. [Tablas en RDS](#15-tablas-en-rds)
16. [Variables de entorno](#16-variables-de-entorno)
17. [Puertos y URLs](#17-puertos-y-urls)

---

## 1. RESUMEN DE ARQUITECTURA

Usuario (browser) │
▼ Next.js 16 — React 19 — TypeScript (Puerto 3000 — Docker en EC2) │
│ REST + SSE (Server-Sent Events) ▼ FastAPI — Python 3.13 (Puerto 8000 — systemd en EC2) │
├──► AWS Cognito (autenticación) ├──► RDS PostgreSQL 17 (datos relacionales) ├──► Qdrant (vectores / RAG) ├──► Google Gemini API (embeddings + generación) ├──► Groq API (fallback generación) ├──► Serper API (búsqueda web — Nivel 2 RAG) └──► n8n (notificaciones / workflows)

**Flujo RAG (Loop de Retroalimentación):**
Consulta → Qdrant (score ≥ 70%) → Gemini responde con docs oficiales (score < 70%) → Nivel 1: URLs oficiales configuradas → Nivel 2: Búsqueda web via Serper → Nivel 3: Ticket + notificación n8n al admin

---

## 2. FRONTEND

### Framework y lenguaje

| Tecnología | Versión     | Uso                                                      |
| ---------- | ----------- | -------------------------------------------------------- |
| Next.js    | 16.2.4      | Framework principal — App Router, SSR, standalone output |
| React      | 19.2.4      | UI                                                       |
| TypeScript | ^5          | Tipado estático                                          |
| Node.js    | 20 (Alpine) | Runtime en Docker                                        |

### UI y componentes

| Librería              | Versión  | Uso                                 |
| --------------------- | -------- | ----------------------------------- |
| Mantine Core          | ^9.1.0   | Sistema de componentes principal    |
| Mantine Charts        | ^9.1.0   | Gráficos del dashboard              |
| Mantine Dates         | ^9.1.0   | DatePicker (fecha de nacimiento)    |
| Mantine Form          | ^9.1.0   | Manejo de formularios               |
| Mantine Hooks         | ^9.1.0   | Hooks utilitarios                   |
| Mantine Notifications | ^9.1.0   | Sistema de toasts/notificaciones    |
| @tabler/icons-react   | ^3.41.1  | Iconografía                         |
| Framer Motion         | ^12.38.0 | Animaciones (Infobot, transiciones) |
| Recharts              | ^3.8.1   | Gráficos alternativos               |

### Estado global

| Librería | Versión | Uso                                    |
| -------- | ------- | -------------------------------------- |
| Zustand  | ^5.0.12 | Estado global con `persist` middleware |

**Stores:**

- `sessionStore.ts` — usuario, token JWT, permisos, isAuthenticated, isAdmin
- `uiStore.ts` — estado de UI (sidebar, loaders)

**Persistencia:** `localStorage` via `zustand/middleware/persist` — clave `infodets-session`

### HTTP y datos

| Librería              | Versión  | Uso                                          |
| --------------------- | -------- | -------------------------------------------- |
| Axios                 | ^1.15.2  | Cliente HTTP con interceptores JWT           |
| @tanstack/react-query | ^5.99.2  | Cache y sincronización de datos del servidor |
| dayjs                 | ^1.11.20 | Manejo de fechas                             |

**Interceptores Axios:**

- Request: inyecta `Authorization: Bearer <token>` automáticamente
- Response: en 401 (excepto `/auth/login`) limpia sesión y redirige a `/`

### Autenticación frontend

| Librería              | Versión | Uso                       |
| --------------------- | ------- | ------------------------- |
| aws-amplify           | ^6.16.4 | SDK de AWS Cognito        |
| @aws-amplify/ui-react | ^6.15.3 | Componentes UI de Amplify |

### Páginas (App Router)

| Ruta                              | Descripción                   | Acceso                 |
| --------------------------------- | ----------------------------- | ---------------------- |
| `/`                               | Login                         | Público                |
| `/invitado`                       | Consulta sin registro         | Público                |
| `/consulta`                       | Chat con IA                   | Autenticado            |
| `/mis-consultas`                  | Historial de conversaciones   | Autenticado            |
| `/noticias`                       | Noticias institucionales      | Autenticado            |
| `/documentacion`                  | Carga y listado de documentos | Autenticado + permiso  |
| `/perfil`                         | Edición de perfil de usuario  | Autenticado            |
| `/dashboard`                      | Panel principal admin         | Admin                  |
| `/dashboard/usuarios`             | CRUD de usuarios              | `gestionar_usuarios`   |
| `/dashboard/derechos`             | Perfiles y permisos           | `gestionar_usuarios`   |
| `/dashboard/documentacion`        | Gestión de documentos + URLs  | `gestionar_documentos` |
| `/dashboard/noticias`             | CRUD de noticias              | `gestionar_noticias`   |
| `/dashboard/tablas`               | Tablas de valores             | `gestionar_tablas`     |
| `/dashboard/notificaciones`       | Tickets y validaciones IA     | `ver_validaciones`     |
| `/dashboard/panel-notificaciones` | Panel de notificaciones       | Autenticado            |
| `/auth/callback`                  | Callback OAuth (legacy)       | Público                |

### Servicios API (capa de abstracción)

- `consultaService.ts` — chat stream SSE, historial
- `dashboardService.ts` — estadísticas, hot topics
- `feedbackService.ts` — feedback de respuestas
- `ingestaService.ts` — carga de documentos PDF
- `noticiaService.ts` — CRUD noticias
- `perfilService.ts` — perfiles de acceso
- `permisoService.ts` — permisos por usuario
- `tablaService.ts` — tablas de valores
- `usuarioService.ts` — CRUD usuarios

### Herramientas de desarrollo

| Herramienta        | Versión | Uso                |
| ------------------ | ------- | ------------------ |
| ESLint             | ^9      | Linting            |
| Prettier           | ^3.8.3  | Formateo de código |
| eslint-config-next | 16.2.4  | Reglas Next.js     |

---

## 3. BACKEND

### Framework y lenguaje

| Tecnología | Versión | Uso                            |
| ---------- | ------- | ------------------------------ |
| Python     | 3.13    | Lenguaje principal             |
| FastAPI    | 0.115.0 | Framework web — REST API + SSE |
| Uvicorn    | 0.32.0  | Servidor ASGI                  |

### Estructura del proyecto

Backend/ ├── main.py # Punto de entrada, CORS, rutas estáticas ├── app/ │ ├── api/v1/ │ │ ├── router.py # Registro de todos los routers │ │ └── routes/ # Un archivo por dominio │ │ ├── auth_routes.py │ │ ├── chat_routes.py │ │ ├── ingesta_routes.py │ │ ├── usuario_routes.py │ │ ├── permiso_routes.py │ │ ├── perfil_routes.py │ │ ├── noticia_routes.py │ │ ├── ticket_routes.py │ │ ├── validacion_routes.py │ │ ├── url_routes.py │ │ ├── tabla_routes.py │ │ ├── dashboard_routes.py │ │ └── feedback_routes.py │ ├── core/ │ │ ├── settings.py # Configuración via pydantic-settings │ │ └── database.py # SQLAlchemy engine + SessionLocal │ ├── middleware/ │ │ └── auth_middleware.py # JWT decode, require_permiso(), require_rol() │ ├── models/ │ │ └── models.py # Modelos SQLAlchemy (13 tablas) │ ├── schemas/ │ │ ├── common.py # ErrorDetail, MensajeOk, R_xxx responses │ │ ├── auth_schema.py │ │ ├── chat_schema.py │ │ ├── dashboard_schema.py │ │ ├── feedback_schema.py │ │ └── ingesta_schema.py │ └── services/ # Lógica de negocio │ ├── chat_service.py │ ├── documento_service.py │ ├── embedding_service.py │ ├── ingesta_service.py │ ├── noticia_service.py │ ├── notificacion_service.py │ ├── perfil_service.py │ ├── permiso_service.py │ ├── qdrant_service.py │ ├── rag_service.py │ ├── tabla_service.py │ ├── ticket_service.py │ ├── url_service.py │ ├── usuario_service.py │ └── validacion_service.py

### Dependencias Python

| Paquete                   | Versión  | Uso                                              |
| ------------------------- | -------- | ------------------------------------------------ |
| fastapi                   | 0.115.0  | Framework web                                    |
| uvicorn[standard]         | 0.32.0   | Servidor ASGI                                    |
| pydantic[email]           | 2.9.2    | Validación de datos y schemas                    |
| pydantic-settings         | 2.5.2    | Configuración desde .env                         |
| python-multipart          | 0.0.12   | Soporte multipart/form-data (upload de archivos) |
| python-dotenv             | 1.0.1    | Carga de variables de entorno                    |
| sqlalchemy                | 2.0.36   | ORM — modelos y queries                          |
| alembic                   | 1.13.3   | Migraciones de base de datos                     |
| psycopg2-binary           | 2.9.10   | Driver PostgreSQL                                |
| python-jose[cryptography] | 3.3.0    | Generación y verificación de JWT HS256           |
| authlib                   | 1.3.2    | OAuth (legacy, no activo)                        |
| boto3                     | >=1.34.0 | SDK AWS — Cognito admin (blanqueo de passwords)  |
| httpx                     | >=0.28.1 | Cliente HTTP async — Gemini, Groq, n8n, Serper   |
| requests                  | 2.32.3   | Cliente HTTP sync                                |
| google-generativeai       | 0.8.6    | SDK Google Gemini (legacy)                       |
| google-genai              | >=1.73.1 | SDK Google Gemini (nuevo)                        |
| groq                      | >=1.2.0  | SDK Groq — fallback LLM                          |
| qdrant-client             | 1.9.1    | Cliente Qdrant — búsqueda vectorial              |
| pypdf2                    | 3.0.1    | Extracción de texto de PDFs                      |
| langchain-text-splitters  | 0.3.8    | Fragmentación de texto en chunks                 |

### Endpoints principales

| Método              | Ruta                                   | Descripción                        |
| ------------------- | -------------------------------------- | ---------------------------------- |
| POST                | `/v1/auth/login`                       | Login con Cognito → JWT propio     |
| POST                | `/v1/chat/stream`                      | Chat RAG con streaming SSE         |
| POST                | `/v1/chat/invitado`                    | Chat sin autenticación             |
| GET                 | `/v1/chat/conversaciones/{id}`         | Historial de conversaciones        |
| POST                | `/v1/admin/ingesta`                    | Subir PDF → indexar en Qdrant      |
| GET                 | `/v1/admin/ingesta/ver/{id}`           | Servir PDF                         |
| DELETE              | `/v1/admin/ingesta/{id}`               | Eliminar documento                 |
| GET                 | `/v1/ingesta/recientes`                | Últimos documentos (público)       |
| GET/PUT             | `/v1/usuarios/me`                      | Perfil propio                      |
| GET/POST/PUT/DELETE | `/v1/usuarios`                         | CRUD usuarios (admin)              |
| POST                | `/v1/usuarios/invitar`                 | Invitar nuevo usuario              |
| POST                | `/v1/usuarios/{id}/blanquear-password` | Reset password en Cognito          |
| GET/PUT             | `/v1/permisos/{id}`                    | Permisos por usuario               |
| GET/POST/PUT/DELETE | `/v1/perfiles`                         | CRUD perfiles de acceso            |
| GET/POST/PUT/DELETE | `/v1/noticias`                         | CRUD noticias                      |
| GET/POST/PUT/DELETE | `/v1/tickets`                          | Tickets de vacío de información    |
| GET/POST            | `/v1/validaciones`                     | Validaciones para entrenamiento IA |
| GET/POST/PUT/DELETE | `/v1/urls`                             | URLs oficiales del RAG             |
| GET/POST/PUT/DELETE | `/v1/tablas/{tabla_id}`                | Tablas de valores                  |
| GET                 | `/v1/admin/dashboard`                  | Estadísticas generales             |
| GET                 | `/health`                              | Health check                       |

### Archivos estáticos servidos

| Ruta                   | Directorio                    | Contenido            |
| ---------------------- | ----------------------------- | -------------------- |
| `/uploads/noticias/`   | `Backend/uploads/noticias/`   | Imágenes de noticias |
| `/uploads/documentos/` | `Backend/uploads/documentos/` | PDFs indexados       |

---

## 4. BASE DE DATOS RELACIONAL

| Campo           | Valor                                                  |
| --------------- | ------------------------------------------------------ |
| Motor           | PostgreSQL 17.6                                        |
| Servicio        | AWS RDS                                                |
| Instancia       | `db.t4g.micro`                                         |
| Host producción | `infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com` |
| Host desarrollo | `localhost` (via SSH tunnel)                           |
| Puerto          | `5432`                                                 |
| Base de datos   | `infodets`                                             |
| Usuario         | `infodets_admin`                                       |
| Región          | `us-east-1`                                            |
| ORM             | SQLAlchemy 2.0 (Mapped columns, DeclarativeBase)       |
| Migraciones     | Alembic 1.13.3                                         |

**Tunnel SSH para desarrollo local:**

```bash
ssh -i "keyinfodets.pem" -L 5432:infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com:5432 ubuntu@32.192.124.14 -N
```

## 5. BASE DE DATOS VECTORIAL

Campo Valor
Motor Qdrant
Versión Última estable (Docker)
Despliegue Self-hosted en EC2 (Docker, restart=always)
URL interna EC2 http://172.31.40.141:6333
URL pública http://32.192.124.14:6333
Dashboard http://32.192.124.14:6333/dashboard
Colección infodets_docs
Dimensiones del vector 3072 (gemini-embedding-001)
Métrica de distancia Coseno
Cliente Python qdrant-client==1.9.1
Payload almacenado por chunk:

{
"text": "...",
"document_id": "uuid",
"source_url": "/v1/admin/ingesta/ver/{id}",
"titulo": "Nombre del documento",
"page_number": 0
}
Tunnel SSH para desarrollo local:

```bash
ssh -i "keyinfodets.pem" -L 6333:localhost:6333 ubuntu@32.192.124.14 -N
```

---

## 6. INTELIGENCIA ARTIFICIAL

### Modelos utilizados

| Modelo                    | Proveedor     | Uso                                        | Límite gratuito |
| ------------------------- | ------------- | ------------------------------------------ | --------------- |
| `gemini-embedding-001`    | Google Gemini | Generación de embeddings (3072 dims)       | —               |
| `gemini-2.0-flash-lite`   | Google Gemini | Generación de respuestas (principal)       | 15 RPM          |
| `llama-3.3-70b-versatile` | Groq          | Generación de respuestas (fallback en 429) | 30 RPM          |

### Pipeline de ingesta de documentos

```
PDF subido por admin
│
▼
PyPDF2 — extracción de texto
│
▼
LangChain RecursiveCharacterTextSplitter
chunk_size=1000, chunk_overlap=200
separators=["\n\n", "\n", ".", " "]
│
▼
Google Gemini API — batchEmbedContents
modelo: gemini-embedding-001
taskType: RETRIEVAL_DOCUMENT
batch de hasta N chunks en una sola llamada
│
▼
Qdrant — upsert en batches de 100 vectores
colección: infodets_docs
```

### Pipeline de consulta (RAG)

```
Pregunta del usuario
│
▼
Google Gemini API — embedContent
modelo: gemini-embedding-001
taskType: RETRIEVAL_QUERY
│
▼
Qdrant — búsqueda por similitud coseno (top 5)
│
├── score ≥ 0.70 → Nivel 0: respuesta con docs oficiales
├── score < 0.70 → Nivel 1: URLs oficiales (httpx scraping)
├── Nivel 1 vacío → Nivel 2: Serper API (búsqueda web)
└── Nivel 2 vacío → Nivel 3: escalamiento humano
│
▼
Gemini gemini-2.0-flash-lite (generación)
temperature=0.1, maxOutputTokens=1024
Fallback automático a Groq en HTTP 429
│
▼
StreamingResponse SSE → Frontend
```

### Sistema de validaciones para entrenamiento continuo

| Score de confianza | Acción                                              |
| ------------------ | --------------------------------------------------- |
| < 50%              | No se crea validación                               |
| 50% – 85%          | Validación pendiente → revisión manual en dashboard |
| ≥ 85%              | auto_indexado → indexado en Qdrant automáticamente  |

---

## 7. AUTENTICACIÓN Y AUTORIZACIÓN

### Autenticación

| Componente             | Tecnología             | Detalle                                       |
| ---------------------- | ---------------------- | --------------------------------------------- |
| Proveedor de identidad | AWS Cognito            | User Pool us-east-1_uOuYTO6Ce                 |
| Auth flow              | USER_PASSWORD_AUTH     | Email + password directo, sin OAuth redirects |
| Token de sesión        | JWT HS256 propio       | Generado por el backend, exp=8h               |
| Algoritmo JWT          | HS256                  | python-jose[cryptography]                     |
| Almacenamiento token   | Zustand + localStorage | Clave `infodets-session`                      |

**Flujo de login:**

```
Frontend → POST /v1/auth/login (email + password)
→ Backend llama Cognito initiate_auth
→ Backend genera JWT HS256 (sub=usuario_id_RDS)
→ Frontend guarda token + permisos en Zustand
→ Todas las requests: Authorization: Bearer <jwt>
→ Backend verifica JWT localmente (sin llamar a Cognito)
```

### Autorización — Sistema de permisos

| Sección                | Tipo           | Descripción                       |
| ---------------------- | -------------- | --------------------------------- |
| `consulta`             | Menú           | Acceso al chat con IA             |
| `perfil`               | Menú           | Acceso a la página de perfil      |
| `documentacion`        | Menú           | Acceso a documentación            |
| `noticias`             | Menú           | Acceso a noticias                 |
| `dashboard`            | Menú           | Acceso al panel administrativo    |
| `gestionar_usuarios`   | Acción backend | CRUD usuarios, perfiles, derechos |
| `blanquear_password`   | Acción backend | Reset de contraseñas en Cognito   |
| `gestionar_documentos` | Acción backend | Subir/eliminar documentos y URLs  |
| `gestionar_noticias`   | Acción backend | CRUD de noticias                  |
| `gestionar_tablas`     | Acción backend | Administrar tablas de valores     |
| `ver_validaciones`     | Acción backend | Ver y aprobar validaciones de IA  |

**Dependency de FastAPI:**

```python
require_permiso('gestionar_usuarios')  # verifica en DB por request
```

### Cognito — Configuración

| Campo                   | Valor                                               |
| ----------------------- | --------------------------------------------------- |
| User Pool ID            | us-east-1_uOuYTO6Ce                                 |
| App Client backend      | 40g4ffmsvf8mmk77kc37abucvd                          |
| App Client frontend     | 6sr8e9s203gb8reco11d9gsal1                          |
| Región                  | us-east-1                                           |
| Dominio                 | us-east-1uouyto6ce.auth.us-east-1.amazoncognito.com |
| Auth flow habilitado    | ALLOW_USER_PASSWORD_AUTH                            |
| Política de contraseñas | Mín. 8 chars, mayúscula, minúscula, número, símbolo |

---

## 8. APIS EXTERNAS

### Google Gemini API

| Campo                      | Valor                                                  |
| -------------------------- | ------------------------------------------------------ |
| URL base                   | https://generativelanguage.googleapis.com/v1beta       |
| Autenticación              | API Key via query param `?key=`                        |
| Modelo embeddings          | gemini-embedding-001                                   |
| Modelo generación          | gemini-2.0-flash-lite                                  |
| Endpoint embeddings batch  | POST `/models/gemini-embedding-001:batchEmbedContents` |
| Endpoint embedding query   | POST `/models/gemini-embedding-001:embedContent`       |
| Endpoint generación        | POST `/models/gemini-2.0-flash-lite:generateContent`   |
| Límite gratuito generación | 15 RPM                                                 |
| Variables de entorno       | `GEMINI_API_KEY`, `GEMINI_GENERATION_KEY`              |

### Groq API (fallback LLM)

| Campo               | Valor                                      |
| ------------------- | ------------------------------------------ |
| SDK                 | groq>=1.2.0                                |
| Modelo              | llama-3.3-70b-versatile                    |
| Activación          | Automática cuando Gemini devuelve HTTP 429 |
| Límite gratuito     | 30 RPM                                     |
| Variable de entorno | GROQ_API_KEY                               |

### Serper API (búsqueda web — Nivel 2 RAG)

| Campo                | Valor                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| URL                  | https://google.serper.dev/search                                         |
| Autenticación        | Header `X-API-KEY`                                                       |
| Uso                  | Nivel 2 del loop de retroalimentación (score < 70% y sin URLs oficiales) |
| Límite gratuito      | 2.500 búsquedas/mes                                                      |
| Variables de entorno | `SEARCH_API_KEY`, `SEARCH_API_URL`                                       |

### AWS Cognito (boto3)

| Campo                | Valor                                                             |
| -------------------- | ----------------------------------------------------------------- |
| SDK                  | boto3>=1.34.0                                                     |
| Uso                  | admin_set_user_password — blanqueo de contraseñas                 |
| Región               | us-east-1                                                         |
| Variables de entorno | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` |

⚠️ **Nota:** Las credenciales AWS son temporales (AWS Academy). Deben actualizarse en `.env` al iniciar cada sesión de laboratorio.

### n8n Webhooks

| Webhook                          | Evento                | Descripción              |
| -------------------------------- | --------------------- | ------------------------ |
| `/webhook/infodets-notificacion` | Todos los eventos     | Notificaciones al admin  |
| `/webhook/invitar-usuario`       | Invitación de usuario | Email de bienvenida      |
| `/webhook/ingesta-completada`    | Ingesta de documento  | Confirmación de indexado |

**Eventos de notificación:**

| Evento                 | Cuándo                          | Prioridad  |
| ---------------------- | ------------------------------- | ---------- |
| `nivel1_externo`       | Respuesta desde URL oficial     | 🟡 Naranja |
| `nivel2_externo`       | Respuesta desde búsqueda web    | 🟡 Naranja |
| `nivel3_escalamiento`  | Sin respuesta en ninguna fuente | 🔴 Rojo    |
| `validacion_pendiente` | Score 50-85% requiere revisión  | 🔵 Azul    |

---

## 9. ORQUESTACIÓN Y AUTOMATIZACIÓN

### n8n

| Campo                | Valor                                 |
| -------------------- | ------------------------------------- |
| Versión              | 2.17.5+ (Docker)                      |
| Despliegue           | Self-hosted en EC2 (Docker)           |
| URL                  | http://32.192.124.14:5678             |
| Usuario admin        | admin                                 |
| Variables de entorno | `N8N_URL`, `N8N_USER`, `N8N_PASSWORD` |

**Workflows activos:**

| Workflow                                         | Función                                       |
| ------------------------------------------------ | --------------------------------------------- |
| INFODETS - Invitar Usuario                       | Envía email de bienvenida al usuario invitado |
| INFODETS - Notificaciones Loop Retroalimentacion | Notifica al admin según el nivel del loop RAG |

---

## 10. INFRAESTRUCTURA CLOUD

### AWS EC2 — Servidor principal

| Campo                   | Valor                                           |
| ----------------------- | ----------------------------------------------- |
| IP pública (Elastic IP) | 32.192.124.14                                   |
| IP privada              | 172.31.40.141                                   |
| Sistema operativo       | Ubuntu 24.04 LTS                                |
| Región                  | us-east-1                                       |
| Conexión SSH            | `ssh -i "keyinfodets.pem" ubuntu@32.192.124.14` |

**Servicios corriendo en EC2:**

| Servicio | Gestor                          | Puerto | URL                       |
| -------- | ------------------------------- | ------ | ------------------------- |
| FastAPI  | systemd (fastapi.service)       | 8000   | http://32.192.124.14:8000 |
| Qdrant   | Docker (restart=always)         | 6333   | http://32.192.124.14:6333 |
| n8n      | Docker                          | 5678   | http://32.192.124.14:5678 |
| Next.js  | Docker (restart=unless-stopped) | 3000   | http://32.192.124.14:3000 |

### AWS RDS — Base de datos

| Campo     | Valor                                                |
| --------- | ---------------------------------------------------- |
| Motor     | PostgreSQL 17.6                                      |
| Instancia | db.t4g.micro                                         |
| Host      | infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com |
| Puerto    | 5432                                                 |
| Región    | us-east-1                                            |

### AWS Cognito — Autenticación

| Campo     | Valor               |
| --------- | ------------------- |
| User Pool | us-east-1_uOuYTO6Ce |
| Región    | us-east-1           |

### AWS CloudFront (pendiente)

| Campo        | Valor                                    |
| ------------ | ---------------------------------------- |
| Distribución | d84l1y8p4kdic.cloudfront.net             |
| Estado       | ⏳ Pendiente configuración para frontend |

### Comandos de gestión en EC2

```bash
# Conectar
ssh -i "keyinfodets.pem" ubuntu@32.192.124.14

# FastAPI
sudo systemctl status fastapi
sudo systemctl restart fastapi
tail -f ~/uvicorn.log

# Qdrant
docker start qdrant
docker stop qdrant
docker logs qdrant

# n8n
docker ps
docker logs n8n

# Frontend
docker ps
docker logs infodets-web

# Migraciones
cd ~/infodets/Backend
source venv/bin/activate
alembic upgrade head
```

---

## 11. CI/CD Y DEVOPS

### GitHub Actions

| Campo      | Valor                      |
| ---------- | -------------------------- |
| Archivo    | `deploy.yml`               |
| Trigger    | Push a rama `main`         |
| Runner     | ubuntu-latest              |
| Acción SSH | appleboy/ssh-action@v1.0.3 |

**Pipeline de deploy:**

```
Push a main
│
▼
GitHub Actions runner
│
├── SSH al EC2
├── git pull origin main
│
├── Backend:
│ ├── source venv/bin/activate
│ ├── pip install -r requirements.txt
│ ├── alembic upgrade head
│ └── systemctl restart fastapi
│
└── Frontend:
├── docker build --no-cache infodets-frontend
├── docker stop/rm infodets-web
├── docker run -d -p 3000:3000 infodets-frontend
└── docker image prune -f
```

└── Frontend:
├── docker build --no-cache infodets-frontend
├── docker stop/rm infodets-web
├── docker run -d -p 3000:3000 infodets-frontend
└── docker image prune -f

**Secrets de GitHub requeridos:**

| Secret        | Descripción             |
| ------------- | ----------------------- |
| `EC2_HOST`    | IP pública del servidor |
| `EC2_USER`    | Usuario SSH (ubuntu)    |
| `EC2_SSH_KEY` | Clave privada PEM       |

**Ramas Git:**

| Rama            | Propósito                                 |
| --------------- | ----------------------------------------- |
| `main`          | Producción — trigger de deploy automático |
| `testeo`        | Rama activa de desarrollo y correcciones  |
| `frontend`      | Desarrollo Frontend                       |
| `backend`       | Desarrollo Backend                        |
| `configuracion` | Infraestructura y configuración           |

---

## 12. CONTENEDORES Y DESPLIEGUE

### Docker Compose (desarrollo local)

**Archivo:** `docker-compose.yml` (en `/infodets/`)

**Servicios levantados:**

| Servicio   | Imagen                 | Puerto | Volúmenes         | Descripción               |
| ---------- | ---------------------- | ------ | ----------------- | ------------------------- |
| `db`       | `postgres:17`          | 5432   | `pgdata`          | Base de datos PostgreSQL  |
| `qdrant`   | `qdrant/qdrant:latest` | 6333   | `qdrant_storage`  | Base de datos vectorial   |
| `n8n`      | `n8n:latest`           | 5678   | `n8n_data`        | Orquestación de workflows |
| `backend`  | Build local            | 8000   | `./Backend:/app`  | FastAPI                   |
| `frontend` | Build local            | 3000   | `./Frontend:/app` | Next.js                   |

**Comando de inicio:**

```bash
docker-compose up -d
```

### Imágenes Docker en producción

**Frontend (infodets-frontend)**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Backend (infodets-backend)**

Ejecutado via `systemd` + `uvicorn`, no en Docker.

**Qdrant en EC2**

```bash
docker run -d --restart=always -p 6333:6333 -v qdrant_storage:/qdrant/storage qdrant/qdrant:latest
```

**n8n en EC2**

```bash
docker run -d --restart=always -p 5678:5678 -e N8N_HOST=32.192.124.14 n8n:latest
```

---

## 13. COMUNICACIÓN EN TIEMPO REAL

### Server-Sent Events (SSE)

**Implementación:**

- **Protocolo:** HTTP + SSE (`text/event-stream`)
- **Cliente:** Frontend — Web API `EventSource`
- **Servidor:** FastAPI — `StreamingResponse`

**Endpoint streaming:**

```
POST /v1/chat/stream
Content-Type: application/json
Authorization: Bearer <jwt>

{
  "query": "¿Cuál es el proceso de ingesta?",
  "conversation_id": "uuid"
}

Response: 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache

event: start
data: {"status": "procesando"}

event: chunk
data: {"text": "La ingesta es"}

event: chunk
data: {"text": " el proceso de"}

event: end
data: {"confidence": 0.87, "sources": [...]}
```

**Ventajas SSE vs WebSocket:**

- ✅ HTTP simple (menos overhead)
- ✅ Reconexión automática
- ✅ Compatible con proxies/load balancers
- ❌ Unidireccional (servidor → cliente)

---

## 14. MIGRACIONES DE BASE DE DATOS

### Herramienta: Alembic

| Campo                  | Valor                       |
| ---------------------- | --------------------------- |
| Versión                | 1.13.3                      |
| Comando                | `alembic` (CLI)             |
| Archivo config         | `alembic.ini`               |
| Directorio migraciones | `Backend/alembic/versions/` |
| Script base            | `Backend/alembic/env.py`    |

### Workflow de migraciones

**1. Crear nueva migración (después de cambiar `models.py`):**

```bash
cd Backend
alembic revision --autogenerate -m "Agregar tabla xyz"
```

Genera archivo: `alembic/versions/20240515_1430_agregar_tabla_xyz.py`

**2. Revisar migración antes de aplicar:**

```bash
cat alembic/versions/20240515_1430_agregar_tabla_xyz.py
```

**3. Aplicar migraciones en desarrollo:**

```bash
alembic upgrade head
```

**4. Aplicar en producción (via deploy.yml):**

```bash
ssh -i key.pem ubuntu@ec2
cd ~/infodets/Backend
source venv/bin/activate
alembic upgrade head
systemctl restart fastapi
```

**5. Deshacer última migración (⚠️ CUIDADO):**

```bash
alembic downgrade -1
```

**6. Ver estado actual:**

```bash
alembic current
```

**7. Ver historial de migraciones:**

```bash
alembic history --verbose
```

---

## 15. TABLAS EN RDS

**Base de datos:** `infodets` (PostgreSQL 17)

### Diagrama de entidades

```
Usuarios
├── id (PK, UUID)
├── email (UQ)
├── nombre
├── apellido
├── cognito_id
├── activo (BOOL, default=True)
├── fecha_creacion (TIMESTAMP)
└── fecha_actualizacion (TIMESTAMP)

Perfiles
├── id (PK, UUID)
├── nombre (UQ)
├── descripcion
└── activo (BOOL)

PerfilPermisos (relación M:N)
├── perfil_id (FK → Perfiles.id)
└── permiso_id (FK → Permisos.id)

Permisos
├── id (PK, UUID)
├── nombre (UQ)
├── descripcion
└── modulo (ej: "chat", "admin", "documentacion")

UsuarioPerfil (relación 1:N)
├── usuario_id (FK → Usuarios.id)
└── perfil_id (FK → Perfiles.id)

Documentos
├── id (PK, UUID)
├── titulo
├── descripcion
├── ruta_archivo
├── size_mb
├── tipo_mime
├── usuario_id_carga (FK → Usuarios.id)
├── activo (BOOL, default=True)
├── fecha_carga (TIMESTAMP)
└── fecha_actualizacion (TIMESTAMP)

URLs Oficiales (RAG Nivel 1)
├── id (PK, UUID)
├── titulo
├── url
├── categoria (ej: "política", "procedimiento")
├── activo (BOOL)
└── fecha_actualizacion (TIMESTAMP)

Conversaciones
├── id (PK, UUID)
├── usuario_id (FK → Usuarios.id)
├── titulo (extraído de primer mensaje)
├── fecha_creacion (TIMESTAMP)
└── activo (BOOL, default=True)

Mensajes
├── id (PK, UUID)
├── conversacion_id (FK → Conversaciones.id)
├── usuario_id (FK → Usuarios.id, NULL si es IA)
├── contenido
├── rol ("user" | "assistant")
├── confidence_score (0.0–1.0, NULL si usuario)
├── score_rag_nivel (0 | 1 | 2 | 3, NULL si usuario)
├── fecha_creacion (TIMESTAMP)
└── deleted_at (TIMESTAMP, NULL = activo)

Feedbacks
├── id (PK, UUID)
├── mensaje_id (FK → Mensajes.id)
├── usuario_id (FK → Usuarios.id)
├── rating (1–5)
├── comentario
├── fecha_creacion (TIMESTAMP)
└── actualizado_en (TIMESTAMP)

Validaciones (para entrenamiento IA)
├── id (PK, UUID)
├── mensaje_id (FK → Mensajes.id)
├── pregunta_original
├── respuesta_generada
├── score_confianza (0.0–1.0)
├── auto_indexado (BOOL, True si score ≥ 85%)
├── revisado_por (FK → Usuarios.id, NULL si pendiente)
├── estado ("pendiente" | "aprobado" | "rechazado")
├── fecha_creacion (TIMESTAMP)
└── fecha_revision (TIMESTAMP)

Tickets (escalamiento humano)
├── id (PK, UUID)
├── conversacion_id (FK → Conversaciones.id)
├── usuario_id (FK → Usuarios.id)
├── asunto
├── descripcion
├── prioridad ("baja" | "media" | "alta")
├── estado ("abierto" | "en_progreso" | "cerrado")
├── asignado_a (FK → Usuarios.id)
├── fecha_creacion (TIMESTAMP)
├── fecha_cierre (TIMESTAMP)
└── comentarios (JSONB)

Noticias
├── id (PK, UUID)
├── titulo
├── contenido
├── imagen_url
├── autor_id (FK → Usuarios.id)
├── publicado (BOOL, default=False)
├── fecha_publicacion (TIMESTAMP)
├── fecha_creacion (TIMESTAMP)
└── fecha_actualizacion (TIMESTAMP)

Tablas de Valores (configurables vía admin)
├── id (PK, UUID)
├── nombre_tabla (ej: "estados_ticket", "niveles_prioridad")
├── clave (ej: "abierto")
├── valor (ej: "Abierto")
├── activo (BOOL, default=True)
├── orden (INT)
└── fecha_actualizacion (TIMESTAMP)

AuditLog (opcional, para trazabilidad)
├── id (PK, UUID)
├── usuario_id (FK → Usuarios.id)
├── accion (ej: "crear_documento", "blanquear_password")
├── tabla_afectada
├── registro_id
├── cambios (JSONB)
├── fecha (TIMESTAMP)
└── ip_origen (INET)
```

---

## 16. VARIABLES DE ENTORNO

### Backend (`.env` en `Backend/`)

```bash
# Base de datos
DATABASE_URL=postgresql://infodets_admin:password@localhost:5432/infodets

# JWT
SECRET_KEY=your_super_secret_key_min_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480  # 8 horas

# AWS Cognito
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=us-east-1_uOuYTO6Ce
AWS_COGNITO_CLIENT_ID=40g4ffmsvf8mmk77kc37abucvd
AWS_COGNITO_CLIENT_SECRET=your_client_secret
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SESSION_TOKEN=temporary_session_token  # AWS Academy

# Google Gemini API
GEMINI_API_KEY=your_gemini_key
GEMINI_GENERATION_KEY=your_gemini_key_for_generation

# Groq API (fallback)
GROQ_API_KEY=your_groq_key

# Serper API (búsqueda web)
SEARCH_API_KEY=your_serper_key
SEARCH_API_URL=https://google.serper.dev/search

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_key_if_secured

# n8n Webhooks
N8N_WEBHOOK_BASE=http://localhost:5678/webhook

# CORS frontend
FRONTEND_URL=http://localhost:3000

# Modo debug
DEBUG=False
ENVIRONMENT=development  # or production
```

### Frontend (`.env.local` en `Frontend/`)

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=30000

# AWS Cognito (para amplify, si se usa)
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_uOuYTO6Ce
NEXT_PUBLIC_COGNITO_CLIENT_ID=6sr8e9s203gb8reco11d9gsal1
NEXT_PUBLIC_COGNITO_DOMAIN=us-east-1uouyto6ce.auth.us-east-1.amazoncognito.com

# App config
NEXT_PUBLIC_APP_NAME=INFODETS
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### EC2 (`.env` global en `/home/ubuntu/`)

```bash
# Para servicios systemd
export DATABASE_URL=postgresql://infodets_admin:password@infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com:5432/infodets
export GEMINI_API_KEY=...
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
```

---

## 17. PUERTOS Y URLs

### Puertos locales (desarrollo)

| Servicio           | Puerto | URL                     | Descripción              |
| ------------------ | ------ | ----------------------- | ------------------------ |
| Frontend (Next.js) | 3000   | `http://localhost:3000` | SPA React                |
| Backend (FastAPI)  | 8000   | `http://localhost:8000` | API REST + SSE           |
| Qdrant             | 6333   | `http://localhost:6333` | BD vectorial + dashboard |
| n8n                | 5678   | `http://localhost:5678` | Orquestación workflows   |
| PostgreSQL         | 5432   | `localhost:5432`        | BD relacional            |

### URLs de producción (EC2)

| Servicio         | URL                                   | Descripción          |
| ---------------- | ------------------------------------- | -------------------- |
| Frontend         | `http://32.192.124.14:3000`           | Web app (IP pública) |
| Backend API      | `http://32.192.124.14:8000`           | REST API             |
| Health check     | `http://32.192.124.14:8000/health`    | Status backend       |
| Qdrant dashboard | `http://32.192.124.14:6333/dashboard` | Gestión de vectores  |
| n8n              | `http://32.192.124.14:5678`           | Workflows            |

### URLs SSH Tunnels (acceso remoto a BD)

**PostgreSQL (desarrollo local):**

```bash
ssh -i "keyinfodets.pem" -L 5432:infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com:5432 ubuntu@32.192.124.14 -N

# Luego en otra terminal:
psql -h localhost -U infodets_admin -d infodets
```

**Qdrant (desarrollo local):**

```bash
ssh -i "keyinfodets.pem" -L 6333:localhost:6333 ubuntu@32.192.124.14 -N

# Luego:
curl http://localhost:6333/health
```

### Endpoints de la API REST

**Autenticación**

| Método | Endpoint         | Descripción       |
| ------ | ---------------- | ----------------- |
| POST   | `/v1/auth/login` | Login con Cognito |
| GET    | `/health`        | Health check      |

**Chat**

| Método | Endpoint                       | Descripción              |
| ------ | ------------------------------ | ------------------------ |
| POST   | `/v1/chat/stream`              | Chat RAG (SSE streaming) |
| POST   | `/v1/chat/invitado`            | Chat sin autenticación   |
| GET    | `/v1/chat/conversaciones/{id}` | Historial conversación   |

**Documentos**

| Método | Endpoint                     | Descripción                   |
| ------ | ---------------------------- | ----------------------------- |
| POST   | `/v1/admin/ingesta`          | Subir PDF                     |
| GET    | `/v1/admin/ingesta/ver/{id}` | Descargar PDF                 |
| DELETE | `/v1/admin/ingesta/{id}`     | Eliminar documento            |
| GET    | `/v1/ingesta/recientes`      | Documentos públicos recientes |

**Usuarios**

| Método              | Endpoint                               | Descripción           |
| ------------------- | -------------------------------------- | --------------------- |
| GET/PUT             | `/v1/usuarios/me`                      | Perfil propio         |
| GET/POST/PUT/DELETE | `/v1/usuarios`                         | CRUD usuarios (admin) |
| POST                | `/v1/usuarios/invitar`                 | Invitar usuario       |
| POST                | `/v1/usuarios/{id}/blanquear-password` | Reset password        |

**Permisos y Perfiles**

| Método              | Endpoint            | Descripción          |
| ------------------- | ------------------- | -------------------- |
| GET/PUT             | `/v1/permisos/{id}` | Permisos por usuario |
| GET/POST/PUT/DELETE | `/v1/perfiles`      | CRUD perfiles        |

**Contenido**

| Método              | Endpoint                | Descripción       |
| ------------------- | ----------------------- | ----------------- |
| GET/POST/PUT/DELETE | `/v1/noticias`          | CRUD noticias     |
| GET/POST/PUT/DELETE | `/v1/urls`              | URLs oficiales    |
| GET/POST/PUT/DELETE | `/v1/tablas/{tabla_id}` | Tablas de valores |

**Admin**

| Método              | Endpoint              | Descripción                     |
| ------------------- | --------------------- | ------------------------------- |
| GET                 | `/v1/admin/dashboard` | Estadísticas                    |
| GET/POST            | `/v1/validaciones`    | Validaciones para entrenamiento |
| GET/POST/PUT/DELETE | `/v1/tickets`         | Tickets de escalamiento         |

---

**Fin del documento**
