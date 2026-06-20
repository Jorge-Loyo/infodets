# ACTA DE CIERRE DE PROYECTO

---

## 1. INFORMACIÓN GENERAL DEL PROYECTO

| Campo | Detalle |
|-------|---------|
| **Nombre del Proyecto** | INFODETS — Sistema de Gestión de Conocimiento Dinámico |
| **Código del Proyecto** | INFODETS-2025 |
| **Fecha de Inicio** | Abril 2025 |
| **Fecha de Cierre** | 28 de junio de 2025 |
| **Fecha del MVP** | 24 de mayo de 2025 ✅ |
| **Duración Total** | 12 semanas (6 sprints) |
| **Estado Final** | Completado con observaciones |
| **Rama de Producción** | `main` |
| **URL Producción** | http://32.192.124.14:3000 |

---

## 2. OBJETIVO DEL PROYECTO

Desarrollar una plataforma web inteligente impulsada por Inteligencia Artificial y bases de datos vectoriales (RAG) que permita responder consultas ciudadanas basándose en documentación oficial del sector público, con un motor de mejora continua que detecta vacíos de información y escala automáticamente cuando no puede responder.

---

## 3. EQUIPO DEL PROYECTO

| Rol | Responsable | Identificador |
|-----|-------------|---------------|
| Product Manager / Full Stack | Jorge Loyo | P3 |
| Tech Lead / Full Stack | Santiago Isbaner | P2 |
| Especialista Funcional / Full Stack | Fernando Moya | P1 |

---

## 4. ALCANCE ENTREGADO

### 4.1 Funcionalidades Implementadas

| # | Funcionalidad | Estado |
|---|---------------|--------|
| 1 | Chat RAG con IA (streaming SSE) | ✅ Completado |
| 2 | Ingesta y procesamiento de documentos PDF | ✅ Completado |
| 3 | Loop de retroalimentación 3 niveles | ✅ Completado |
| 4 | Autenticación JWT HS256 + AWS Cognito | ✅ Completado |
| 5 | Sistema de perfiles y permisos granulares | ✅ Completado |
| 6 | CRUD de usuarios con blanqueo de contraseña | ✅ Completado |
| 7 | Noticias institucionales con imágenes | ✅ Completado |
| 8 | Sistema de tickets de escalamiento | ✅ Completado |
| 9 | Dashboard administrativo | ✅ Completado |
| 10 | Consulta como invitado (sin registro) | ✅ Completado |
| 11 | Validaciones para entrenamiento continuo de IA | ✅ Completado |
| 12 | URLs oficiales gestionables (Nivel 1 RAG) | ✅ Completado |
| 13 | Búsqueda web via Serper API (Nivel 2 RAG) | ✅ Completado |
| 14 | Notificaciones automáticas via n8n | ✅ Completado |
| 15 | Personalización de apariencia (temas, logo, colores) | ✅ Completado |
| 16 | Configuración de identidad del bot | ✅ Completado |
| 17 | HyDE para mejor recall vectorial | ✅ Completado |
| 18 | Query Expansion | ✅ Completado |
| 19 | Re-ranking con Cohere | ✅ Completado |
| 20 | Parent-Child Retrieval | ✅ Completado |
| 21 | Caché Semántico (TTL 24h) | ✅ Completado |
| 22 | Memoria persistente del usuario | ✅ Completado |
| 23 | CI/CD con GitHub Actions | ✅ Completado |
| 24 | Despliegue en producción AWS | ✅ Completado |

### 4.2 Funcionalidades Pendientes (Backlog)

| # | Funcionalidad | Prioridad |
|---|---------------|-----------|
| 1 | Importación masiva de usuarios desde CSV | Media |
| 2 | Exportar reportes en PDF/Excel | Media |
| 3 | Dashboard con métricas reales (hot topics, gráficos) | Alta |
| 4 | Notificaciones por email y WhatsApp al usuario | Baja |
| 5 | Integración con LDAP/Active Directory | Baja |
| 6 | Calificación de respuestas (👍/👎) — UI | Alta |
| 7 | Soporte multiidioma | Baja |

