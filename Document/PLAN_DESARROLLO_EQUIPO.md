# PLAN DE DESARROLLO — INFODETS
## Sistema de Gestión de Conocimiento Dinámico

---

> **Versión:** 4.1
> **Estado:** Sprint Testeo 🟡 En progreso
> **Última actualización:** Mayo 2026
> **Rama activa:** `Testeo`
> **MVP:** 24 de mayo de 2025 ✅ CUMPLIDO
> **Entrega final:** 28 de junio de 2025

---

## ÍNDICE

1. [Resumen del sistema](#1-resumen-del-sistema)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Infraestructura AWS](#3-infraestructura-aws)
4. [Arquitectura de autenticación](#4-arquitectura-de-autenticación)
5. [Sistema de perfiles y permisos](#5-sistema-de-perfiles-y-permisos)
6. [Loop de retroalimentación](#6-loop-de-retroalimentación)
7. [Tablas en RDS](#7-tablas-en-rds)
8. [Plan de sprints](#8-plan-de-sprints)
9. [Convenciones de trabajo](#9-convenciones-de-trabajo)
10. [Decisiones de arquitectura](#10-decisiones-de-arquitectura)

---

## 1. RESUMEN DEL SISTEMA

INFODETS es una plataforma web impulsada por IA y bases de datos vectoriales (RAG). Responde consultas ciudadanas basándose en documentación oficial del sector público, con un motor de mejora continua que detecta vacíos de información.

**Flujo principal:**

```
Usuario hace consulta en lenguaje natural
        ↓
FastAPI recibe la consulta
        ↓
RAG busca en Qdrant (base vectorial)
        ↓
Si confianza ≥ 70% → Gemini responde con documentación oficial
Si confianza < 70% → Loop de retroalimentación escalonado:
    Nivel 1: Busca en URLs oficiales configuradas en el dashboard
    Nivel 2: Búsqueda web via Serper API
    Nivel 3: Escalamiento humano → ticket + notificación n8n al admin
        ↓
Respuesta con enlace al documento fuente
        ↓
Sistema de validaciones para entrenamiento continuo de la IA
```

---

## 2. STACK TECNOLÓGICO

| Capa | Tecnología | Detalle |
|---|---|---|
| Frontend | Next.js 16 + React + TypeScript | App Router, SSR |
| UI | Mantine UI v9 + Framer Motion + Tabler Icons | |
| Estado | Zustand con persist | Sesión + permisos en localStorage |
| HTTP | Axios | Interceptores JWT, excluye /auth/login del 401 global |
| Backend | FastAPI (Python 3.13) | Estructura modular por dominio |
| Autenticación | JWT HS256 propio + AWS Cognito | USER_PASSWORD_AUTH, sin OAuth redirects |
| Base de datos relacional | AWS RDS PostgreSQL 17 | 13 tablas, migraciones con Alembic |
| Base de datos vectorial | Qdrant self-hosted en EC2 | gemini-embedding-001, 3072 dims |
| Generación IA | Gemini `gemini-2.0-flash-lite` | Fallback automático a Groq en 429 |
| Fallback IA | Groq `llama-3.3-70b-versatile` | 30 RPM gratis |
| Embeddings | Google Gemini `gemini-embedding-001` | 3072 dimensiones |
| Búsqueda web | Serper API | 2.500 búsquedas/mes gratis, Nivel 2 del loop |
| Orquestación | n8n Docker self-hosted en EC2 | Notificaciones email al admin |
| Infraestructura | AWS EC2 + RDS + Cognito | us-east-1 |

---

## 3. INFRAESTRUCTURA AWS

### EC2 — Servidor principal

| Campo | Valor |
|---|---|
| IP pública | `32.192.124.14` (Elastic IP fija) |
| IP privada | `172.31.40.141` |
| Sistema operativo | Ubuntu 24.04 LTS |
| Región | `us-east-1` |
| Conexión SSH | `ssh -i "keyinfodets.pem" ubuntu@32.192.124.14` |

**Servicios corriendo en EC2:**

| Servicio | URL | Estado |
|---|---|---|
| FastAPI | `http://32.192.124.14:8000` | ✅ systemd auto-reinicio |
| Qdrant | `http://32.192.124.14:6333` | ✅ Docker restart=always |
| n8n | `http://32.192.124.14:5678` | ✅ Docker |
| Next.js | `http://32.192.124.14:3000` | ✅ Docker restart=always |

### RDS PostgreSQL

| Campo | Valor |
|---|---|
| Host | `infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com` |
| Puerto | `5432` |
| Base de datos | `infodets` |
| Usuario | `infodets_admin` |
| Versión | PostgreSQL 17.6 |
| Instancia | `db.t4g.micro` |

**Tunnel SSH para desarrollo local:**
```bash
ssh -i "keyinfodets.pem" -L 5432:infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com:5432 ubuntu@32.192.124.14 -N
```

### Qdrant

| Campo | Valor |
|---|---|
| URL interna EC2 | `http://172.31.40.141:6333` |
| Dashboard | `http://32.192.124.14:6333/dashboard` |
| Colección | `infodets_docs` |
| Dimensiones | 3072 (gemini-embedding-001) |

**Tunnel SSH para desarrollo local:**
```bash
ssh -i "keyinfodets.pem" -L 6333:localhost:6333 ubuntu@32.192.124.14 -N
```

**Gestión en EC2:**
```bash
docker start qdrant   # Levantar
docker stop qdrant    # Detener
docker logs qdrant    # Ver logs
```

### Cognito

| Campo | Valor |
|---|---|
| User Pool ID | `us-east-1_uOuYTO6Ce` |
| App Client backend | `40g4ffmsvf8mmk77kc37abucvd` |
| Auth Flow habilitado | `ALLOW_USER_PASSWORD_AUTH` |
| Dominio | `us-east-1uouyto6ce.auth.us-east-1.amazoncognito.com` |

### n8n

| Campo | Valor |
|---|---|
| URL | `http://32.192.124.14:5678` |
| Usuario | `admin` |
| Workflows activos | `INFODETS - Invitar Usuario`, `INFODETS - Notificaciones Loop Retroalimentacion` |

### CI/CD — GitHub Actions

| Campo | Valor |
|---|---|
| Workflow | `.github/workflows/deploy.yml` |
| Trigger | Push a rama `main` |
| Acción | `git pull` + `pip install` + `systemctl restart fastapi` |

---

## 4. ARQUITECTURA DE AUTENTICACIÓN

El sistema usa **login propio con JWT HS256** — sin OAuth ni redirects de Cognito.

```
Frontend (email + password)
        ↓
Validación: EMAIL_REGEX + PASSWORD_REGEX (botón deshabilitado si no cumple)
        ↓
POST /v1/auth/login
        ↓
Backend: Cognito initiate_auth (USER_PASSWORD_AUTH) → valida credenciales
        ↓
Backend genera JWT HS256 (sub=usuario_id_RDS, exp=8h)
        ↓
Frontend: GET /v1/permisos/{usuario_id} con el token recibido
        ↓
setSession(usuario, token, permisos) → Zustand + localStorage
        ↓
Todas las requests: Authorization: Bearer <jwt>
        ↓
Backend verifica JWT HS256 con secret_key local (sin llamadas a Cognito)
```

**Política de contraseñas (Cognito):**

| Regla | Valor |
|---|---|
| Longitud mínima | 8 caracteres |
| Mayúsculas | Al menos 1 |
| Minúsculas | Al menos 1 |
| Números | Al menos 1 |
| Símbolos | Al menos 1 (`!@#$%^&*...`) |

Ejemplo válido: `Infodets2024!`

**Credenciales AWS para blanqueo de contraseñas:**
Las credenciales son temporales (sesión de laboratorio AWS Academy). Deben actualizarse en `Backend/.env` cada vez que se inicia una nueva sesión en el portal.

---

## 5. SISTEMA DE PERFILES Y PERMISOS

El perfil es la **única fuente de verdad** para los permisos. No existe rol como entidad separada.

### Secciones del perfil

| Sección | Tipo | Descripción |
|---|---|---|
| `consulta` | Menú | Acceso al chat con IA |
| `perfil` | Menú | Acceso a la página de perfil |
| `documentacion` | Menú | Acceso a documentación |
| `noticias` | Menú | Acceso a noticias |
| `dashboard` | Menú | Acceso al panel administrativo |
| `gestionar_usuarios` | Acción | CRUD usuarios, perfiles, derechos, blanqueo |
| `blanquear_password` | Acción | Blanqueo de contraseñas en Cognito |
| `gestionar_documentos` | Acción | Subir/eliminar documentos, URLs oficiales |
| `gestionar_noticias` | Acción | CRUD de noticias |
| `gestionar_tablas` | Acción | Administrar tablas de valores |
| `ver_validaciones` | Acción | Ver y aprobar validaciones de IA |

### Flujo de permisos

```
Login → GET /permisos/{usuario_id} → guardado en Zustand (persist)
        ↓
Sidebar lee tienePermiso() del store → sin fetch, sin parpadeo
        ↓
Backend: require_permiso('seccion') verifica en DB por endpoint
        ↓
Al asignar/editar perfil → permisos se propagan a todos sus usuarios
```

### Gestión

- `/dashboard/derechos` — crear perfiles, definir permisos (menú + acciones), asignar usuarios
- `/dashboard/usuarios` — CRUD usuarios, perfil obligatorio al crear, blanqueo de contraseña

---

## 6. LOOP DE RETROALIMENTACIÓN

Sistema de mejora continua implementado en `rag_service.py` → `ejecutar_loop_retroalimentacion()`.

### Niveles de acción

| Nivel | Condición | Acción | Mensaje al usuario |
|---|---|---|---|
| 0 | Score ≥ 70% | Responde con documentación oficial local | Sin aviso |
| 1 | Score < 70% | Busca en URLs oficiales activas (tabla `urls_oficiales`) | ⚠️ Fuente externa |
| 2 | Nivel 1 vacío | Búsqueda web via Serper API | ⚠️ Fuente externa |
| 3 | Todo vacío | Mensaje de escalamiento + ticket + email n8n | Mensaje de escalamiento |

### Sistema de validaciones para entrenamiento IA

| Score | Acción |
|---|---|
| < 50% | No se crea validación |
| 50% – 85% | Validación `pendiente` → revisión manual en `/dashboard/notificaciones` |
| ≥ 85% | `auto_indexado` → indexado en Qdrant en background thread |

Al aprobar una validación manual → se indexa en Qdrant inmediatamente.

### Notificaciones n8n (workflow activo)

| Evento | Cuándo | Email |
|---|---|---|
| `nivel1_externo` | Respuesta desde URL oficial | ⚠️ Naranja — sugerir subir doc |
| `nivel2_web` | Respuesta desde búsqueda web | ⚠️ Naranja — sugerir subir doc |
| `nivel3_escalamiento` | Sin respuesta en ninguna fuente | 🚨 Rojo — urgente |
| `validacion_pendiente` | Score 50-85% requiere revisión | 🔵 Azul — link al dashboard |

---

## 7. TABLAS EN RDS

| Tabla | Propósito | Migraciones |
|---|---|---|
| `usuarios` | Usuarios con perfil completo y cognito_sub | S1 |
| `documentos` | Documentos indexados en Qdrant | S1 |
| `historial_chat` | Consultas de usuarios autenticados | S1 |
| `reportes_feedback` | Feedback de respuestas (schema listo) | S1 |
| `permisos_usuario` | Permisos individuales por sección (11 secciones) | S3 |
| `perfiles` | Perfiles de acceso | S3 |
| `perfil_permisos` | Permisos por perfil (11 secciones) | S3 |
| `tabla_valores` | Valores de desplegables (instituciones, cargos, etc.) | S3 |
| `noticias` | Publicaciones institucionales | S3 |
| `tickets_vacios` | Consultas sin documentación (score < 70%) | S3 |
| `consultas_invitado` | Consultas de usuarios no registrados | Testeo |
| `validaciones_respuesta` | Respuestas para entrenamiento de la IA | Testeo |
| `urls_oficiales` | URLs para Nivel 1 del loop de retroalimentación | Testeo |

---

## 8. PLAN DE SPRINTS

| Sprint | Período | Hito | Estado |
|---|---|---|---|
| S0 | Semanas 1-2 | Entorno AWS | ✅ 100% CERRADO |
| S1 | Semanas 3-4 | Autenticación real | ✅ 100% CERRADO |
| S2 | Semanas 5-6 | Pipeline RAG | ✅ 100% CERRADO |
| S3 | Semanas 7-8 | Chat IA real = **MVP** | ✅ 100% CERRADO — 24 mayo ✅ |
| S4 | Semanas 9-10 | Dashboard + feedback | 🟡 50% |
| Testeo | En curso | Correcciones + refactoring | 🟡 En progreso |
| S5 | Semanas 11-12 | Producción | 🟡 En curso — frontend desplegado ✅ |

---

### Sprint 0 ✅ 100% CERRADO — Entorno AWS

| Tarea | Estado | Responsable |
|---|---|---|
| Clonar repo y levantar Docker local | ✅ | Todos |
| Confirmar mecanismo de streaming del chat | ✅ SSE + Gemini stream=True | P1 + P2 |
| Crear instancia EC2 en AWS | ✅ | P2 |
| Cognito — 2 App Clients configurados | ✅ | P2 |
| Crear base de datos RDS PostgreSQL | ✅ | P2 |
| Instalar n8n en Docker en EC2 | ✅ | P3 |
| Definir estructura de tablas | ✅ Modelo híbrido PostgreSQL + Qdrant | P2 + P3 |
| Definir contratos de API | ✅ Schema-First Pydantic + TypeScript | P1 + P2 |
| Actualizar variables de entorno | ✅ | Todos |

**Entregable:** Entorno completo funcionando en EC2. ✅

---

### Sprint 1 ✅ 100% CERRADO — Base de datos y autenticación real

| Tarea | Estado | Responsable |
|---|---|---|
| Crear modelos SQLAlchemy | ✅ | P2 |
| Configurar Alembic para migraciones | ✅ | P2 |
| Implementar endpoints CRUD de usuarios | ✅ | P2 |
| Conectar login del Frontend con Cognito real | ✅ | P1 |
| Implementar middleware de rutas protegidas | ✅ | P1 |
| Probar flujo completo login → token → request → logout | ✅ | P1 + P2 |
| Crear primer workflow en n8n | ✅ | P3 |
| Instalar e integrar Qdrant | ✅ | P3 |

**Logros adicionales:**
- ✅ FastAPI como servicio systemd en EC2 (auto-reinicio)
- ✅ CI/CD GitHub Actions operativo — deploy automático en push a main
- ✅ sessionStore.ts Zustand con token, rol, isAuthenticated, isAdmin
- ✅ axiosInstance.ts con interceptor JWT + redirect 401
- ✅ Migraciones Alembic ejecutadas — tablas usuarios, documentos, historial_chat, reportes_feedback

**Entregable:** Usuario puede loguearse con Cognito real y acceder a rutas protegidas. ✅

---

### Sprint 2 ✅ 100% CERRADO — Pipeline RAG e ingesta de documentos

| Tarea | Estado | Responsable |
|---|---|---|
| Endpoint de carga de documentos en FastAPI | ✅ | P2 |
| Formulario de carga conectado al endpoint real | ✅ | P1 |
| Workflow n8n ingesta | ✅ | P3 |
| Qdrant con gemini-embedding-001 (3072 dims) | ✅ | P3 |
| Búsqueda semántica RAG (umbral 0.7) | ✅ | P3 |
| Endpoint POST /v1/chat/stream con RAG + Gemini + Groq | ✅ | P2 + P3 |
| Historial en RDS | ✅ | P2 + P3 |

**Logros adicionales:**
- ✅ Gemini gemini-2.0-flash-lite operativo
- ✅ Groq llama-3.3-70b-versatile como fallback automático en 429
- ✅ Pipeline probado con PDF real → 7 chunks en Qdrant
- ✅ Lógica de umbral de confianza: ≥70% responde con docs oficiales, <70% avisa fallback

**Nota arquitectura:** FastAPI procesa el PDF directamente, n8n recibe notificación con resultado (no el PDF). Esto resolvió un bug de n8n 2.17.5 con archivos binarios.

**Entregable:** Se puede subir un PDF y hacerle una pregunta que el sistema responde con el contenido. ✅

---

### Sprint 3 ✅ 100% CERRADO — Motor de IA — **MVP ✅ CUMPLIDO**

| Tarea | Estado | Responsable |
|---|---|---|
| API Key Gemini + streaming | ✅ | P3 |
| StreamingResponse FastAPI | ✅ | P2 + P3 |
| Lógica umbral confianza ≥70% local / <70% fallback | ✅ | P3 |
| Chat Frontend conectado SSE | ✅ | P1 + P3 |
| Fuentes con links al PDF | ✅ | P1 |
| Historial en panel lateral | ✅ | P1 + P2 |
| Ticket silencioso score < 0.3 | ✅ | P3 |

**Logros adicionales (adelantaron Sprint 4):**
- ✅ ChatPanel.tsx — streaming SSE real via fetch con JWT, chunks en tiempo real
- ✅ HistorialPanel.tsx — últimas 20 consultas reales desde RDS
- ✅ CRUD completo de usuarios (`/dashboard/usuarios`)
- ✅ Derechos por usuario (`/dashboard/derechos`) — permisos por sección del menú
- ✅ Perfiles de acceso (`/dashboard/perfiles`) — roles + permisos, asignación a usuarios
- ✅ Auto-registro en RDS al hacer login — sincronización desde cognito:groups
- ✅ Página de perfil (`/perfil`) — edición con datos reales de RDS
- ✅ Noticias CRUD con imágenes, publicación/borrador
- ✅ Tablas administrables (instituciones, cargos, dependencias, categorías)
- ✅ Sidebar dinámico según permisos del usuario
- ✅ 7 migraciones Alembic aplicadas en RDS
- ✅ Tickets de vacío de información en `/dashboard/notificaciones`
- ✅ Página `/documentacion` — carga PDFs + listado con link al PDF

**Entregable:** Chat funcional con IA real, login Cognito, ingesta de documentos, gestión de usuarios y perfiles. ✅

---

### Sprint 4 🟡 50% — Dashboard + feedback + administración

| Tarea | Estado | Responsable |
|---|---|---|
| Endpoint de feedback en FastAPI | ⏳ Pendiente | P2 |
| Botón de feedback en el chat | ⏳ Pendiente | P1 |
| Endpoints dashboard (hot topics, consultas por día) | ⏳ Pendiente | P2 |
| Gráficos dashboard con datos reales | ⏳ Pendiente | P1 |
| CRUD real de usuarios desde panel admin | ✅ Completo | P1 + P2 |
| CRUD real de documentos desde panel admin | ✅ Completo | P1 + P2 |
| Control de acceso por rol en Frontend | ✅ Completo | P1 |
| Workflow n8n notificación al admin | ✅ Completo | P3 |

---

### Sprint Testeo 🟡 En progreso — Correcciones y refactoring

| Tarea | Estado |
|---|---|
| Login propio JWT HS256 (reemplazó OAuth Cognito) | ✅ |
| Fix: mensaje de error en login no se borraba por refresh | ✅ |
| Fix: interceptor axios excluye /auth/login del 401 global | ✅ |
| Fix: historial de chat no se actualizaba tras consulta | ✅ |
| Fix: usuario_id incorrecto en guardar_historial | ✅ |
| Loop de retroalimentación 3 niveles (umbral 70%) | ✅ |
| Sistema de validaciones para entrenamiento IA | ✅ |
| Notificaciones n8n por nivel y validaciones pendientes | ✅ |
| URLs oficiales gestionadas desde `/dashboard/documentacion` | ✅ |
| Consulta invitado con formulario + institución desde tabla | ✅ |
| Sistema de perfiles como única fuente de verdad (eliminó rol duplicado) | ✅ |
| Permisos en Zustand al login (sin fetch, sin parpadeo en sidebar) | ✅ |
| Blanqueo de contraseña desde `/dashboard/usuarios` | ✅ |
| DatePicker para fecha de nacimiento (DD/MM/AAAA) | ✅ |
| Emails normalizados a minúsculas en toda la app | ✅ |
| Sincronización usuarios Cognito ↔ RDS | ✅ |
| Perfil obligatorio al crear usuario | ✅ |
| Fusión `/dashboard/perfiles` en `/dashboard/derechos` | ✅ |
| Permisos backend: require_permiso() reemplazó require_admin() | ✅ |
| 3 nuevas tablas en RDS: consultas_invitado, validaciones_respuesta, urls_oficiales | ✅ |
| Despliegue frontend en producción EC2 | ✅ `http://32.192.124.14:3000` |
| Feedback botón en chat | ⏳ Pendiente |
| Dashboard con datos reales (hot topics, gráficos) | ⏳ Pendiente |

---

### Sprint 5 ⏳ En curso — Producción

| Tarea | Estado | Responsable |
|---|---|---|
| Frontend desplegado en EC2 | ✅ `http://32.192.124.14:3000` | P1 |
| Feedback botón en chat + endpoint | ⏳ Pendiente | P1 + P2 |
| Dashboard con datos reales (hot topics, gráficos) | ⏳ Pendiente | P1 + P2 |
| Pruebas de integración Frontend ↔ Backend | ⏳ Pendiente | P1 + P2 |
| Pruebas del pipeline RAG con documentos reales | ⏳ Pendiente | P3 |
| Configurar CloudFront para el Frontend | ⏳ Pendiente | P2 |
| Configurar dominio y certificado SSL | ⏳ Pendiente | P2 |
| Revisión de seguridad (variables de entorno, permisos IAM) | ⏳ Pendiente | P2 |
| Pruebas de usuario final con flujo completo | ⏳ Pendiente | Todos |

**Entregable:** Sistema en producción en AWS. URL pública funcionando.

---

## 9. CONVENCIONES DE TRABAJO

### Ramas Git

```
main          → Producción. Solo recibe merges.
Testeo        → Rama activa de desarrollo y corrección de errores
Frontend      → Desarrollo Frontend (P1)
Backend       → Desarrollo Backend (P2)
Configuracion → Configuración e infraestructura
Data          → Datos y modelos IA (P3)
```

### Commits (Conventional Commits)

```
feat:     nueva funcionalidad
fix:      corrección de bug
refactor: refactorización sin cambio de funcionalidad
docs:     documentación
chore:    mantenimiento
```

### Pull Requests

- Todo PR debe ser revisado por al menos 1 compañero antes de mergear
- El PR debe incluir descripción de qué hace y cómo probarlo
- No se mergea código que no compile

---

## 10. DECISIONES DE ARQUITECTURA

### 10.1 Login propio JWT HS256 (reemplazó OAuth Cognito) — Sprint Testeo

**Problema:** El flujo OAuth requería redirects a `/auth/callback`, era lento y complejo. El callback hacía polling con setInterval para esperar el token de Cognito.

**Solución:** Login directo email/password → Cognito `initiate_auth` (USER_PASSWORD_AUTH) → backend genera JWT HS256 propio (sub=usuario_id_RDS, exp=8h).

**Resultado:** Login instantáneo, sin redirects, sin dependencia de Cognito en cada request.

---

### 10.2 Permisos en Zustand al login (reemplazó fetch en cada render) — Sprint Testeo

**Problema:** El Sidebar hacía `GET /permisos/{id}` en cada navegación → parpadeo visible de items del menú.

**Solución:** Permisos cargados una sola vez al login junto con el token, guardados en Zustand con `persist` → disponibles desde el primer render sin ningún fetch.

---

### 10.3 Perfiles como única fuente de verdad (reemplazó sistema dual rol+perfil) — Sprint Testeo

**Problema:** Existían dos sistemas paralelos: `RolEnum` en el modelo y `Perfil` con permisos → inconsistencias y duplicación.

**Solución:** El perfil define todo — 5 secciones de menú + 6 acciones de backend. `require_admin` reemplazado por `require_permiso('seccion')` en cada endpoint.

---

### 10.4 Qdrant self-hosted (descartó Pinecone) — Sprint 1

**Razón:** Soberanía de datos para entidad pública + costo $0 vs ~$70/mes de Pinecone.

> ⚠️ **Escalabilidad:** Cuando el volumen supere los 10.000 chunks, escalar EC2: `t4g.micro` (1GB) → `t4g.medium` (4GB). Qdrant retoma automáticamente con datos persistidos en el volumen.

---

### 10.5 Gemini + Groq fallback — Sprint 2

**Razón:** API Keys gratuitas de Gemini tienen límite de 15 RPM. Groq (`llama-3.3-70b-versatile`) activa automáticamente cuando Gemini devuelve 429.

| Aspecto | Gemini | Groq (fallback) |
|---|---|---|
| Modelo | gemini-2.0-flash-lite | llama-3.3-70b-versatile |
| Límite gratuito | 15 RPM | 30 RPM |
| Activación | Principal | Automático en 429 |

---

### 10.6 FastAPI procesa PDF directamente (reemplazó n8n como intermediario) — Sprint 2

**Problema:** n8n 2.17.5 tiene un bug con archivos binarios en el nodo HTTP Request — no puede reenviar PDFs recibidos en un webhook.

**Solución:** `curl → FastAPI directamente → FastAPI notifica a n8n` (solo metadatos, no el PDF).

---

### 10.7 Serper API para búsqueda web (Nivel 2 del loop) — Sprint Testeo

**Razón:** 2.500 búsquedas/mes gratis. Se activa solo cuando Qdrant y URLs oficiales no tienen respuesta con ≥70% de confianza.

---

*INFODETS — Sistema de Gestión de Conocimiento Dinámico*
*Plan de Desarrollo v4.1 — Sprint Testeo — Mayo 2026*
