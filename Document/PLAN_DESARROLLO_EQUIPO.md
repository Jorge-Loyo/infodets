# PLAN DE DESARROLLO — INFODETS

## Sistema de Gestión de Conocimiento Dinámico

### Plan para equipo de 3 programadores

---

> **Versión:** 3.1
> **Estado:** Sprint 3 ✅ CERRADO — MVP funcional | Sprint 4 🟡 50% en progreso
> **Última actualización:** Ticket silencioso al admin ✅ + documentación funcional + links PDF en fuentes
> **MVP:** 24 de mayo de 2025
> **Entrega final:** 28 de junio de 2025
> **Basado en:** Propuesta técnica, documento maestro de arquitectura y documento técnico de Front-End

---

## ÍNDICE

1. [Resumen del sistema](#1-resumen-del-sistema)
2. [Asignación de roles por programador](#2-asignación-de-roles-por-programador)
3. [Stack tecnológico completo](#3-stack-tecnológico-completo)
4. [Estado actual del proyecto](#4-estado-actual-del-proyecto)
5. [Infraestructura AWS — Datos de conexión](#5-infraestructura-aws--datos-de-conexión)
6. [Guía de inicio para nuevos integrantes](#6-guía-de-inicio-para-nuevos-integrantes)
7. [Plan de sprints](#7-plan-de-sprints)
8. [Detalle de tareas por programador](#8-detalle-de-tareas-por-programador)
9. [Dependencias entre equipos](#9-dependencias-entre-equipos)
10. [Convenciones de trabajo en equipo](#10-convenciones-de-trabajo-en-equipo)
11. [Decisiones de arquitectura](#11-decisiones-de-arquitectura)
12. [Resumen ejecutivo](#12-resumen-ejecutivo)

---

## 1. RESUMEN DEL SISTEMA

INFODETS es una plataforma omnicanal (Web App, Mobile y Chatbot) impulsada por IA y bases de datos vectoriales (RAG). Responde consultas ciudadanas basándose en documentación oficial del sector público, garantizando soberanía de datos y mejora continua.

**Flujo principal del sistema:**

```
Usuario hace consulta en lenguaje natural
        ↓
FastAPI recibe la consulta
        ↓
n8n orquesta el flujo de decisión
        ↓
RAG busca en base vectorial (Pinecone/Qdrant)
        ↓
Si confianza > 70% → Gemini responde con fuente oficial
Si confianza < 70% → Búsqueda web + respuesta cautelosa
Si vacío total    → Ticket silencioso al administrador
        ↓
Respuesta con enlace al documento fuente
        ↓
Botón de feedback al final de cada respuesta
```

---

## 2. ASIGNACIÓN DE ROLES POR PROGRAMADOR

| Programador | Rol               | Área principal                               |
| ----------- | ----------------- | -------------------------------------------- |
| **P1**      | Full-Stack Lead   | Front-End Next.js + integración con Back-End |
| **P2**      | Back-End Engineer | FastAPI + AWS + Base de datos                |
| **P3**      | IA & Orquestación | n8n + RAG + Gemini + Pipeline de ingesta     |

> Esta asignación no es rígida. En sprints donde un área tenga menos carga, el programador apoya al siguiente.

---

## 3. STACK TECNOLÓGICO COMPLETO

| Capa                     | Tecnología                                                            | Responsable |
| ------------------------ | --------------------------------------------------------------------- | ----------- |
| Front-End                | Next.js 14 + React + TypeScript                                       | P1          |
| UI Components            | Mantine UI + Framer Motion + Tabler Icons                             | P1          |
| Estado                   | TanStack Query + Zustand                                              | P1          |
| Autenticación            | AWS Cognito + Amplify                                                 | P1 + P2     |
| Back-End                 | FastAPI (Python)                                                      | P2          |
| Base de datos relacional | AWS RDS PostgreSQL 17                                                 | P2          |
| Base de datos vectorial  | **Qdrant** (self-hosted en EC2 via Docker)                            | P2 + P3     |
| Orquestador de flujos    | n8n (Docker self-hosted)                                              | P3          |
| Motor de IA              | Gemini 1.5 Flash — API directa de Google (`google-generativeai`)      | P3          |
| Streaming                | SSE via `StreamingResponse` FastAPI + `generate_content(stream=True)` | P2 + P3     |
| Búsqueda web fallback    | Tavily / Google Search API                                            | P3          |
| Infraestructura          | AWS EC2 + Docker                                                      | P2          |
| CI/CD                    | GitHub Actions                                                        | P1 + P2     |

---

## 4. ESTADO ACTUAL DEL PROYECTO

> 🟢 **Sistema operativo al 29 de abril de 2026** — MVP completado, Sprint 4 en progreso

### Funcionalidades operativas

| Área | Estado | Detalle |
| ---- | ------ | ------- |
| Login Cognito | ✅ | OAuth via `/auth/callback`, grupos → rol |
| Chat con IA | ✅ | SSE real, Gemini + fallback Groq, fuentes PDF |
| Ingesta de documentos | ✅ | PDF → Qdrant + RDS, link al PDF original |
| Historial de consultas | ✅ | Últimas 20 desde RDS en panel lateral |
| Tickets de vacío | ✅ | Score < 0.3 → ticket en `/dashboard/notificaciones` |
| Gestión de usuarios | ✅ | CRUD completo con perfil extendido |
| Perfiles y derechos | ✅ | Roles + permisos por sección del menú |
| Noticias | ✅ | CRUD con imágenes, publicación/borrador |
| Tablas administrables | ✅ | Instituciones, cargos, dependencias, categorías |
| Sidebar dinámico | ✅ | Muestra/oculta según permisos del usuario |
| Feedback | ⏳ | Schema listo, endpoint pendiente de conectar |
| Dashboard con datos reales | ⏳ | Hot topics y gráficos pendientes |
| Despliegue en producción | ⏳ | Pendiente Sprint 5 |

### Tablas en RDS (9 migraciones aplicadas)

| Tabla | Propósito |
| ----- | --------- |
| `usuarios` | Usuarios con perfil completo + rol |
| `documentos` | Documentos indexados en Qdrant |
| `historial_chat` | Consultas realizadas |
| `reportes_feedback` | Feedback de respuestas |
| `permisos_usuario` | Permisos por sección del menú |
| `perfiles` | Perfiles de acceso con roles |
| `perfil_permisos` | Permisos por perfil |
| `tabla_valores` | Valores de desplegables |
| `noticias` | Publicaciones institucionales |
| `tickets_vacios` | Consultas sin documentación oficial |

### Sprint 0 — Progreso: 9/9 tareas completadas ✅ SPRINT CERRADO

| Tarea                                     | Estado                                          |
| ----------------------------------------- | ----------------------------------------------- |
| Clonar repo y levantar Docker local       | ✅ Completo                                     |
| Confirmar mecanismo de streaming del chat | ✅ SSE + StreamingResponse + Gemini stream=True |
| Crear instancia EC2 en AWS                | ✅ Completo                                     |
| Cognito — 2 App Clients configurados      | ✅ Completo                                     |
| Crear base de datos RDS PostgreSQL        | ✅ Completo                                     |
| Instalar n8n en Docker en EC2             | ✅ Completo                                     |
| Definir estructura de tablas              | ✅ Modelo híbrido PostgreSQL + Pinecone/Qdrant  |
| Definir contratos de API                  | ✅ Schema-First con Pydantic + TypeScript       |
| Actualizar variables de entorno           | ✅ Completo                                     |

### Front-End ✅ (estructura completa)

- Proyecto Next.js 14 inicializado con TypeScript estricto
- Todas las dependencias instaladas (Mantine, Framer Motion, TanStack Query, Zustand, Amplify)
- Layout principal: Header, Footer, Sidebar animado
- Páginas estructuradas: Home/Chat, Perfil, Documentación, Noticias
- Dashboard administrativo con 8 secciones
- Stores de Zustand para sesión y UI
- Servicios tipados para FastAPI
- Configuración de Amplify + Cognito con App Client real
- Docker configurado (Dockerfile + docker-compose)

### Back-End ✅ (estructura base)

- FastAPI inicializado con estructura modular
- Rutas de autenticación Cognito: /login, /callback, /logout, /me
- Middleware de validación JWT
- Schemas Pydantic base
- `google-generativeai` agregado a requirements.txt
- Entorno virtual configurado con todas las dependencias
- **Contratos de API definidos (Schema-First):**
  - `chat_schema.py` → ChatRequest, ChatChunkEvent, ChatFinalEvent, ChatErrorEvent
  - `ingesta_schema.py` → IngestaRequest, IngestaResponse, DocumentoListItem
  - `feedback_schema.py` → FeedbackRequest, FeedbackResponse
  - `dashboard_schema.py` → DashboardStats, HotTopic
- **Endpoints estructurados:**
  - `POST /v1/chat/stream` — streaming SSE con Gemini
  - `POST /v1/admin/ingesta` — carga de documentos
  - `POST /v1/feedback/report` — reporte de feedback
  - `GET /v1/admin/hot-topics` — estadísticas para dashboard
  - `GET /v1/admin/dashboard` — stats generales

### Infraestructura AWS ✅ (Sprint 0 + Sprint 1)

- EC2 Ubuntu 24.04 corriendo con Docker — IP fija `32.192.124.14`
- RDS PostgreSQL 17 operativa y conectada
- n8n corriendo en Docker en `http://32.192.124.14:5678`
- Cognito con 2 App Clients configurados (nuevo User Pool)
- **FastAPI corriendo como servicio systemd** — se reinicia automáticamente
- **Qdrant corriendo en Docker** en `http://32.192.124.14:6333`
- **CI/CD GitHub Actions** — deploy automático a EC2 en cada push a main

- FastAPI corriendo como servicio systemd en EC2 — `http://32.192.124.14:8000` ✅
- Qdrant corriendo en Docker en EC2 — `http://32.192.124.14:6333` ✅
- CI/CD GitHub Actions operativo — deploy automático en push a main ✅
- Modelos SQLAlchemy creados (User, Document, ChatHistory, FeedbackReport) ✅
- Lógica funcional del chat con IA (Google Gemini API + streaming)
- Migraciones Alembic
- Pipeline RAG con Qdrant
- Orquestación con n8n
- Conexión Front-End ↔ Back-End real (reemplazar mocks)

---

## 5. INFRAESTRUCTURA AWS — DATOS DE CONEXIÓN

> ⚠️ Esta sección contiene datos de infraestructura para el equipo de desarrollo.
> Las credenciales sensibles (contraseñas, secrets) se comparten por canal seguro, no por Git.

### EC2 — Servidor principal

| Campo             | Valor                                           |
| ----------------- | ----------------------------------------------- |
| IP pública        | `32.192.124.14` (Elastic IP — fija permanente)  |
| IP privada        | `172.31.40.141`                                 |
| Sistema operativo | Ubuntu 24.04 LTS                                |
| Región            | `us-east-1`                                     |
| Key PEM           | Solicitar al líder del proyecto                 |
| Conexión SSH      | `ssh -i "keyinfodets.pem" ubuntu@32.192.124.14` |

**Servicios corriendo en EC2:**

- FastAPI → `http://32.192.124.14:8000` ✅ corriendo
- Qdrant → `http://32.192.124.14:6333` ✅ corriendo
- n8n → `http://32.192.124.14:5678` ✅ corriendo
- Next.js → `http://32.192.124.14:3000` (pendiente de desplegar)

---

### RDS PostgreSQL — Base de datos

| Campo         | Valor                                                  |
| ------------- | ------------------------------------------------------ |
| Host          | `infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com` |
| Puerto        | `5432`                                                 |
| Base de datos | `infodets`                                             |
| Usuario       | `infodets_admin`                                       |
| Contraseña    | Solicitar al líder del proyecto                        |
| Versión       | PostgreSQL 17.6                                        |
| Instancia     | `db.t4g.micro`                                         |
| SSL           | Requerido (`sslmode=verify-full`)                      |

**Conexión de prueba desde EC2:**

```bash
export RDSHOST="infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com"
psql "host=$RDSHOST port=5432 dbname=infodets user=infodets_admin sslmode=verify-full sslrootcert=./global-bundle.pem"
```

**DATABASE_URL para FastAPI:**

```
postgresql://infodets_admin:<password>@infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com:5432/infodets
```

**Túnel SSH para conectarse desde VS Code:**

```bash
ssh -i "keyinfodets.pem" -L 5432:infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com:5432 ubuntu@32.192.124.14 -N
```

---

### n8n — Orquestador de flujos

| Campo            | Valor                           |
| ---------------- | ------------------------------- |
| URL              | `http://32.192.124.14:5678`     |
| Usuario          | `admin`                         |
| Contraseña       | Solicitar al líder del proyecto |
| Ubicación en EC2 | `/home/ubuntu/n8n/`             |

**Comandos de gestión en EC2:**

```bash
cd ~/n8n
docker-compose up -d      # Levantar
docker-compose down       # Detener
docker logs n8n_n8n_1     # Ver logs
```

---

### Cognito — Autenticación

| Campo        | Valor                                                 |
| ------------ | ----------------------------------------------------- |
| Región       | `us-east-1`                                           |
| User Pool ID | `us-east-1_uOuYTO6Ce`                                 |
| Dominio      | `us-east-1uouyto6ce.auth.us-east-1.amazoncognito.com` |

**App Clients:**

| Cliente                           | Client ID                    | Secret        | Uso                 |
| --------------------------------- | ---------------------------- | ------------- | ------------------- |
| `Infodets-Web-Cognito`            | `40g4ffmsvf8mmk77kc37abucvd` | ✅ Tiene      | Back-End (FastAPI)  |
| `Interfaz de usuario de Infodets` | `6sr8e9s203gb8reco11d9gsal1` | ❌ Sin secret | Front-End (Amplify) |

### Qdrant — Base de datos vectorial

| Campo            | Valor                                 |
| ---------------- | ------------------------------------- |
| URL interna      | `http://172.31.40.141:6333`           |
| Dashboard        | `http://32.192.124.14:6333/dashboard` |
| Colección        | `infodets_docs`                       |
| Ubicación en EC2 | `/home/ubuntu/qdrant/`                |
| Versión          | v1.17.1                               |

**Comandos de gestión en EC2:**

```bash
docker start qdrant    # Levantar
docker stop qdrant     # Detener
docker logs qdrant     # Ver logs
```

---

### CI/CD — GitHub Actions

| Campo              | Valor                                                    |
| ------------------ | -------------------------------------------------------- |
| Workflow           | `.github/workflows/deploy.yml`                           |
| Trigger            | Push a rama `main`                                       |
| Acción             | `git pull` + `pip install` + `systemctl restart fastapi` |
| Secret EC2_HOST    | `32.192.124.14`                                          |
| Secret EC2_USER    | `ubuntu`                                                 |
| Secret EC2_SSH_KEY | Clave PEM (solicitar al líder)                           |

---

### FastAPI — Servicio systemd

```bash
sudo systemctl start fastapi    # Iniciar
sudo systemctl stop fastapi     # Detener
sudo systemctl restart fastapi  # Reiniciar
sudo systemctl status fastapi   # Ver estado
tail -f ~/uvicorn.log           # Ver logs
```

---

PARA NUEVOS INTEGRANTES

### Prerequisitos

- Git instalado
- Node.js 20+ instalado
- Python 3.13 instalado
- Docker Desktop instalado y corriendo

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/Jorge-Loyo/infodets.git
cd infodets
git checkout Frontend
```

### Paso 2 — Configurar el Front-End

```bash
cd Frontend/infodets-web
npm install
```

Crear el archivo `.env.local` con estos valores:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/v1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_uOuYTO6Ce
NEXT_PUBLIC_COGNITO_CLIENT_ID=6sr8e9s203gb8reco11d9gsal1
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_REDIRECT_SIGN_IN=http://localhost:3000/consulta
NEXT_PUBLIC_REDIRECT_SIGN_OUT=http://localhost:3000/login
```

Correr el Front-End:

```bash
npm run dev
```

### Paso 3 — Configurar el Back-End

```bash
cd Backend
py -m venv venv
source venv/Scripts/activate      # Windows Git Bash
# source venv/bin/activate         # Mac / Linux
pip install -r requirements.txt
```

Solicitar el archivo `.env` al líder del proyecto y copiarlo en `Backend/.env`.

Correr el Back-End:

```bash
uvicorn main:app --reload
```

### Paso 4 — Opción Docker (más simple)

```bash
cd /c/git/infodets
docker-compose -f docker-compose.dev.yml up --build
```

### Paso 5 — Verificar

| Servicio     | URL                        |
| ------------ | -------------------------- |
| Front-End    | http://localhost:3000      |
| Back-End API | http://localhost:8000      |
| Docs API     | http://localhost:8000/docs |

---

## 7. PLAN DE SPRINTS

> **Fechas clave:**
> - 🎯 **MVP:** 24 de mayo de 2025 — sistema funcional de punta a punta (chat con IA + login + ingesta)
> - 🚀 **Entrega final:** 28 de junio de 2025 — sistema en producción con todas las funcionalidades

| Sprint | Período aproximado | Hito |
| ------ | ------------------ | ---- |
| S0 | Semanas 1-2 (cerrado) | Entorno AWS |
| S1 | Semanas 3-4 | Autenticación real |
| S2 | Semanas 5-6 | Pipeline RAG |
| S3 | Semanas 7-8 → **hasta 24 mayo** | Chat IA real = **MVP** |
| S4 | Semanas 9-10 → hasta ~14 junio | Dashboard + feedback |
| S5 | Semanas 11-12 → **hasta 28 junio** | Producción = **Entrega final** |

---

### Sprint 0 ✅ 100% — Semana 1-2 | CERRADO

| Tarea                                     | Estado                                         | Responsable |
| ----------------------------------------- | ---------------------------------------------- | ----------- |
| Clonar repo y levantar Docker local       | ✅                                             | Todos       |
| Confirmar mecanismo de streaming del chat | ✅ SSE + Gemini stream=True                    | P1 + P2     |
| Crear instancia EC2 en AWS                | ✅                                             | P2          |
| Cognito — 2 App Clients configurados      | ✅                                             | P2          |
| Crear base de datos RDS PostgreSQL        | ✅                                             | P2          |
| Instalar n8n en Docker en EC2             | ✅                                             | P3          |
| Definir estructura de tablas              | ✅ Modelo híbrido PostgreSQL + Pinecone/Qdrant | P2 + P3     |
| Definir contratos de API                  | ✅ Schema-First Pydantic + TypeScript          | P1 + P2     |
| Actualizar variables de entorno           | ✅                                             | Todos       |

**Entregable:** Entorno completo funcionando en EC2. Todos pueden hacer `docker-compose up` y ver el sistema.

---

### Sprint 1 ✅ 100% | Semana 3-4 | Base de datos y autenticación real

| Tarea                                                                  | Estado       | Responsable |
| ---------------------------------------------------------------------- | ------------ | ----------- |
| Crear modelos SQLAlchemy (Usuario, Documento, HistorialChat, ReporteFeedback) | ✅ Completo  | P2          |
| Configurar Alembic para migraciones                                          | ✅ Completo  | P2          |
| Implementar endpoints CRUD de usuarios en FastAPI                            | ✅ Completo  | P2          |
| Conectar login del Front-End con Cognito real                          | ✅ Completo  | P1          |
| Implementar middleware de rutas protegidas en Next.js                  | ✅ Completo  | P1          |
| Probar flujo completo: login → token → request autenticado → logout    | ✅ Completo  | P1 + P2     |
| Crear primer workflow en n8n (trigger de prueba)                       | ✅ Completo  | P3          |
| Instalar e integrar Qdrant                                             | ✅ Completo  | P3          |

**Logros adicionales (fuera del plan original):**
- ✅ FastAPI corriendo como servicio systemd en EC2 (auto-reinicio)
- ✅ CI/CD GitHub Actions operativo — deploy automático en push a main
- ✅ `qdrant-client` integrado en el Back-End con `qdrant_service.py`
- ✅ `amplifyConfig.ts` con `NEXT_PUBLIC_COGNITO_DOMAIN` (variable de entorno)
- ✅ `useAuth.ts` con `fetchAuthSession` + `fetchUserAttributes` + `signOut`
- ✅ `sessionStore.ts` Zustand con token, rol, `isAuthenticated`, `isAdmin`
- ✅ `axiosInstance.ts` con interceptor JWT + redirect 401 a `/login`
- ✅ Tipos espejo y servicios tipados: `consultaService`, `dashboardService`, `feedbackService`
- ✅ Hooks TanStack Query: `useHistorial`, `useDashboard`
- ✅ Modelos SQLAlchemy renombrados en español (`Usuario`, `Documento`, `HistorialChat`, `ReporteFeedback`)
- ✅ Alembic configurado con `env.py` conectado a RDS — listo para `alembic upgrade head`
- ✅ `usuario_routes.py` — endpoints `GET /usuarios`, `GET /usuarios/{id}`, `PUT /usuarios/{id}`, `DELETE /usuarios/{id}`
- ✅ `usuario_service.py` — CRUD completo: crear, obtener, listar, actualizar, eliminar
- ✅ `UsuarioActualizar` schema agregado en `auth_schema.py`
- ✅ Login Cognito funcionando via `/auth/callback` con grupos (`cognito:groups`)
- ✅ Rol `admin` leído desde `cognito:groups` del `idToken` — sin depender de atributos custom
- ✅ Sidebar muestra botón "Administrador" solo a usuarios con rol `admin`
- ✅ `sessionStore.ts` con persistencia Zustand (`infodets-session` en localStorage)
- ✅ Migraciones Alembic ejecutadas — tablas `usuarios`, `documentos`, `historial_chat`, `reportes_feedback` creadas en RDS
- ✅ Campos `categoria` y `dependencia` agregados a tabla `documentos`

**Entregable:** Usuario puede loguearse con Cognito real y acceder a rutas protegidas. ✅ CUMPLIDO

---

### SPRINT 2 ✅ 100% | Semana 5-6 | Pipeline RAG e ingesta de documentos

| Tarea                                                                        | Estado          | Responsable |
| ---------------------------------------------------------------------------- | --------------- | ----------- |
| Implementar endpoint de carga de documentos en FastAPI                       | ✅ Completo     | P2          |
| Conectar formulario de carga del Front-End con el endpoint real              | ✅ Completo     | P1          |
| Workflow n8n ingesta: FastAPI procesa PDF → notifica a n8n con resultado     | ✅ Completo     | P3          |
| Integrar Qdrant para almacenar vectores (gemini-embedding-001, 3072 dims)    | ✅ Completo     | P3          |
| Implementar búsqueda semántica RAG (umbral confianza 0.7)                    | ✅ Completo     | P3          |
| Endpoint `POST /v1/chat/stream` con RAG + Gemini + fallback Groq             | ✅ Completo     | P2 + P3     |
| Guardar historial en RDS — servicio listo, activa con `alembic upgrade head` | ✅ Completo     | P2 + P3     |

**Logros adicionales (adelantaron tareas del Sprint 3):**
- ✅ Gemini API Key configurada + modelo `gemini-2.0-flash-lite` operativo
- ✅ Chat streaming SSE implementado y probado (`POST /v1/chat/stream`)
- ✅ Lógica de umbral de confianza: >70% responde con docs oficiales, <70% avisa fallback
- ✅ Groq (`llama-3.3-70b-versatile`) como fallback automático cuando Gemini da 429
- ✅ Pipeline de ingesta probado con PDF real — "Beneficios Flux 2026" → 7 chunks en Qdrant
- ✅ `consultaService.ts` con `EventSource` SSE listo para conectar al chat (P1)
- ✅ `feedbackService.ts` y `dashboardService.ts` tipados (P1)
- ✅ Hooks `useHistorial` y `useDashboard` con TanStack Query (P1)
- ✅ `ChatPanel.tsx` — conectado al endpoint real con streaming SSE via `fetch` + JWT
- ✅ Ingesta conectada a RDS — `documento_service.py` guarda metadatos en tabla `documentos`
- ✅ `ingesta_routes.py` con campos `categoria` y `dependencia` en el formulario
- ✅ `ingestaService.ts` — formulario de carga conectado al endpoint real `POST /admin/ingesta`
- ✅ `ingestaService.listar()` — listado de documentos desde `GET /admin/ingesta`

**Entregable:** Se puede subir un PDF y hacerle una pregunta que el sistema responde con el contenido del documento. ✅ CUMPLIDO

---

### SPRINT 3 ✅ 100% CERRADO — Semana 7-8 | Motor de IA y flujos de decisión — **MVP ✅ CUMPLIDO**

> 🎯 **MVP del 24 de mayo CUMPLIDO.** El sistema recibe consultas, responde con IA usando documentos oficiales y permite login real.

| Tarea                                                                 | Estado   | Responsable |
| --------------------------------------------------------------------- | -------- | ----------- |
| Obtener API Key de Google Gemini (Google AI Studio)                   | ✅       | P3          |
| Instalar `google-generativeai` en el Back-End                         | ✅       | P3          |
| Implementar servicio de IA con streaming                              | ✅       | P3          |
| Integrar `StreamingResponse` de FastAPI para streaming al Front-End   | ✅       | P2 + P3     |
| Implementar lógica de umbral de confianza (>70% local, <70% fallback) | ✅       | P3          |
| Groq como fallback automático cuando Gemini da 429                    | ✅       | P3          |
| Reactivar autenticación Cognito JWT en endpoints de chat e ingesta    | ✅       | P2          |
| Conectar el chat del Front-End con el endpoint real (SSE)             | ✅       | P1 + P3     |
| Renderizar respuesta con enlace cliqueable al documento fuente        | ✅       | P1          |
| Historial de consultas en panel lateral                               | ✅       | P1 + P2     |
| Implementar ticket silencioso al admin cuando score < 0.3             | ✅       | P3          |

**Logros adicionales (Sprint 3 extendido — adelantaron Sprint 4):**
- ✅ `ChatPanel.tsx` — streaming SSE real via `fetch` con JWT, chunks en tiempo real
- ✅ Fuentes con links clicables y % de confianza al finalizar cada respuesta
- ✅ `HistorialPanel.tsx` — últimas 20 consultas reales desde RDS
- ✅ Gestión completa de usuarios (`/dashboard/usuarios`) — CRUD real con RDS
- ✅ Derechos por usuario (`/dashboard/derechos`) — permisos por sección del menú, persistidos en RDS
- ✅ Perfiles de acceso (`/dashboard/perfiles`) — roles + permisos, asignación a usuarios
- ✅ Auto-registro en RDS al hacer login — sincronización automática de rol desde `cognito:groups`
- ✅ Página de perfil (`/perfil`) — edición con datos reales de RDS, modo lectura/edición
- ✅ Noticias (`/dashboard/noticias` + `/noticias`) — CRUD completo con imágenes, publicación/borrador
- ✅ Tablas administrables (`/dashboard/tablas`) — instituciones, cargos, dependencias, categorías desde RDS
- ✅ Desplegables dinámicos en perfil y usuarios — cargo, institución, dependencia desde tablas RDS
- ✅ Sidebar dinámico — muestra/oculta opciones según permisos del usuario
- ✅ 7 migraciones Alembic aplicadas en RDS
- ✅ Tickets de vacío de información (`/dashboard/notificaciones`) — score < 0.3 crea ticket automático
- ✅ Página `/documentacion` funcional — carga PDFs + listado con link al PDF
- ✅ Página `/dashboard/documentacion` — admin puede eliminar documentos de Qdrant + RDS
- ✅ Fuentes del chat con links directos al PDF original

**Entregable:** ✅ CUMPLIDO — Chat funcional con IA real, login Cognito, ingesta de documentos, gestión de usuarios y perfiles operativa.

---

### SPRINT 4 🟡 En progreso — Semana 9-10 | Feedback, dashboard y administración

| Tarea                                                                     | Estado      | Responsable |
| ------------------------------------------------------------------------- | ----------- | ----------- |
| Implementar endpoint de feedback en FastAPI                               | ⏳ Pendiente | P2          |
| Conectar botón de feedback del Front-End con el endpoint real             | ⏳ Pendiente | P1          |
| Implementar endpoints del dashboard (hot topics, consultas por día)       | ⏳ Pendiente | P2          |
| Conectar gráficos del dashboard con datos reales de RDS                   | ⏳ Pendiente | P1          |
| Implementar CRUD real de usuarios desde el panel admin                    | ✅ Completo  | P1 + P2     |
| Implementar CRUD real de documentos desde el panel admin                  | ✅ Completo  | P1 + P2     |
| Implementar control de acceso por rol (admin vs operador) en el Front-End | ✅ Completo  | P1          |
| Workflow n8n de notificación al admin (WhatsApp o email)                  | ⏳ Pendiente | P3          |

**Entregable:** Dashboard con datos reales. Admins pueden gestionar usuarios y documentos. Feedback operativo.

---

### SPRINT 5 — Semana 11-12 → **hasta 28 junio (Entrega final)** | Pulido, pruebas y despliegue

| Tarea                                                              | Responsable |
| ------------------------------------------------------------------ | ----------- |
| Pruebas de integración Front-End ↔ Back-End                        | P1 + P2     |
| Pruebas del pipeline RAG con documentos reales                     | P3          |
| Optimización de rendimiento (caché TanStack Query, índices en RDS) | P1 + P2     |
| Configurar GitHub Actions para CI/CD automático a EC2              | P2          |
| Configurar CloudFront para el Front-End (ya existe `d84l1y8p4kdic.cloudfront.net`) | P2          |
| Configurar dominio y certificado SSL                               | P2          |
| Revisión de seguridad (variables de entorno, permisos IAM)         | P2          |
| Documentar endpoints en Swagger (FastAPI lo genera automático)     | P2          |
| Pruebas de usuario final con flujo completo                        | Todos       |

**Entregable:** Sistema en producción en AWS. URL pública funcionando.

---

## 8. DETALLE DE TAREAS POR PROGRAMADOR

### P1 — Front-End Lead

| Sprint | Tarea crítica                                  |
| ------ | ---------------------------------------------- |
| S0     | Contratos de API definidos ✅                  |
| S1     | Login real con Cognito + rutas protegidas      |
| S2     | Formulario de carga conectado al Back-End real |
| S3     | Chat con streaming SSE + renderizado de fuente |
| S4     | Dashboard con gráficos reales + CRUD admin     |
| S5     | Pruebas de integración + optimización          |

---

### P2 — Back-End Engineer

| Sprint | Tarea crítica                                |
| ------ | -------------------------------------------- |
| S0     | EC2 + RDS + Cognito ✅                       |
| S1     | Modelos de base de datos + CRUD usuarios     |
| S2     | Endpoint de carga de documentos              |
| S3     | Endpoint `/consultas` conectado al RAG de P3 |
| S4     | Endpoints de feedback y dashboard            |
| S5     | CI/CD + CloudFront + SSL + producción        |

---

### P3 — IA & Orquestación

| Sprint | Tarea crítica                                      |
| ------ | -------------------------------------------------- |
| S0     | n8n instalado en EC2 ✅                            |
| S1     | Qdrant instalado en EC2 + primer workflow n8n ✅   |
| S2     | Pipeline completo de ingesta: PDF → vectores       |
| S3     | API Key Gemini + streaming con google-generativeai |
| S4     | Notificaciones al admin + tickets de vacío         |
| S5     | Pruebas del pipeline con documentos reales         |

---

## 9. DEPENDENCIAS ENTRE EQUIPOS

| Dependencia                     | Bloqueado | Requiere de        | Sprint   |
| ------------------------------- | --------- | ------------------ | -------- |
| Contratos de API definidos      | P1        | P2                 | ✅ Listo |
| Cognito configurado en AWS      | P1        | P2                 | ✅ Listo |
| Endpoint `/consultas` operativo | P1        | P2 + P3            | S3       |
| Pipeline RAG funcionando        | P2        | P3                 | S2       |
| API Key Gemini obtenida         | P3        | Gestión del equipo | S3       |
| Endpoint de feedback            | P1        | P2                 | S4       |
| Endpoints del dashboard         | P1        | P2                 | S4       |

**Regla:** Si una dependencia se retrasa, el programador bloqueado trabaja con datos mock y avanza en otras tareas. No se detiene el sprint.

---

## 10. CONVENCIONES DE TRABAJO EN EQUIPO

### Ramas Git

```
main          → Producción. Solo recibe merges.
Frontend      → Desarrollo Front-End (P1)
Backend       → Desarrollo Back-End (P2)
Configuracion → Configuración e infraestructura
Data          → Datos y modelos IA (P3)
feature/xxx   → Funcionalidades específicas
fix/xxx       → Correcciones de bugs
```

### Commits (Conventional Commits)

```
feat: nueva funcionalidad
fix: corrección de bug
chore: tareas de mantenimiento
docs: documentación
refactor: refactorización sin cambio de funcionalidad
```

### Pull Requests

- Todo PR debe ser revisado por al menos 1 compañero antes de mergear
- El PR debe incluir descripción de qué hace y cómo probarlo
- No se mergea código que no compile

### Reuniones sugeridas

- Martes: Planning del sprint (30 min)
- Viernes: Sync rápido de bloqueos (15 min)
- Domindos: Demo de lo construido en la semana (30 min)

---

## 11. DECISIONES DE ARQUITECTURA

### 11.1 Motor de IA — API directa de Google Gemini

> **Fecha:** Sprint 0 | **Decisión:** Migrar de Amazon Bedrock a la API directa de Google Gemini

| Aspecto             | Detalle                                                  |
| ------------------- | -------------------------------------------------------- |
| Modelo              | Gemini 1.5 Flash — mismo modelo, diferente proveedor     |
| Librería            | `google-generativeai` (SDK oficial de Google)            |
| Infraestructura AWS | Se mantiene intacta (EC2, RDS, Cognito, n8n)             |
| n8n                 | Cambiar nodo Bedrock por HTTP Request a API de Google    |
| Costos              | Factura separada Google Cloud — precios más competitivos |
| Capa gratuita       | Google AI Studio ofrece capa gratuita para desarrollo    |
| RF2                 | Ningún impacto — Gemini recibe el contexto RAG igual     |
| RF4                 | Ningún impacto — depende del Back-End y n8n              |

```bash
pip install google-generativeai
```

---

### 11.2 Mecanismo de Streaming — SSE con StreamingResponse

> **Fecha:** Sprint 0 | **Decisión:** SSE via `StreamingResponse` de FastAPI + `generate_content(stream=True)` de Gemini

**Flujo:**

```
Usuario escribe consulta
        ↓
Front-End (Next.js) → POST /v1/chat/stream
        ↓
FastAPI recupera contexto de Pinecone/Qdrant (RAG)
        ↓
FastAPI llama a Gemini API con stream=True
        ↓
Gemini envía chunks de texto
        ↓
FastAPI reenvía cada chunk via StreamingResponse (text/event-stream)
        ↓
Front-End acumula chunks y actualiza el chat en tiempo real
        ↓
Al finalizar → se envía el enlace al documento fuente (RF2)
```

**Implementación Back-End:**

```python
import google.generativeai as genai
from fastapi.responses import StreamingResponse

model = genai.GenerativeModel('gemini-1.5-flash')

async def stream_gemini_answer(user_prompt: str, context: str):
    full_prompt = f"Contexto: {context}\n\nPregunta: {user_prompt}"
    response = model.generate_content(full_prompt, stream=True)
    for chunk in response:
        yield f"data: {chunk.text}\n\n"

@app.post("/v1/chat/stream")
async def chat_endpoint(request: ChatRequest):
    context = vector_db.query(request.message)
    return StreamingResponse(
        stream_gemini_answer(request.message, context),
        media_type="text/event-stream"
    )
```

**Implementación Front-End:**

- Estado React para acumular chunks en tiempo real
- Componente `ScrollArea` de Mantine con scroll automático
- Enlace al documento fuente se renderiza al finalizar el stream

**Ventajas:**

| Ventaja       | Detalle                                                         |
| ------------- | --------------------------------------------------------------- |
| Baja latencia | Usuario ve actividad a los 500ms en lugar de 5-10 segundos      |
| Eficiencia    | Gemini 1.5 Flash mantiene costo por token bajo                  |
| RF2 cumplido  | Fuentes oficiales al final del stream para validación legal     |
| Seguridad     | API Key en variables de entorno Docker, tráfico TLS por defecto |

### 11.3 Base de datos vectorial — Qdrant self-hosted

> **Fecha:** Sprint 1 | **Decisión:** Qdrant self-hosted en EC2 (descartado Pinecone)

| Criterio           | Qdrant                     | Pinecone                              |
| ------------------ | -------------------------- | ------------------------------------- |
| Soberanía de datos | ✅ Total — datos en EC2    | ❌ Datos en servidores EE.UU.         |
| Costo              | ✅ $0                      | ⚠️ Gratis con límites, luego ~$70/mes |
| Escalabilidad      | ⚠️ Requiere más RAM en EC2 | ✅ Automática                         |
| Entidad pública    | ✅ Recomendado             | ⚠️ Riesgo legal                       |

> ⚠️ **Escalabilidad:** Cuando el volumen supere los 10.000 chunks vectoriales, escalar el EC2 en AWS Console: detener instancia → cambiar tipo `t4g.micro` → `t4g.medium` (4GB) o `t4g.large` (8GB) → reiniciar. Qdrant retoma automáticamente con los datos persistidos en el volumen.

**Instalación en EC2:**

```bash
mkdir ~/qdrant && cd ~/qdrant
docker run -d --name qdrant \
  -p 6333:6333 \
  -v ~/qdrant/storage:/qdrant/storage \
  qdrant/qdrant
```

**URL interna:** `http://172.31.40.141:6333`
**Dashboard:** `http://32.192.124.14:6333/dashboard`

---

### 11.4 Estructura de base de datos — Modelo híbrido

> **Fecha:** Sprint 0 | **Decisión:** PostgreSQL (relacional) + Pinecone/Qdrant (vectorial)

**Base de datos relacional (PostgreSQL RDS):**

| Tabla               | Campos clave                                                          | Propósito                                                 |
| ------------------- | --------------------------------------------------------------------- | --------------------------------------------------------- |
| `usuarios`          | id, cognito_sub, email, nombre, rol (admin/operador/visor)            | Gestión de usuarios RBAC sincronizada con Cognito         |
| `documentos`        | id, titulo, url_fuente, jerarquia, estado, subido_por                 | Registro de documentación oficial con prioridad normativa |
| `historial_chat`    | id, usuario_id, documento_id, pregunta, respuesta, puntaje_confianza  | Historial de consultas para hot topics y mejora continua  |
| `reportes_feedback` | id, historial_id, es_correcto, comentario, estado (abierto/resuelto)  | Motor de mejora continua — reportes de error              |

**Base de datos vectorial (Qdrant self-hosted en EC2):**

```
Vector Object
  id            String — ID único del chunk
  vector        Float[] — embedding generado por el modelo
  metadata:
    text        String — contenido textual para Gemini
    document_id UUID — FK a tabla documents de PostgreSQL
    source_url  String — URL oficial para citar la fuente
    page_number Integer — referencia dentro del documento
```

**Justificación:**

- Consistencia legal: cada respuesta de Gemini vinculada a un registro oficial en `documents`
- Hot Topics: consultas SQL sobre `chat_history` donde `confidence_score` sea bajo
- Escalabilidad: de 10 a 10.000 documentos sin cambiar el esquema
- **Nota de escalabilidad:** Cuando el volumen supere los 10.000 chunks, escalar el EC2: `t4g.micro` (1GB) → `t4g.medium` (4GB) → `t4g.large` (8GB). Qdrant retoma automáticamente con los datos persistidos.
- Migraciones: Alembic para versionado del esquema PostgreSQL

---

## 12. RESUMEN EJECUTIVO

| Sprint | Período | Hito principal | Estado | Fecha límite |
| ------ | ------- | -------------- | ------ | ------------ |
| S0 | Semanas 1-2 | Entorno AWS funcionando, equipo alineado | ✅ 100% | Cerrado |
| S1 | Semanas 3-4 | Login real con Cognito de punta a punta | ✅ 100% | Cerrado |
| S2 | Semanas 5-6 | Ingesta de documentos y búsqueda RAG básica | ✅ 100% | Cerrado |
| S3 | Semanas 7-8 | Chat con IA real (Gemini + fallback + tickets) | ✅ 100% | **24 mayo — MVP ✅ CUMPLIDO** |
| S4 | Semanas 9-10 | Dashboard real + feedback + administración | 🟡 50% (CRUD admin ✅, feedback ⏳) | ~14 junio |
| S5 | Semanas 11-12 | Producción en AWS con CI/CD | ⏳ | **28 junio — Entrega final** |

> 🎯 **MVP (24 mayo):** Chat funcional con IA real + login Cognito + ingesta de documentos operativa.
> 🚀 **Entrega final (28 junio):** Sistema completo en producción con dashboard, feedback, CRUD admin y URL pública.

---

---

### 11.5 Workflow n8n de ingesta — Arquitectura ajustada

> **Fecha:** Sprint 2 | **Decisión:** FastAPI procesa el PDF directamente, n8n recibe notificación con resultado

**Problema encontrado:** n8n 2.17.5 tiene un bug con el tipo `n8n Binary File` en el nodo HTTP Request — no puede reenviar archivos binarios (PDFs) recibidos en un webhook hacia otro endpoint.

**Solución adoptada:**

```
Antes (plan original):   curl → n8n webhook → n8n reenvía PDF → FastAPI
Ahora (implementado):    curl → FastAPI directamente → FastAPI notifica a n8n
```

| Aspecto     | Detalle                                                                      |
| ----------- | ---------------------------------------------------------------------------- |
| Webhook n8n | `POST /webhook/ingesta-completada` — recibe metadatos, no el PDF             |
| Payload     | `{documento_id, titulo, categoria, dependencia, estado, chunks}`             |
| Ventaja     | Más simple, sin dependencia de n8n para el procesamiento crítico             |
| Sprint 4    | n8n agregará notificación al admin (email/WhatsApp) cuando reciba el webhook |

---

### 11.6 Fallback de IA — Groq como respaldo de Gemini

> **Fecha:** Sprint 2 | **Decisión:** Groq con llama-3.3-70b-versatile como fallback automático

**Problema:** API Keys gratuitas de Gemini tienen límite de 15 RPM (requests por minuto).

**Solución:**

```
Intenta Gemini gemini-2.0-flash-lite
    ↓ Si HTTPStatusError 429
Fallback automático a Groq llama-3.3-70b-versatile
```

| Aspecto         | Gemini                        | Groq (fallback)         |
| --------------- | ----------------------------- | ----------------------- |
| Modelo          | gemini-2.0-flash-lite         | llama-3.3-70b-versatile |
| Límite gratuito | 15 RPM                        | 30 RPM                  |
| Streaming       | Simulado (respuesta completa) | Real (chunks)           |
| Activación      | Principal                     | Automático en 429       |

---

_INFODETS — Sistema de Gestión de Conocimiento Dinámico_
_Plan de Desarrollo v3.1 — Equipo de 3 programadores_
_MVP: 24 de mayo de 2025 ✅ CUMPLIDO | Entrega final: 28 de junio de 2025_