### 4.3 Historias de Usuario

| Métrica | Valor |
|---------|-------|
| Total de historias de usuario | 35 |
| Implementadas | 28 |
| Pendientes (backlog) | 7 |
| Porcentaje de cumplimiento | 80% |

---

## 5. STACK TECNOLÓGICO FINAL

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Next.js + React + TypeScript | 16 / 19 / 5.0 |
| UI | Mantine UI + Framer Motion | v9 |
| Estado | Zustand con persist | 5.0 |
| Backend | FastAPI + Python | 0.115 / 3.13 |
| Base de datos relacional | AWS RDS PostgreSQL | 17.6 |
| Base de datos vectorial | Qdrant (self-hosted) | Latest |
| IA Principal | Google Gemini (gemini-2.0-flash-lite) | 2.0 |
| IA Fallback | Groq (llama-3.3-70b-versatile) | Latest |
| Embeddings | gemini-embedding-001 | 3072 dims |
| Autenticación | AWS Cognito + JWT HS256 | — |
| Imágenes | Cloudinary CDN | — |
| Orquestación | n8n (Docker) | 2.17.5+ |
| Infraestructura | AWS EC2 + RDS + Cognito | us-east-1 |
| CI/CD | GitHub Actions | — |

---

## 6. INFRAESTRUCTURA DESPLEGADA

### 6.1 Servicios en Producción

| Servicio | URL | Gestor |
|----------|-----|--------|
| Frontend (Next.js) | http://32.192.124.14:3000 | Docker |
| Backend (FastAPI) | http://32.192.124.14:8000 | systemd |
| Qdrant (vectorial) | http://32.192.124.14:6333 | Docker |
| n8n (workflows) | http://32.192.124.14:5678 | Docker |
| PostgreSQL (RDS) | infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com:5432 | AWS RDS |

### 6.2 Recursos AWS

| Recurso | Tipo | Región |
|---------|------|--------|
| EC2 | t3.small (Ubuntu 24.04 LTS) | us-east-1 |
| RDS | db.t4g.micro (PostgreSQL 17.6) | us-east-1 |
| Cognito | User Pool us-east-1_uOuYTO6Ce | us-east-1 |
| Elastic IP | 32.192.124.14 | us-east-1 |

---

## 7. SPRINTS EJECUTADOS

| Sprint | Período | Hito | Estado |
|--------|---------|------|--------|
| S0 | Semanas 1-2 | Entorno AWS | ✅ 100% Cerrado |
| S1 | Semanas 3-4 | Autenticación real | ✅ 100% Cerrado |
| S2 | Semanas 5-6 | Pipeline RAG | ✅ 100% Cerrado |
| S3 | Semanas 7-8 | Chat IA real = **MVP** | ✅ 100% Cerrado |
| S4 | Semanas 9-10 | Dashboard + feedback | ✅ Cerrado |
| Testeo | Transversal | Correcciones + refactoring | ✅ Cerrado |
| S5 | Semanas 11-12 | Producción | ✅ Cerrado |

---

## 8. ENTREGABLES DEL PROYECTO

| # | Entregable | Ubicación | Estado |
|---|-----------|-----------|--------|
| 1 | Código fuente Backend | `Backend/` | ✅ Entregado |
| 2 | Código fuente Frontend | `Frontend/infodets-web/` | ✅ Entregado |
| 3 | Documentación técnica (STACK.md) | `Document/STACK.md` | ✅ Entregado |
| 4 | Plan de desarrollo | `Document/PLAN_DESARROLLO_EQUIPO.md` | ✅ Entregado |
| 5 | Guía de instalación | `Document/GUIA_INSTALACION.md` | ✅ Entregado |
| 6 | Mejoras RAG por fases | `Document/RAG_Mejoras_Por_Fases.md` | ✅ Entregado |
| 7 | Workflows n8n (JSON) | `Document/n8n_workflow_*.json` | ✅ Entregado |
| 8 | Docker Compose (dev + prod) | `docker-compose.yml`, `docker-compose.dev.yml` | ✅ Entregado |
| 9 | Pipeline CI/CD | `.github/workflows/deploy.yml` | ✅ Entregado |
| 10 | Sistema desplegado en producción | http://32.192.124.14:3000 | ✅ Entregado |

