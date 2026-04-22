# PLAN DE DESARROLLO — INFODETS
## Sistema de Gestión de Conocimiento Dinámico
### Plan para equipo de 3 programadores

---

> **Versión:** 1.0
> **Estado:** Activo
> **Basado en:** Propuesta técnica, documento maestro de arquitectura y documento técnico de Front-End

---

## ÍNDICE

1. [Resumen del sistema](#1-resumen-del-sistema)
2. [Asignación de roles por programador](#2-asignación-de-roles-por-programador)
3. [Stack tecnológico completo](#3-stack-tecnológico-completo)
4. [Estado actual del proyecto](#4-estado-actual-del-proyecto)
5. [Plan de sprints](#5-plan-de-sprints)
6. [Detalle de tareas por programador](#6-detalle-de-tareas-por-programador)
7. [Dependencias entre equipos](#7-dependencias-entre-equipos)
8. [Convenciones de trabajo en equipo](#8-convenciones-de-trabajo-en-equipo)
9. [Infraestructura AWS](#9-infraestructura-aws)

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

| Programador | Rol | Área principal |
|---|---|---|
| **P1** | Full-Stack Lead | Front-End Next.js + integración con Back-End |
| **P2** | Back-End Engineer | FastAPI + AWS + Base de datos |
| **P3** | IA & Orquestación | n8n + RAG + Gemini + Pipeline de ingesta |

> Esta asignación no es rígida. En sprints donde un área tenga menos carga, el programador apoya al siguiente.

---

## 3. STACK TECNOLÓGICO COMPLETO

| Capa | Tecnología | Responsable |
|---|---|---|
| Front-End | Next.js 14 + React + TypeScript | P1 |
| UI Components | Mantine UI + Framer Motion + Tabler Icons | P1 |
| Estado | TanStack Query + Zustand | P1 |
| Autenticación | AWS Cognito + Amplify | P1 + P2 |
| Back-End | FastAPI (Python) | P2 |
| Base de datos relacional | AWS RDS PostgreSQL | P2 |
| Base de datos vectorial | Pinecone o Qdrant | P2 + P3 |
| Orquestador de flujos | n8n (Docker self-hosted) | P3 |
| Motor de IA | Gemini 1.5 Flash via Amazon Bedrock | P3 |
| Búsqueda web fallback | Tavily / Google Search API | P3 |
| Infraestructura | AWS EC2 + Docker | P2 |
| CI/CD | GitHub Actions | P1 + P2 |

---

## 4. ESTADO ACTUAL DEL PROYECTO

Lo que ya está construido y no necesita desarrollo desde cero:

### Front-End ✅ (estructura completa)
- Proyecto Next.js 14 inicializado con TypeScript estricto
- Todas las dependencias instaladas (Mantine, Framer Motion, TanStack Query, Zustand, Amplify)
- Layout principal: Header, Footer, Sidebar animado
- Páginas estructuradas: Home/Chat, Perfil, Documentación, Noticias
- Dashboard administrativo con 8 secciones (usuarios, derechos, perfiles, notificaciones, documentación, noticias, tablas)
- Stores de Zustand para sesión y UI
- Servicios tipados para FastAPI (consultas, feedback, dashboard)
- Hooks de autenticación y datos
- Configuración de Amplify + Cognito
- Docker configurado (Dockerfile + docker-compose)

### Back-End ✅ (estructura base)
- FastAPI inicializado con estructura modular
- Rutas de autenticación Cognito: /login, /callback, /logout, /me
- Middleware de validación JWT
- Schemas Pydantic base
- Entorno virtual configurado con todas las dependencias

### Pendiente de desarrollo (trabajo real del equipo):
- Lógica funcional del chat con IA
- Integración con base de datos (RDS PostgreSQL)
- Pipeline RAG con base vectorial
- Orquestación con n8n
- Conexión con Amazon Bedrock (Gemini)
- Conexión Front-End ↔ Back-End real (reemplazar mocks)

---

## 5. PLAN DE SPRINTS

Duración sugerida por sprint: **2 semanas**
Total estimado: **6 sprints (12 semanas / 3 meses)**

---

### SPRINT 0 — Semana 1-2 | Decisiones y entorno
**Objetivo:** Todo el equipo alineado y con el entorno funcionando.

| Tarea | Responsable |
|---|---|
| Clonar repo y levantar Docker local | Todos |
| Confirmar mecanismo de streaming del chat (SSE o WebSocket) | P1 + P2 |
| Crear instancia EC2 en AWS y configurar acceso SSH | P2 |
| Crear User Pool en Cognito con dos App Clients (frontend/backend) | P2 |
| Crear base de datos RDS PostgreSQL en AWS | P2 |
| Instalar n8n en Docker en EC2 | P3 |
| Definir estructura de tablas de la base de datos | P2 + P3 |
| Definir contratos de API (endpoints, request/response) | P1 + P2 |
| Actualizar variables de entorno con valores reales de AWS | Todos |

**Entregable:** Entorno completo funcionando en EC2. Todos pueden hacer `docker-compose up` y ver el sistema.

---

### SPRINT 1 — Semana 3-4 | Base de datos y autenticación real
**Objetivo:** Login real con Cognito funcionando de punta a punta.

| Tarea | Responsable |
|---|---|
| Crear modelos SQLAlchemy (Usuario, Consulta, Feedback, Documento) | P2 |
| Configurar Alembic para migraciones | P2 |
| Implementar endpoints CRUD de usuarios en FastAPI | P2 |
| Conectar login del Front-End con Cognito real | P1 |
| Implementar middleware de rutas protegidas en Next.js | P1 |
| Probar flujo completo: login → token → request autenticado → logout | P1 + P2 |
| Crear primer workflow en n8n (trigger de prueba) | P3 |
| Investigar e integrar Pinecone o Qdrant | P3 |

**Entregable:** Usuario puede loguearse con Cognito real y acceder a rutas protegidas.

---

### SPRINT 2 — Semana 5-6 | Pipeline RAG e ingesta de documentos
**Objetivo:** El sistema puede ingestar documentos y buscar en ellos.

| Tarea | Responsable |
|---|---|
| Implementar endpoint de carga de documentos en FastAPI | P2 |
| Conectar formulario de carga del Front-End con el endpoint real | P1 |
| Crear workflow n8n de ingesta: recibe PDF → limpia → fragmenta → vectoriza | P3 |
| Integrar Pinecone/Qdrant para almacenar vectores | P3 |
| Implementar búsqueda semántica básica (RAG) | P3 |
| Crear endpoint FastAPI `/consultas` que recibe pregunta y llama al RAG | P2 + P3 |
| Guardar historial de consultas en RDS | P2 |

**Entregable:** Se puede subir un PDF y hacerle una pregunta que el sistema responde con el contenido del documento.

---

### SPRINT 3 — Semana 7-8 | Motor de IA y flujos de decisión
**Objetivo:** Gemini respondiendo con lógica de confianza y fallback.

| Tarea | Responsable |
|---|---|
| Configurar Amazon Bedrock con modelo Gemini 1.5 Flash | P3 |
| Implementar lógica de umbral de confianza (>70% local, <70% fallback) | P3 |
| Integrar búsqueda web (Tavily) como fallback | P3 |
| Implementar respuesta cautelosa cuando la fuente es externa | P3 |
| Implementar ticket silencioso al admin cuando hay vacío de información | P3 |
| Conectar el chat del Front-End con el endpoint real (SSE o TanStack Query) | P1 |
| Renderizar respuesta con enlace cliqueable al documento fuente | P1 |
| Implementar streaming de respuesta en el chat (si se usa SSE) | P1 + P2 |

**Entregable:** Chat funcional con IA real. Responde con fuente oficial, hace fallback a internet y notifica al admin cuando no sabe.

---

### SPRINT 4 — Semana 9-10 | Feedback, dashboard y administración
**Objetivo:** Panel administrativo con datos reales y sistema de feedback operativo.

| Tarea | Responsable |
|---|---|
| Implementar endpoint de feedback en FastAPI | P2 |
| Conectar botón de feedback del Front-End con el endpoint real | P1 |
| Implementar endpoints del dashboard (hot topics, consultas por día) | P2 |
| Conectar gráficos del dashboard con datos reales de RDS | P1 |
| Implementar CRUD real de usuarios desde el panel admin | P1 + P2 |
| Implementar CRUD real de documentos desde el panel admin | P1 + P2 |
| Implementar control de acceso por rol (admin vs operador) en el Front-End | P1 |
| Workflow n8n de notificación al admin (WhatsApp o email) | P3 |

**Entregable:** Dashboard con datos reales. Admins pueden gestionar usuarios y documentos. Feedback operativo.

---

### SPRINT 5 — Semana 11-12 | Pulido, pruebas y despliegue
**Objetivo:** Sistema estable, probado y desplegado en producción.

| Tarea | Responsable |
|---|---|
| Pruebas de integración Front-End ↔ Back-End | P1 + P2 |
| Pruebas del pipeline RAG con documentos reales | P3 |
| Optimización de rendimiento (caché TanStack Query, índices en RDS) | P1 + P2 |
| Configurar GitHub Actions para CI/CD automático a EC2 | P2 |
| Configurar CloudFront para el Front-End | P2 |
| Configurar dominio y certificado SSL | P2 |
| Revisión de seguridad (variables de entorno, permisos IAM) | P2 |
| Documentar endpoints en Swagger (FastAPI lo genera automático) | P2 |
| Pruebas de usuario final con flujo completo | Todos |

**Entregable:** Sistema en producción en AWS. URL pública funcionando.

---

## 6. DETALLE DE TAREAS POR PROGRAMADOR

### P1 — Front-End Lead

**Responsabilidades permanentes:**
- Mantener y evolucionar todas las páginas del Front-End
- Conectar cada página con los endpoints reales del Back-End (reemplazar mocks)
- Garantizar que TypeScript compile sin errores en cada PR
- Mantener la consistencia visual con Mantine UI

**Tareas críticas por sprint:**

| Sprint | Tarea crítica |
|---|---|
| S0 | Definir contratos de API con P2 |
| S1 | Login real con Cognito + rutas protegidas |
| S2 | Formulario de carga conectado al Back-End real |
| S3 | Chat con streaming SSE + renderizado de fuente |
| S4 | Dashboard con gráficos reales + CRUD admin |
| S5 | Pruebas de integración + optimización |

---

### P2 — Back-End Engineer

**Responsabilidades permanentes:**
- Mantener y evolucionar la API FastAPI
- Gestionar la base de datos RDS PostgreSQL
- Administrar la infraestructura AWS
- Garantizar la seguridad de los endpoints

**Tareas críticas por sprint:**

| Sprint | Tarea crítica |
|---|---|
| S0 | EC2 + RDS + Cognito configurados en AWS |
| S1 | Modelos de base de datos + CRUD usuarios |
| S2 | Endpoint de carga de documentos |
| S3 | Endpoint `/consultas` conectado al RAG de P3 |
| S4 | Endpoints de feedback y dashboard |
| S5 | CI/CD + CloudFront + SSL + producción |

---

### P3 — IA & Orquestación

**Responsabilidades permanentes:**
- Mantener y evolucionar los workflows de n8n
- Gestionar la base de datos vectorial
- Mantener la calidad de las respuestas de la IA
- Monitorear el pipeline de ingesta

**Tareas críticas por sprint:**

| Sprint | Tarea crítica |
|---|---|
| S0 | n8n instalado en EC2 + primer workflow de prueba |
| S1 | Pinecone/Qdrant configurado e integrado |
| S2 | Pipeline completo de ingesta: PDF → vectores |
| S3 | Gemini via Bedrock + lógica de confianza + fallback |
| S4 | Notificaciones al admin + tickets de vacío |
| S5 | Pruebas del pipeline con documentos reales |

---

## 7. DEPENDENCIAS ENTRE EQUIPOS

Estas son las dependencias críticas que pueden bloquear el trabajo si no se resuelven a tiempo:

| Dependencia | Bloqueado | Requiere de | Sprint |
|---|---|---|---|
| Contratos de API definidos | P1 | P2 | S0 |
| Cognito configurado en AWS | P1 | P2 | S1 |
| Endpoint `/consultas` operativo | P1 | P2 + P3 | S3 |
| Pipeline RAG funcionando | P2 | P3 | S2 |
| Bedrock configurado | P3 | P2 (permisos IAM) | S3 |
| Endpoint de feedback | P1 | P2 | S4 |
| Endpoints del dashboard | P1 | P2 | S4 |

**Regla:** Si una dependencia se retrasa, el programador bloqueado trabaja con datos mock y avanza en otras tareas. No se detiene el sprint.

---

## 8. CONVENCIONES DE TRABAJO EN EQUIPO

### Ramas Git
```
main          → Producción. Solo recibe merges desde Frontend o Backend.
Frontend      → Rama principal de desarrollo Front-End (P1)
feature/xxx   → Ramas de funcionalidades específicas
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
- Lunes: Planning del sprint (30 min)
- Miércoles: Sync rápido de bloqueos (15 min)
- Viernes: Demo de lo construido en la semana (30 min)

---

## 9. INFRAESTRUCTURA AWS

Servicios a configurar en AWS para el proyecto:

| Servicio | Para qué | Responsable |
|---|---|---|
| EC2 | Servidor principal: Next.js + FastAPI + n8n en Docker | P2 |
| RDS PostgreSQL | Base de datos relacional (usuarios, historial, feedback) | P2 |
| Cognito | Autenticación MFA + control de roles (RBAC) | P2 |
| Amazon Bedrock | Consumo de Gemini 1.5 Flash para la IA | P3 |
| CloudFront | CDN para el Front-End en producción | P2 |
| S3 | Almacenamiento de documentos PDF subidos | P2 |
| IAM | Permisos y roles para cada servicio | P2 |

### Costo estimado mensual (5.000 - 10.000 consultas)

| Componente | Costo estimado |
|---|---|
| EC2 (t3.medium) | $30 - $40 |
| RDS PostgreSQL (db.t3.micro) | $15 - $25 |
| Cognito (hasta 50.000 MAU gratis) | $0 |
| Amazon Bedrock (Gemini tokens) | $5 - $15 |
| Pinecone/Qdrant | $0 - $50 |
| CloudFront + S3 | $5 - $10 |
| **Total estimado** | **$55 - $140 / mes** |

---

## RESUMEN EJECUTIVO

| Sprint | Semanas | Hito principal |
|---|---|---|
| S0 | 1-2 | Entorno AWS funcionando, equipo alineado |
| S1 | 3-4 | Login real con Cognito de punta a punta |
| S2 | 5-6 | Ingesta de documentos y búsqueda RAG básica |
| S3 | 7-8 | Chat con IA real (Gemini + fallback + tickets) |
| S4 | 9-10 | Dashboard real + feedback + administración |
| S5 | 11-12 | Producción en AWS con CI/CD |

**En 12 semanas el sistema está en producción y operativo.**

---

*INFODETS — Sistema de Gestión de Conocimiento Dinámico*
*Plan de Desarrollo v1.0 — Equipo de 3 programadores*
