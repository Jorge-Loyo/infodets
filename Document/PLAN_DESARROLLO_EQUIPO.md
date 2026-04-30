# PLAN DE DESARROLLO — INFODETS
## Sistema de Gestión de Conocimiento Dinámico

---

> **Versión:** 4.0
> **Estado:** Sprint Testeo 🟡 En progreso
> **Última actualización:** Refactoring completo — login propio JWT, sistema de perfiles, loop de retroalimentación
> **Rama activa:** `Testeo`

---

## ÍNDICE

1. [Resumen del sistema](#1-resumen-del-sistema)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Estado actual del proyecto](#3-estado-actual-del-proyecto)
4. [Infraestructura AWS](#4-infraestructura-aws)
5. [Arquitectura de autenticación](#5-arquitectura-de-autenticación)
6. [Sistema de perfiles y permisos](#6-sistema-de-perfiles-y-permisos)
7. [Loop de retroalimentación](#7-loop-de-retroalimentación)
8. [Tablas en RDS](#8-tablas-en-rds)
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
    Nivel 1: Busca en URLs oficiales configuradas
    Nivel 2: Búsqueda web via Serper API
    Nivel 3: Escalamiento humano → ticket automático + notificación n8n
        ↓
Respuesta con enlace al documento fuente
        ↓
Sistema de validaciones para entrenamiento de la IA
```

---

## 2. STACK TECNOLÓGICO

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 + React + TypeScript |
| UI | Mantine UI v9 + Framer Motion + Tabler Icons |
| Estado | Zustand (sesión + permisos persistidos) |
| HTTP | Axios con interceptores JWT |
| Backend | FastAPI (Python 3.13) |
| Autenticación | JWT HS256 propio + AWS Cognito (USER_PASSWORD_AUTH) |
| Base de datos relacional | AWS RDS PostgreSQL 17 |
| Base de datos vectorial | Qdrant (self-hosted en EC2 via Docker) |
| Embeddings | Google Gemini `gemini-embedding-001` (3072 dims) |
| Generación IA | Gemini `gemini-2.0-flash-lite` + Groq `llama-3.3-70b-versatile` (fallback) |
| Búsqueda web | Serper API (google.serper.dev) |
| Orquestación | n8n (Docker self-hosted en EC2) |
| Infraestructura | AWS EC2 + RDS + Cognito |

---

## 3. ESTADO ACTUAL DEL PROYECTO

### Funcionalidades operativas ✅

| Área | Estado | Detalle |
|---|---|---|
| Login propio JWT | ✅ | Email/password → Cognito USER_PASSWORD_AUTH → JWT HS256 |
| Permisos en sesión | ✅ | Cargados al login, persistidos en localStorage, sin parpadeo |
| Chat con IA | ✅ | SSE real, Gemini + fallback Groq, fuentes PDF |
| Loop retroalimentación | ✅ | 3 niveles: local → URLs → web → escalamiento |
| Validaciones IA | ✅ | Score 50-85% → revisión manual, ≥85% → auto-indexado en Qdrant |
| Notificaciones n8n | ✅ | Email al admin por nivel 1/2/3 y validaciones pendientes |
| Ingesta de documentos | ✅ | PDF → Qdrant + RDS |
| Historial de consultas | ✅ | Últimas 20 desde RDS, se actualiza tras cada consulta |
| Gestión de usuarios | ✅ | CRUD, perfil obligatorio al crear, blanqueo de contraseña |
| Sistema de perfiles | ✅ | Perfiles con permisos frontend + backend, sin rol duplicado |
| Derechos y perfiles | ✅ | `/dashboard/derechos` — gestión unificada |
| URLs oficiales | ✅ | Gestionadas desde `/dashboard/documentacion` → pestaña URLs |
| Consulta invitado | ✅ | Formulario con datos del consultante, institución desde tabla |
| Noticias | ✅ | CRUD con imágenes, publicación/borrador |
| Tablas administrables | ✅ | Instituciones, cargos, dependencias, categorías |
| Fecha de nacimiento | ✅ | DatePicker con validación DD/MM/AAAA |
| Tickets de vacío | ✅ | Score < 70% → ticket en notificaciones |
| Feedback | ⏳ | Schema listo, botón pendiente de conectar al chat |
| Dashboard con datos reales | ⏳ | Hot topics y gráficos pendientes |
| Despliegue en producción | ⏳ | Pendiente |

---

## 4. INFRAESTRUCTURA AWS

### EC2

| Campo | Valor |
|---|---|
| IP pública | `32.192.124.14` |
| IP privada | `172.31.40.141` |
| Sistema operativo | Ubuntu 24.04 LTS |
| Región | `us-east-1` |
| Conexión SSH | `ssh -i "keyinfodets.pem" ubuntu@32.192.124.14` |

**Servicios en EC2:**
- FastAPI → `http://32.192.124.14:8000`
- Qdrant → `http://32.192.124.14:6333` (Docker, restart=always)
- n8n → `http://32.192.124.14:5678` (Docker)

### RDS PostgreSQL

| Campo | Valor |
|---|---|
| Host | `infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com` |
| Puerto | `5432` |
| Base de datos | `infodets` |
| Usuario | `infodets_admin` |
| Versión | PostgreSQL 17 |

**Tunnel SSH para desarrollo local:**
```bash
ssh -i "keyinfodets.pem" -L 5432:infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com:5432 ubuntu@32.192.124.14 -N
```

### Cognito

| Campo | Valor |
|---|---|
| User Pool ID | `us-east-1_uOuYTO6Ce` |
| App Client (backend) | `40g4ffmsvf8mmk77kc37abucvd` |
| Auth Flow habilitado | `ALLOW_USER_PASSWORD_AUTH` |

### Qdrant

| Campo | Valor |
|---|---|
| URL local (tunnel) | `http://localhost:6333` |
| Colección | `infodets_docs` |
| Dimensiones | 3072 (gemini-embedding-001) |

**Tunnel SSH para desarrollo local:**
```bash
ssh -i "keyinfodets.pem" -L 6333:localhost:6333 ubuntu@32.192.124.14 -N
```

---

## 5. ARQUITECTURA DE AUTENTICACIÓN

El sistema usa **login propio** — sin OAuth ni redirects de Cognito.

```
Frontend (email + password)
        ↓
POST /v1/auth/login
        ↓
Backend llama a Cognito initiate_auth (USER_PASSWORD_AUTH)
        ↓
Cognito valida credenciales → devuelve IdToken
        ↓
Backend genera JWT HS256 propio (sub=usuario_id_RDS, exp=8h)
        ↓
Frontend guarda JWT + permisos en Zustand (persistido en localStorage)
        ↓
Todas las requests llevan Authorization: Bearer <jwt>
        ↓
Backend verifica JWT HS256 con secret_key local (sin llamadas a Cognito)
```

**Ventajas:**
- Sin redirects OAuth → login instantáneo
- Sin dependencia de Cognito en cada request → más rápido
- Permisos cargados una sola vez al login

---

## 6. SISTEMA DE PERFILES Y PERMISOS

El perfil es la **única fuente de verdad** para los permisos. No existe el concepto de "rol" como entidad separada.

### Secciones del perfil

| Sección | Tipo | Descripción |
|---|---|---|
| `consulta` | Menú | Acceso al chat con IA |
| `perfil` | Menú | Acceso a la página de perfil |
| `documentacion` | Menú | Acceso a documentación |
| `noticias` | Menú | Acceso a noticias |
| `dashboard` | Menú | Acceso al panel administrativo |
| `gestionar_usuarios` | Acción | CRUD de usuarios, perfiles, derechos |
| `blanquear_password` | Acción | Blanqueo de contraseñas en Cognito |
| `gestionar_documentos` | Acción | Subir/eliminar documentos e indexar en Qdrant |
| `gestionar_noticias` | Acción | CRUD de noticias |
| `gestionar_tablas` | Acción | Administrar tablas de valores |
| `ver_validaciones` | Acción | Ver y aprobar validaciones de IA |

### Flujo de permisos

```
Login → GET /permisos/{usuario_id} → guardado en Zustand
        ↓
Sidebar lee permisos del store (sin fetch, sin parpadeo)
        ↓
Backend verifica permiso específico en cada endpoint
        ↓
Al asignar/cambiar perfil → permisos se propagan automáticamente
```

### Gestión desde el dashboard

- `/dashboard/derechos` — crear perfiles, definir permisos, asignar usuarios
- `/dashboard/usuarios` — crear usuarios (perfil obligatorio), editar, blanquear contraseña

---

## 7. LOOP DE RETROALIMENTACIÓN

Sistema de mejora continua que detecta vacíos de información.

### Niveles de acción (umbral: 70%)

| Nivel | Condición | Acción |
|---|---|---|
| 0 | Score ≥ 70% | Responde con documentación oficial local |
| 1 | Score < 70% | Busca en URLs oficiales (configuradas en `/dashboard/documentacion`) |
| 2 | Nivel 1 vacío | Búsqueda web via Serper API |
| 3 | Todo vacío | Mensaje de escalamiento + ticket + notificación n8n al admin |

### Sistema de validaciones para entrenamiento IA

| Score | Acción |
|---|---|
| < 50% | No se crea validación |
| 50% - 85% | Validación pendiente → revisión manual en `/dashboard/notificaciones` |
| ≥ 85% | Auto-indexado en Qdrant (background thread) |

### Notificaciones n8n

El workflow `INFODETS - Notificaciones Loop Retroalimentacion` envía emails al admin para:
- `nivel1_externo` / `nivel2_web` — respuesta desde fuente externa
- `nivel3_escalamiento` — sin respuesta, requiere atención humana
- `validacion_pendiente` — respuesta requiere revisión manual

---

## 8. TABLAS EN RDS

| Tabla | Propósito |
|---|---|
| `usuarios` | Usuarios con perfil completo |
| `documentos` | Documentos indexados en Qdrant |
| `historial_chat` | Consultas realizadas por usuarios autenticados |
| `consultas_invitado` | Consultas de usuarios no registrados |
| `reportes_feedback` | Feedback de respuestas |
| `permisos_usuario` | Permisos individuales por sección |
| `perfiles` | Perfiles de acceso |
| `perfil_permisos` | Permisos por perfil |
| `tabla_valores` | Valores de desplegables (instituciones, cargos, etc.) |
| `noticias` | Publicaciones institucionales |
| `tickets_vacios` | Consultas sin documentación oficial (score < 70%) |
| `validaciones_respuesta` | Respuestas para entrenamiento de la IA |
| `urls_oficiales` | URLs para el Nivel 1 del loop de retroalimentación |

## 7. PLAN DE SPRINTS

> **Fechas clave:**
> - 🎯 **MVP:** 24 de mayo de 2025 ✅ CUMPLIDO
> - 🚀 **Entrega final:** 28 de junio de 2025

| Sprint | Período | Hito | Estado |
|---|---|---|---|
| S0 | Semanas 1-2 | Entorno AWS | ✅ 100% CERRADO |
| S1 | Semanas 3-4 | Autenticación real | ✅ 100% CERRADO |
| S2 | Semanas 5-6 | Pipeline RAG | ✅ 100% CERRADO |
| S3 | Semanas 7-8 | Chat IA real = **MVP** | ✅ 100% CERRADO |
| S4 | Semanas 9-10 | Dashboard + feedback | 🟡 50% |
| Testeo | En curso | Correcciones + refactoring | 🟡 En progreso |
| S5 | Semanas 11-12 | Producción | ⏳ Pendiente |

---

### Sprint 0 ✅ 100% CERRADO

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
- ✅ CI/CD GitHub Actions operativo
- ✅ sessionStore.ts Zustand con token, rol, isAuthenticated, isAdmin
- ✅ axiosInstance.ts con interceptor JWT
- ✅ Migraciones Alembic ejecutadas en RDS

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

---

### Sprint 3 ✅ 100% CERRADO — Motor de IA — **MVP ✅ CUMPLIDO**

| Tarea | Estado | Responsable |
|---|---|---|
| API Key Gemini + streaming | ✅ | P3 |
| StreamingResponse FastAPI | ✅ | P2 + P3 |
| Lógica umbral confianza >70% local / <70% fallback | ✅ | P3 |
| Chat Frontend conectado SSE | ✅ | P1 + P3 |
| Fuentes con links al PDF | ✅ | P1 |
| Historial en panel lateral | ✅ | P1 + P2 |
| Ticket silencioso score < 0.3 | ✅ | P3 |

**Logros adicionales:**
- ✅ CRUD completo de usuarios, perfiles, derechos
- ✅ Página de perfil con datos reales de RDS
- ✅ Noticias CRUD con imágenes
- ✅ Tablas administrables (instituciones, cargos, dependencias)
- ✅ Sidebar dinámico según permisos
- ✅ 7 migraciones Alembic aplicadas

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
| Loop de retroalimentación 3 niveles (70% umbral) | ✅ |
| Sistema de validaciones para entrenamiento IA | ✅ |
| Notificaciones n8n por nivel y validaciones | ✅ |
| URLs oficiales gestionadas desde dashboard | ✅ |
| Consulta invitado con formulario de datos | ✅ |
| Sistema de perfiles como única fuente de verdad | ✅ |
| Permisos en Zustand (sin parpadeo en sidebar) | ✅ |
| Blanqueo de contraseña desde dashboard | ✅ |
| DatePicker para fecha de nacimiento | ✅ |
| Emails normalizados a minúsculas | ✅ |
| Sincronización usuarios Cognito ↔ RDS | ✅ |
| Perfil obligatorio al crear usuario | ✅ |
| Eliminación de /dashboard/perfiles (fusionado en derechos) | ✅ |
| Feedback botón en chat | ⏳ Pendiente |
| Dashboard con datos reales (hot topics, gráficos) | ⏳ Pendiente |
| Despliegue en producción | ⏳ Pendiente |

---

### Sprint 5 ⏳ Pendiente — Producción

| Tarea | Responsable |
|---|---|
| Pruebas de integración Frontend ↔ Backend | P1 + P2 |
| Pruebas del pipeline RAG con documentos reales | P3 |
| Configurar CloudFront para el Frontend | P2 |
| Configurar dominio y certificado SSL | P2 |
| Revisión de seguridad | P2 |
| Pruebas de usuario final con flujo completo | Todos |

---

## 8. RESUMEN EJECUTIVO

| Sprint | Hito principal | Estado |
|---|---|---|
| S0 | Entorno AWS funcionando | ✅ 100% |
| S1 | Login real de punta a punta | ✅ 100% |
| S2 | Ingesta de documentos y RAG | ✅ 100% |
| S3 | Chat con IA real — **MVP** | ✅ 100% — 24 mayo ✅ |
| S4 | Dashboard + feedback + admin | 🟡 50% |
| Testeo | Correcciones + refactoring | 🟡 En progreso |
| S5 | Producción en AWS | ⏳ — 28 junio |

---


### Ramas Git

```
main          → Producción
Testeo        → Rama activa de desarrollo y corrección de errores
Frontend      → Desarrollo Frontend
Backend       → Desarrollo Backend
```

### Commits (Conventional Commits)

```
feat:     nueva funcionalidad
fix:      corrección de bug
refactor: refactorización sin cambio de funcionalidad
docs:     documentación
chore:    mantenimiento
```

### Política de contraseñas (Cognito)

| Regla | Valor |
|---|---|
| Longitud mínima | 8 caracteres |
| Mayúsculas | Al menos 1 |
| Minúsculas | Al menos 1 |
| Números | Al menos 1 |
| Símbolos | Al menos 1 |

Ejemplo válido: `Infodets2024!`

---

## 10. DECISIONES DE ARQUITECTURA

### 10.1 Login propio JWT (reemplazó OAuth Cognito)

**Problema:** El flujo OAuth de Cognito requería redirects a `/auth/callback`, era lento y complejo.

**Solución:** Login directo con email/password → Cognito valida → backend genera JWT HS256 propio.

**Resultado:** Login instantáneo, sin redirects, sin dependencia de Cognito en cada request.

### 10.2 Permisos en Zustand (reemplazó fetch en cada render)

**Problema:** El Sidebar hacía fetch de permisos en cada navegación → parpadeo visible.

**Solución:** Permisos cargados una sola vez al login, guardados en Zustand con `persist` → disponibles desde el primer render.

### 10.3 Perfiles como única fuente de verdad (reemplazó sistema dual rol+perfil)

**Problema:** Existían dos sistemas paralelos: `RolEnum` en el modelo y `Perfil` con permisos → inconsistencias.

**Solución:** El perfil define todo — secciones visibles del menú Y acciones permitidas en el backend. `require_admin` reemplazado por `require_permiso('seccion')`.

### 10.4 Qdrant self-hosted (descartó Pinecone)

**Razón:** Soberanía de datos para entidad pública + costo $0 vs ~$70/mes de Pinecone.

### 10.5 Gemini + Groq fallback

**Razón:** API Keys gratuitas de Gemini tienen límite de 15 RPM. Groq (`llama-3.3-70b-versatile`) activa automáticamente cuando Gemini devuelve 429.

### 10.6 Serper API para búsqueda web (Nivel 2)

**Razón:** 2.500 búsquedas/mes gratis. Se activa solo cuando Qdrant y URLs oficiales no tienen respuesta con ≥70% de confianza.

---

*INFODETS — Sistema de Gestión de Conocimiento Dinámico*
*Plan de Desarrollo v4.0 — Sprint Testeo*
