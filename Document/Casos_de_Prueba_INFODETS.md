# CASOS DE PRUEBA — INFODETS

## Sistema de Gestión de Conocimiento Dinámico

> **Fecha:** Junio 2025
> **Versión:** 1.0
> **Proyecto:** INFODETS
> **Rama:** Testeo

---

## ÍNDICE

1. [Módulo de Autenticación](#1-módulo-de-autenticación)
2. [Módulo de Chat con IA](#2-módulo-de-chat-con-ia)
3. [Módulo de Ingesta de Documentos](#3-módulo-de-ingesta-de-documentos)
4. [Módulo de Usuarios](#4-módulo-de-usuarios)
5. [Módulo de Perfiles y Permisos](#5-módulo-de-perfiles-y-permisos)
6. [Módulo de Noticias](#6-módulo-de-noticias)
7. [Módulo de Tickets](#7-módulo-de-tickets)
8. [Módulo de Consulta Invitado](#8-módulo-de-consulta-invitado)
9. [Módulo de Conversaciones](#9-módulo-de-conversaciones)
10. [Módulo de URLs Oficiales](#10-módulo-de-urls-oficiales)
11. [Pruebas No Funcionales](#11-pruebas-no-funcionales)

---

## 1. MÓDULO DE AUTENTICACIÓN

### CP-AUTH-001 — Login exitoso con credenciales válidas

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que un usuario registrado puede iniciar sesión |
| **Precondición** | Usuario existe en Cognito y en la base de datos |
| **Datos de entrada** | Email: usuario@entidad.gob.ar, Password: Infodets2024! |
| **Pasos** | 1. Ir a la página de login (`/`) <br> 2. Ingresar email <br> 3. Ingresar contraseña <br> 4. Click en "Iniciar sesión" |
| **Resultado esperado** | Se redirige a `/consulta`, se guarda token JWT en localStorage, sidebar muestra opciones según permisos |
| **Prioridad** | Alta |

---

### CP-AUTH-002 — Login fallido con contraseña incorrecta

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que se muestra error con credenciales inválidas |
| **Precondición** | Usuario existe en Cognito |
| **Datos de entrada** | Email: usuario@entidad.gob.ar, Password: contraseña_incorrecta |
| **Pasos** | 1. Ir a `/` <br> 2. Ingresar email <br> 3. Ingresar contraseña incorrecta <br> 4. Click en "Iniciar sesión" |
| **Resultado esperado** | Se muestra mensaje "Email o contraseña incorrectos" (HTTP 401). No se redirige |
| **Prioridad** | Alta |

---

### CP-AUTH-003 — Login fallido con usuario inexistente

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar respuesta con email no registrado |
| **Precondición** | Email no existe en Cognito |
| **Datos de entrada** | Email: noexiste@test.com, Password: Test1234! |
| **Pasos** | 1. Ir a `/` <br> 2. Ingresar email inexistente <br> 3. Ingresar contraseña <br> 4. Click en "Iniciar sesión" |
| **Resultado esperado** | Se muestra "Email o contraseña incorrectos" (HTTP 401) |
| **Prioridad** | Alta |

---

### CP-AUTH-004 — Login con cuenta no confirmada

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar manejo de cuenta pendiente de confirmación |
| **Precondición** | Usuario en estado UNCONFIRMED en Cognito |
| **Datos de entrada** | Email del usuario no confirmado |
| **Pasos** | 1. Intentar login con la cuenta no confirmada |
| **Resultado esperado** | Se muestra "Tu cuenta no está confirmada. Revisá tu email" (HTTP 403) |
| **Prioridad** | Media |

---

### CP-AUTH-005 — Login con demasiados intentos fallidos

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar throttling por intentos excesivos |
| **Precondición** | Ninguna |
| **Datos de entrada** | Múltiples intentos con contraseña incorrecta |
| **Pasos** | 1. Intentar login 10+ veces con contraseña incorrecta |
| **Resultado esperado** | Se muestra "Demasiados intentos. Esperá unos minutos e intentá de nuevo" (HTTP 429) |
| **Prioridad** | Media |

---

### CP-AUTH-006 — Validación de formato en formulario de login

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que el botón se deshabilita con datos inválidos |
| **Precondición** | Ninguna |
| **Datos de entrada** | Email: "abc" (sin @), Password: "123" (no cumple política) |
| **Pasos** | 1. Ir a `/` <br> 2. Escribir email sin formato válido <br> 3. Escribir contraseña que no cumple política |
| **Resultado esperado** | Botón de login permanece deshabilitado |
| **Prioridad** | Media |

---

### CP-AUTH-007 — Cierre de sesión

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que el logout limpia la sesión correctamente |
| **Precondición** | Usuario autenticado |
| **Datos de entrada** | N/A |
| **Pasos** | 1. Click en botón de logout en el header <br> 2. Verificar redirección |
| **Resultado esperado** | Se limpia localStorage (`infodets-session`), se redirige a `/`, intentar navegar a rutas protegidas redirige al login |
| **Prioridad** | Alta |

---

### CP-AUTH-008 — Expiración de token JWT

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que la sesión expira después de 8 horas |
| **Precondición** | Usuario autenticado con token próximo a expirar |
| **Datos de entrada** | Token JWT expirado |
| **Pasos** | 1. Realizar cualquier request con token expirado |
| **Resultado esperado** | Backend retorna 401, frontend limpia sesión y redirige a login |
| **Prioridad** | Alta |

---

## 2. MÓDULO DE CHAT CON IA

### CP-CHAT-001 — Consulta con respuesta desde documentación oficial (Nivel 0)

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar respuesta RAG con score ≥ 70% |
| **Precondición** | Usuario autenticado, documentos indexados en Qdrant |
| **Datos de entrada** | Pregunta relacionada con documento indexado |
| **Pasos** | 1. Ir a `/consulta` <br> 2. Escribir pregunta <br> 3. Enviar |
| **Resultado esperado** | Respuesta en streaming (SSE), badge verde "Documentación oficial", fuentes con link al PDF, confianza ≥ 0.70 |
| **Prioridad** | Alta |

---

### CP-CHAT-002 — Consulta con fuente externa Nivel 1 (URLs oficiales)

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar fallback a URLs oficiales cuando score < 70% |
| **Precondición** | URLs oficiales configuradas y activas en el dashboard |
| **Datos de entrada** | Pregunta no cubierta por documentos indexados pero sí por URLs oficiales |
| **Pasos** | 1. Escribir pregunta no cubierta por docs locales <br> 2. Enviar |
| **Resultado esperado** | Respuesta con aviso "ℹ️ Fuente externa", URL de la fuente mostrada, notificación enviada al admin |
| **Prioridad** | Alta |

---

### CP-CHAT-003 — Consulta con búsqueda web Nivel 2 (Serper)

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar fallback a búsqueda web cuando Nivel 1 no tiene respuesta |
| **Precondición** | Pregunta no cubierta por docs ni URLs oficiales |
| **Datos de entrada** | Pregunta de tema no documentado |
| **Pasos** | 1. Escribir pregunta sin cobertura local ni en URLs <br> 2. Enviar |
| **Resultado esperado** | Respuesta con aviso "⚠️ Fuente externa", URL de búsqueda web mostrada |
| **Prioridad** | Alta |

---

### CP-CHAT-004 — Escalamiento humano Nivel 3

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar escalamiento cuando no hay respuesta en ninguna fuente |
| **Precondición** | Pregunta sin resultado en ningún nivel |
| **Datos de entrada** | Pregunta completamente fuera del alcance del sistema |
| **Pasos** | 1. Escribir pregunta sin cobertura <br> 2. Enviar |
| **Resultado esperado** | Mensaje de escalamiento mostrado, ticket creado automáticamente, notificación enviada al admin via n8n |
| **Prioridad** | Alta |

---

### CP-CHAT-005 — Pregunta de fecha/hora (respuesta instantánea)

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar respuesta directa para preguntas de fecha/hora |
| **Precondición** | Usuario autenticado |
| **Datos de entrada** | "¿Qué día es hoy?" |
| **Pasos** | 1. Escribir "¿Qué día es hoy?" <br> 2. Enviar |
| **Resultado esperado** | Respuesta en < 2 segundos, confianza 100%, no activa loop RAG |
| **Prioridad** | Media |

---

### CP-CHAT-006 — Contexto conversacional (pregunta referencial)

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que el bot mantiene contexto entre mensajes |
| **Precondición** | Conversación existente con al menos 1 intercambio |
| **Datos de entrada** | Primera: "¿Cuáles son los portales web?", Seguimiento: "Dame solo los de tecnología" |
| **Pasos** | 1. Hacer primera pregunta <br> 2. Hacer pregunta de seguimiento referencial |
| **Resultado esperado** | La segunda respuesta entiende el contexto de la primera y filtra correctamente |
| **Prioridad** | Alta |

---

### CP-CHAT-007 — Caché semántico (respuesta cacheada)

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que preguntas similares se responden desde caché |
| **Precondición** | Pregunta previa respondida exitosamente (Nivel 0 o 1) |
| **Datos de entrada** | Misma pregunta o pregunta muy similar a una previa |
| **Pasos** | 1. Hacer pregunta idéntica a una previa |
| **Resultado esperado** | Respuesta instantánea desde caché, sin llamar a Gemini/Groq |
| **Prioridad** | Media |

---

### CP-CHAT-008 — Fallback automático Gemini → Groq

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que cuando Gemini devuelve 429, se usa Groq |
| **Precondición** | Límite de Gemini alcanzado (15 RPM) |
| **Datos de entrada** | Cualquier consulta cuando Gemini está saturado |
| **Pasos** | 1. Realizar múltiples consultas rápidas hasta saturar Gemini <br> 2. Hacer una consulta más |
| **Resultado esperado** | La respuesta se genera correctamente usando Groq como fallback, sin error visible al usuario |
| **Prioridad** | Alta |

---

### CP-CHAT-009 — Streaming SSE funciona correctamente

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que la respuesta se muestra token a token |
| **Precondición** | Usuario autenticado |
| **Datos de entrada** | Cualquier consulta válida |
| **Pasos** | 1. Enviar consulta <br> 2. Observar la respuesta |
| **Resultado esperado** | El texto aparece gradualmente (streaming), no todo de golpe. Evento `final` incluye fuentes y confianza |
| **Prioridad** | Alta |

---

### CP-CHAT-010 — Memoria persistente del usuario

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que el bot recuerda al usuario entre sesiones |
| **Precondición** | Usuario con consultas previas registradas |
| **Datos de entrada** | N/A |
| **Pasos** | 1. Cerrar sesión <br> 2. Iniciar sesión nuevamente <br> 3. Hacer una consulta |
| **Resultado esperado** | El bot saluda por nombre y tiene contexto de consultas previas |
| **Prioridad** | Media |

---

## 3. MÓDULO DE INGESTA DE DOCUMENTOS

### CP-ING-001 — Carga exitosa de documento PDF

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar pipeline completo de ingesta |
| **Precondición** | Usuario con permiso `gestionar_documentos` |
| **Datos de entrada** | Archivo PDF con texto, título, categoría, dependencia |
| **Pasos** | 1. Ir a `/dashboard/documentacion` <br> 2. Click "Cargar documento" <br> 3. Completar formulario <br> 4. Seleccionar PDF <br> 5. Enviar |
| **Resultado esperado** | PDF procesado, chunks generados en Qdrant, documento aparece en listado, caché semántico invalidado |
| **Prioridad** | Alta |

---

### CP-ING-002 — Rechazo de archivo no PDF

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que solo se aceptan archivos PDF |
| **Precondición** | Usuario con permiso `gestionar_documentos` |
| **Datos de entrada** | Archivo .docx o .txt |
| **Pasos** | 1. Intentar cargar archivo que no sea PDF |
| **Resultado esperado** | Error 400: "Solo se aceptan archivos PDF" |
| **Prioridad** | Alta |

---

### CP-ING-003 — Rechazo de PDF sin texto extraíble

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar manejo de PDFs escaneados sin OCR |
| **Precondición** | Usuario con permiso `gestionar_documentos` |
| **Datos de entrada** | PDF con imágenes sin texto embebido |
| **Pasos** | 1. Cargar PDF basado en imágenes |
| **Resultado esperado** | Error 400: "El PDF no contiene texto extraíble" |
| **Prioridad** | Media |

---

### CP-ING-004 — Eliminación de documento

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar eliminación completa (PDF + vectores + DB) |
| **Precondición** | Documento indexado existente |
| **Datos de entrada** | ID del documento a eliminar |
| **Pasos** | 1. Ir al listado de documentos <br> 2. Click eliminar <br> 3. Confirmar |
| **Resultado esperado** | Documento eliminado de RDS, vectores eliminados de Qdrant, archivo PDF eliminado del servidor |
| **Prioridad** | Alta |

---

### CP-ING-005 — Visualización de PDF

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que se puede ver el PDF desde el link de fuentes |
| **Precondición** | Documento indexado |
| **Datos de entrada** | URL `/v1/admin/ingesta/ver/{id}` |
| **Pasos** | 1. Click en link de fuente desde el chat |
| **Resultado esperado** | PDF se abre en el navegador |
| **Prioridad** | Media |

---

### CP-ING-006 — Análisis automático de PDF con IA

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que la IA extrae metadatos del PDF |
| **Precondición** | Usuario con permiso `gestionar_documentos` |
| **Datos de entrada** | PDF con contenido |
| **Pasos** | 1. Usar endpoint `/v1/admin/ingesta/analizar` con un PDF |
| **Resultado esperado** | Se retornan sugerencias de título, categoría, resolución, decreto, autor y resumen |
| **Prioridad** | Media |

---

### CP-ING-007 — Acceso denegado sin permiso

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que usuarios sin permiso no pueden subir docs |
| **Precondición** | Usuario sin permiso `gestionar_documentos` |
| **Datos de entrada** | Intento de POST a `/v1/admin/ingesta` |
| **Pasos** | 1. Intentar cargar documento sin permiso |
| **Resultado esperado** | Error 403: acceso denegado |
| **Prioridad** | Alta |

---

## 4. MÓDULO DE USUARIOS

### CP-USR-001 — Invitar nuevo usuario

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar flujo completo de invitación |
| **Precondición** | Admin con permiso `gestionar_usuarios` |
| **Datos de entrada** | Email, nombre, apellido, perfil_id obligatorio |
| **Pasos** | 1. Ir a `/dashboard/usuarios` <br> 2. Click "Invitar usuario" <br> 3. Completar formulario <br> 4. Enviar |
| **Resultado esperado** | Usuario creado en Cognito + RDS, contraseña por defecto asignada, email enviado via n8n, registro en auditoría |
| **Prioridad** | Alta |

---

### CP-USR-002 — Invitar usuario con email duplicado

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar rechazo de email existente |
| **Precondición** | Email ya registrado en Cognito |
| **Datos de entrada** | Email de usuario existente |
| **Pasos** | 1. Intentar invitar con email que ya existe |
| **Resultado esperado** | Error 400: "Ya existe un usuario en Cognito con el email..." |
| **Prioridad** | Alta |

---

### CP-USR-003 — Actualizar perfil propio

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar edición del perfil personal |
| **Precondición** | Usuario autenticado |
| **Datos de entrada** | Nombre, apellido, DNI, fecha de nacimiento, cargo, institución |
| **Pasos** | 1. Ir a `/perfil` <br> 2. Modificar campos <br> 3. Guardar |
| **Resultado esperado** | Datos actualizados en RDS, confirmación visual |
| **Prioridad** | Media |

---

### CP-USR-004 — Blanquear contraseña de usuario

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar reset de contraseña a valor por defecto |
| **Precondición** | Admin con permiso `blanquear_password`, usuario con cuenta activa en Cognito |
| **Datos de entrada** | ID del usuario |
| **Pasos** | 1. Ir a `/dashboard/usuarios` <br> 2. Seleccionar usuario <br> 3. Click "Blanquear contraseña" <br> 4. Confirmar |
| **Resultado esperado** | Contraseña reseteada en Cognito, registro en auditoría |
| **Prioridad** | Alta |

---

### CP-USR-005 — Blanquear contraseña con cuenta pendiente

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar rechazo si usuario no activó cuenta |
| **Precondición** | Usuario con cognito_sub que empieza con "pending_" |
| **Datos de entrada** | ID del usuario sin activar |
| **Pasos** | 1. Intentar blanquear contraseña de usuario no activado |
| **Resultado esperado** | Error 400: "El usuario aún no activó su cuenta en Cognito" |
| **Prioridad** | Media |

---

### CP-USR-006 — Eliminar usuario

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar eliminación de usuario |
| **Precondición** | Admin con permiso `gestionar_usuarios` |
| **Datos de entrada** | ID del usuario a eliminar |
| **Pasos** | 1. Ir a `/dashboard/usuarios` <br> 2. Click eliminar <br> 3. Confirmar |
| **Resultado esperado** | Usuario eliminado de RDS, registro en auditoría |
| **Prioridad** | Alta |

---

### CP-USR-007 — Cambiar contraseña propia

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que un usuario puede cambiar su propia contraseña |
| **Precondición** | Usuario autenticado con cuenta activa |
| **Datos de entrada** | Contraseña actual correcta + contraseña nueva válida |
| **Pasos** | 1. Ir a perfil <br> 2. Ingresar contraseña actual <br> 3. Ingresar nueva contraseña (cumple política) <br> 4. Confirmar |
| **Resultado esperado** | Contraseña actualizada en Cognito, mensaje de éxito |
| **Prioridad** | Alta |

---

### CP-USR-008 — Cambiar contraseña con actual incorrecta

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar rechazo si la contraseña actual es incorrecta |
| **Precondición** | Usuario autenticado |
| **Datos de entrada** | Contraseña actual incorrecta |
| **Pasos** | 1. Intentar cambiar contraseña con actual incorrecta |
| **Resultado esperado** | Error 400: "La contraseña actual es incorrecta" |
| **Prioridad** | Alta |

---

## 5. MÓDULO DE PERFILES Y PERMISOS

### CP-PERF-001 — Crear perfil con permisos

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar creación de perfil con permisos configurados |
| **Precondición** | Admin con permiso `gestionar_usuarios` |
| **Datos de entrada** | Nombre: "Editor", permisos: {consulta: true, documentacion: true, gestionar_documentos: true} |
| **Pasos** | 1. Ir a `/dashboard/derechos` <br> 2. Click "Crear perfil" <br> 3. Configurar nombre y permisos <br> 4. Guardar |
| **Resultado esperado** | Perfil creado con permisos asignados |
| **Prioridad** | Alta |

---

### CP-PERF-002 — Crear perfil con nombre duplicado

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar rechazo de nombres duplicados |
| **Precondición** | Perfil con nombre "Editor" ya existe |
| **Datos de entrada** | Nombre: "Editor" |
| **Pasos** | 1. Intentar crear perfil con nombre existente |
| **Resultado esperado** | Error 409: "Ya existe un perfil con ese nombre" |
| **Prioridad** | Media |

---

### CP-PERF-003 — Protección del perfil Super Admin

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que Super Admin no puede modificarse ni eliminarse |
| **Precondición** | Perfil "Super Admin" existe |
| **Datos de entrada** | Intento de PUT o DELETE sobre perfil Super Admin |
| **Pasos** | 1. Intentar editar o eliminar perfil "Super Admin" |
| **Resultado esperado** | Error 403: "El perfil Super Admin no puede modificarse/eliminarse" |
| **Prioridad** | Alta |

---

### CP-PERF-004 — Asignar perfil a usuario

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que al asignar perfil se propagan los permisos |
| **Precondición** | Usuario y perfil existentes |
| **Datos de entrada** | usuario_id, perfil_id |
| **Pasos** | 1. Asignar perfil al usuario <br> 2. Verificar que el usuario ve las secciones correctas en sidebar |
| **Resultado esperado** | Permisos del perfil aplicados al usuario, sidebar refleja los cambios |
| **Prioridad** | Alta |

---

### CP-PERF-005 — Verificar permisos en endpoint protegido

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que `require_permiso()` bloquea acceso sin permiso |
| **Precondición** | Usuario con perfil que NO tiene `gestionar_usuarios` |
| **Datos de entrada** | Request a GET `/v1/usuarios` |
| **Pasos** | 1. Hacer request al endpoint de listar usuarios |
| **Resultado esperado** | Error 403: acceso denegado |
| **Prioridad** | Alta |

---

## 6. MÓDULO DE NOTICIAS

### CP-NOT-001 — Crear noticia con imagen

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar creación de noticia con imagen en Cloudinary |
| **Precondición** | Admin con permiso `gestionar_noticias` |
| **Datos de entrada** | Título, contenido, categoría, autor, imagen JPG |
| **Pasos** | 1. Ir a `/dashboard/noticias` <br> 2. Click "Crear noticia" <br> 3. Completar formulario + imagen <br> 4. Guardar |
| **Resultado esperado** | Noticia creada, imagen subida a Cloudinary, URL de imagen almacenada |
| **Prioridad** | Alta |

---

### CP-NOT-002 — Publicar noticia (borrador → publicada)

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar cambio de estado de borrador a publicada |
| **Precondición** | Noticia en estado borrador |
| **Datos de entrada** | publicada: "true" |
| **Pasos** | 1. Editar noticia <br> 2. Cambiar a publicada <br> 3. Guardar |
| **Resultado esperado** | Noticia visible para todos los usuarios en `/noticias` |
| **Prioridad** | Alta |

---

### CP-NOT-003 — Ver solo noticias publicadas (usuario regular)

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que usuarios regulares no ven borradores |
| **Precondición** | Existen noticias publicadas y borradores |
| **Datos de entrada** | solo_publicadas=true |
| **Pasos** | 1. Ir a `/noticias` como usuario regular |
| **Resultado esperado** | Solo se muestran noticias con `publicada=true` |
| **Prioridad** | Media |

---

### CP-NOT-004 — Dar like a una noticia

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar funcionalidad de likes |
| **Precondición** | Noticia publicada, usuario autenticado |
| **Datos de entrada** | noticia_id, sumar=true |
| **Pasos** | 1. Click en botón de like |
| **Resultado esperado** | Contador de likes incrementa en 1 |
| **Prioridad** | Baja |

---

### CP-NOT-005 — Rechazar imagen con formato no permitido

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar validación de formato de imagen |
| **Precondición** | Admin con permiso `gestionar_noticias` |
| **Datos de entrada** | Archivo .bmp o .svg |
| **Pasos** | 1. Intentar crear noticia con imagen en formato no permitido |
| **Resultado esperado** | Error 400: "Formato de imagen no permitido. Usar: jpg, jpeg, png, gif, webp" |
| **Prioridad** | Media |

---

### CP-NOT-006 — Contar noticias nuevas desde fecha

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar badge de noticias nuevas |
| **Precondición** | Noticias publicadas después de la fecha indicada |
| **Datos de entrada** | desde=2025-06-01T00:00:00 |
| **Pasos** | 1. Llamar a `/v1/noticias/nuevas/count?desde=2025-06-01T00:00:00` |
| **Resultado esperado** | Retorna count con cantidad correcta de noticias nuevas |
| **Prioridad** | Baja |

---

## 7. MÓDULO DE TICKETS

### CP-TKT-001 — Creación automática de ticket por escalamiento

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que se crea ticket cuando la IA no puede responder |
| **Precondición** | Consulta con score < umbral de ticket |
| **Datos de entrada** | Consulta sin respuesta disponible |
| **Pasos** | 1. Hacer consulta que genere escalamiento (Nivel 3) |
| **Resultado esperado** | Ticket creado con `requiere_respuesta=true`, nivel=3 |
| **Prioridad** | Alta |

---

### CP-TKT-002 — Ver mis tickets como usuario

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que el usuario ve solo sus tickets |
| **Precondición** | Usuario con tickets existentes |
| **Datos de entrada** | N/A |
| **Pasos** | 1. Ir a `/mis-consultas` |
| **Resultado esperado** | Lista de tickets propios ordenados por fecha descendente |
| **Prioridad** | Alta |

---

### CP-TKT-003 — Enviar mensaje en ticket (usuario)

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que el usuario puede agregar mensajes |
| **Precondición** | Ticket existente del usuario |
| **Datos de entrada** | texto: "Adjunto más detalles sobre mi consulta" |
| **Pasos** | 1. Abrir ticket <br> 2. Escribir mensaje <br> 3. Enviar |
| **Resultado esperado** | Mensaje creado con rol="usuario", ticket actualiza `mensajes_no_leidos` para el admin |
| **Prioridad** | Alta |

---

### CP-TKT-004 — Responder ticket como admin

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que el admin puede responder tickets |
| **Precondición** | Admin con permiso `ver_validaciones`, ticket existente |
| **Datos de entrada** | texto: "Aquí está la información solicitada..." |
| **Pasos** | 1. Ir a `/dashboard/notificaciones` <br> 2. Abrir ticket <br> 3. Escribir respuesta <br> 4. Enviar |
| **Resultado esperado** | Mensaje con rol="admin", ticket cambia a estado "respondido" |
| **Prioridad** | Alta |

---

### CP-TKT-005 — Marcar mensajes como leídos

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que al abrir un ticket se marcan como leídos |
| **Precondición** | Ticket con mensajes no leídos |
| **Datos de entrada** | ticket_id |
| **Pasos** | 1. Abrir ticket |
| **Resultado esperado** | Mensajes marcados como leídos, contador de no leídos se actualiza |
| **Prioridad** | Media |

---

### CP-TKT-006 — Contar mensajes no leídos del usuario

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar badge de notificaciones en header |
| **Precondición** | Tickets con mensajes no leídos del admin |
| **Datos de entrada** | N/A |
| **Pasos** | 1. Verificar el contador en el header |
| **Resultado esperado** | Número correcto de mensajes no leídos en tickets del usuario |
| **Prioridad** | Media |

---

## 8. MÓDULO DE CONSULTA INVITADO

### CP-INV-001 — Consulta exitosa como invitado

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar flujo completo de consulta sin registro |
| **Precondición** | Ninguna (endpoint público) |
| **Datos de entrada** | nombre: "Juan", apellido: "Pérez", email: "juan@test.com", institucion: "ANSES", mensaje: "¿Cuáles son los requisitos?" |
| **Pasos** | 1. Ir a `/invitado` <br> 2. Completar formulario <br> 3. Escribir pregunta <br> 4. Enviar |
| **Resultado esperado** | Respuesta en streaming, consulta registrada en tabla `consultas_invitado` |
| **Prioridad** | Alta |

---

### CP-INV-002 — Escalamiento de consulta invitado

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que se crea ticket para invitados sin respuesta |
| **Precondición** | Consulta sin cobertura |
| **Datos de entrada** | Pregunta fuera del alcance |
| **Pasos** | 1. Hacer consulta sin respuesta como invitado |
| **Resultado esperado** | Ticket creado con usuario_id="invitado:{email}", notificación al admin |
| **Prioridad** | Alta |

---

## 9. MÓDULO DE CONVERSACIONES

### CP-CONV-001 — Crear nueva conversación

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar creación de conversación |
| **Precondición** | Usuario autenticado |
| **Datos de entrada** | pregunta: "Nueva conversación" |
| **Pasos** | 1. Click en "Nueva conversación" en el chat |
| **Resultado esperado** | Conversación creada, ID retornado |
| **Prioridad** | Alta |

---

### CP-CONV-002 — Límite de 5 conversaciones no fijadas

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que se elimina la más antigua al superar el límite |
| **Precondición** | Usuario con 5 conversaciones no fijadas |
| **Datos de entrada** | Crear conversación #6 |
| **Pasos** | 1. Crear una nueva conversación cuando ya hay 5 no fijadas |
| **Resultado esperado** | La conversación más antigua no fijada se elimina automáticamente |
| **Prioridad** | Media |

---

### CP-CONV-003 — Fijar conversación

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar funcionalidad de fijar/desfijar |
| **Precondición** | Conversación existente |
| **Datos de entrada** | conversacion_id, fijada: true |
| **Pasos** | 1. Click en ícono de fijar en una conversación |
| **Resultado esperado** | Conversación aparece primero en la lista, no se elimina por el límite de 5 |
| **Prioridad** | Media |

---

### CP-CONV-004 — Acceso denegado a conversaciones ajenas

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que un usuario no puede ver conversaciones de otro |
| **Precondición** | Dos usuarios distintos con conversaciones |
| **Datos de entrada** | GET `/v1/chat/conversaciones/{otro_usuario_id}` |
| **Pasos** | 1. Intentar acceder a las conversaciones de otro usuario |
| **Resultado esperado** | Error 403: "No podés acceder a las conversaciones de otro usuario" |
| **Prioridad** | Alta |

---

## 10. MÓDULO DE URLs OFICIALES

### CP-URL-001 — Agregar URL oficial

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar creación de URL para el Nivel 1 del loop RAG |
| **Precondición** | Admin con permiso `gestionar_documentos` |
| **Datos de entrada** | titulo: "Portal ANSES", url: "https://www.anses.gob.ar", categoria: "política" |
| **Pasos** | 1. Ir a `/dashboard/documentacion` <br> 2. Sección URLs <br> 3. Agregar nueva URL |
| **Resultado esperado** | URL creada y activa, disponible para el Nivel 1 del loop |
| **Prioridad** | Alta |

---

### CP-URL-002 — Desactivar URL oficial

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que una URL desactivada no se usa en el loop |
| **Precondición** | URL oficial activa |
| **Datos de entrada** | activo: false |
| **Pasos** | 1. Desactivar una URL <br> 2. Hacer consulta que normalmente usaría esa URL |
| **Resultado esperado** | La URL no se consulta en el Nivel 1, el sistema pasa a Nivel 2 |
| **Prioridad** | Media |

---

## 11. PRUEBAS NO FUNCIONALES

### CP-NF-001 — Tiempo de respuesta del chat (< 5 segundos primer chunk)

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar latencia aceptable |
| **Precondición** | Sistema en producción |
| **Datos de entrada** | Consulta estándar |
| **Criterio de aceptación** | El primer chunk de respuesta llega en menos de 5 segundos |
| **Prioridad** | Alta |

---

### CP-NF-002 — Disponibilidad del health check

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que el backend responde al health check |
| **Precondición** | Servidor en ejecución |
| **Datos de entrada** | GET `/health` |
| **Criterio de aceptación** | Respuesta 200 OK en menos de 1 segundo |
| **Prioridad** | Alta |

---

### CP-NF-003 — CORS permite solo el frontend configurado

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar configuración de CORS |
| **Precondición** | Backend en ejecución |
| **Datos de entrada** | Request desde origen no autorizado |
| **Criterio de aceptación** | Solo `FRONTEND_URL` tiene acceso, otros orígenes son rechazados |
| **Prioridad** | Alta |

---

### CP-NF-004 — Protección contra path traversal en documentos

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar validación de UUID en endpoint de ver documento |
| **Precondición** | N/A |
| **Datos de entrada** | documento_id: "../../../etc/passwd" |
| **Criterio de aceptación** | Error 400: "ID de documento inválido" |
| **Prioridad** | Alta |

---

### CP-NF-005 — Normalización de emails a minúsculas

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que los emails se normalizan en toda la app |
| **Precondición** | N/A |
| **Datos de entrada** | Email: "Usuario@ENTIDAD.gob.ar" |
| **Criterio de aceptación** | Se almacena y busca como "usuario@entidad.gob.ar" |
| **Prioridad** | Media |

---

### CP-NF-006 — Interceptor Axios redirige en 401

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que el frontend maneja sesiones expiradas |
| **Precondición** | Token expirado en localStorage |
| **Datos de entrada** | Request con token inválido |
| **Criterio de aceptación** | Se limpia localStorage, se redirige a `/`, endpoint `/auth/login` excluido del interceptor |
| **Prioridad** | Alta |

---

### CP-NF-007 — Persistencia de datos tras reinicio de Qdrant

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que los vectores persisten tras reinicio de Docker |
| **Precondición** | Documentos indexados en Qdrant |
| **Datos de entrada** | N/A |
| **Pasos** | 1. `docker stop qdrant` <br> 2. `docker start qdrant` <br> 3. Hacer consulta |
| **Criterio de aceptación** | Los vectores siguen disponibles, las consultas funcionan normalmente |
| **Prioridad** | Alta |

---

## RESUMEN DE CASOS DE PRUEBA

| Módulo | Cantidad | Alta | Media | Baja |
|--------|----------|------|-------|------|
| Autenticación | 8 | 5 | 3 | 0 |
| Chat con IA | 10 | 6 | 4 | 0 |
| Ingesta de Documentos | 7 | 4 | 3 | 0 |
| Usuarios | 8 | 5 | 2 | 1 |
| Perfiles y Permisos | 5 | 4 | 1 | 0 |
| Noticias | 6 | 2 | 2 | 2 |
| Tickets | 6 | 4 | 2 | 0 |
| Consulta Invitado | 2 | 2 | 0 | 0 |
| Conversaciones | 4 | 2 | 2 | 0 |
| URLs Oficiales | 2 | 1 | 1 | 0 |
| No Funcionales | 7 | 5 | 2 | 0 |
| **TOTAL** | **65** | **40** | **22** | **3** |

---

*Documento generado: Junio 2025*
*Proyecto: INFODETS — Sistema de Gestión de Conocimiento Dinámico*