---

## 9. RIESGOS Y LECCIONES APRENDIDAS

### 9.1 Riesgos Materializados

| Riesgo | Impacto | Mitigación Aplicada |
|--------|---------|---------------------|
| Límite de 15 RPM en Gemini gratuito | Medio | Fallback automático a Groq (30 RPM) |
| Credenciales AWS temporales (Academy) | Alto | Actualización manual en .env por sesión |
| Bug n8n 2.17.5 con archivos binarios | Bajo | FastAPI procesa PDFs directamente, n8n solo recibe metadatos |
| Flujo OAuth Cognito lento con redirects | Medio | Reemplazado por JWT HS256 propio con login directo |

### 9.2 Lecciones Aprendidas

| # | Lección |
|---|---------|
| 1 | El login propio con JWT es más rápido y confiable que OAuth con redirects para aplicaciones internas |
| 2 | Cargar permisos al login y guardarlos en Zustand elimina parpadeos de UI y fetches innecesarios |
| 3 | Qdrant self-hosted ($0) es viable para entidades públicas con soberanía de datos |
| 4 | El sistema dual LLM (Gemini + Groq) garantiza disponibilidad con APIs gratuitas |
| 5 | n8n como orquestador de notificaciones simplifica la lógica del backend |
| 6 | Parent-Child Retrieval mejora significativamente la precisión del RAG |
| 7 | El caché semántico reduce latencia y costos en preguntas frecuentes |

---

## 10. MÉTRICAS DEL PROYECTO

| Métrica | Valor |
|---------|-------|
| Sprints completados | 7 de 7 |
| Historias implementadas | 28 de 35 (80%) |
| Tablas en base de datos | 13 |
| Endpoints REST | 40+ |
| Migraciones Alembic | 7+ |
| Modelos de IA integrados | 3 (Gemini embed, Gemini gen, Groq) |
| APIs externas integradas | 5 (Gemini, Groq, Serper, Cognito, Cloudinary) |
| Workflows n8n activos | 2 |

---

## 11. OBSERVACIONES Y RECOMENDACIONES

### 11.1 Para continuidad del proyecto

1. **Escalar EC2** cuando el volumen supere 10.000 chunks: pasar de `t4g.micro` a `t4g.medium` (4GB RAM)
2. **Configurar CloudFront** para el frontend (distribución pendiente: d84l1y8p4kdic.cloudfront.net)
3. **Implementar SSL** con certificado para acceso HTTPS
4. **Completar el feedback** de respuestas (UI de 👍/👎) para mejorar entrenamiento continuo
5. **Dashboard con métricas reales** — los endpoints existen, falta conectar gráficos con datos reales
6. **Migrar credenciales AWS** de temporales (Academy) a permanentes (IAM) para producción estable

### 11.2 Deuda técnica identificada

- Feedback de respuestas (modelo existe, falta UI)
- Dashboard con datos reales de hot topics
- Importación masiva de usuarios
- Exportación de reportes

---

## 12. FIRMAS DE CIERRE

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Product Manager | Jorge Loyo | ______________ | __ / __ / 2025 |
| Tech Lead | Santiago Isbaner | ______________ | __ / __ / 2025 |
| Especialista Funcional | Fernando Moya | ______________ | __ / __ / 2025 |
| Sponsor / Cliente | _________________ | ______________ | __ / __ / 2025 |

---

## 13. DECLARACIÓN DE CIERRE

Se da por cerrado formalmente el proyecto **INFODETS — Sistema de Gestión de Conocimiento Dinámico**, habiendo cumplido con el alcance acordado del MVP y la entrega en producción. Los entregables han sido verificados y se encuentran disponibles en el repositorio del proyecto y en la infraestructura AWS desplegada.

Las funcionalidades pendientes del backlog quedan documentadas como recomendaciones para una fase posterior del proyecto.

---

*Documento generado: Junio 2025*
*Proyecto: INFODETS — Sistema de Gestión de Conocimiento Dinámico*
