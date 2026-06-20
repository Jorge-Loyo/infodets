# 🎬 GUÍA PARA VIDEO DEMO — INFODETS v1.0.0

> **Duración estimada:** 6-8 minutos
> **URL de demostración:** https://agilizesoluciones.uk
> **Herramienta de grabación:** OBS Studio (1920x1080)

---

## 📋 Preparación antes de grabar

### Datos que deben estar cargados:
- [ ] Al menos 3-4 documentos PDF indexados
- [ ] Al menos 1 noticia publicada con imagen
- [ ] Al menos 2 usuarios (admin + operador)
- [ ] Logo del sistema configurado con fondo

### Consultas preparadas (que tengan respuesta):
1. "¿Cuáles son las normas del reglamento escolar?"
2. "¿Qué dice el estatuto del docente sobre licencias?"
3. "¿Cuál es el procedimiento para solicitar una beca?" (esta debería escalar)

### Antes de darle REC:
- Limpiar historial de conversaciones
- Cerrar sesión para empezar desde el login
- Navegador en modo incógnito (sin extensiones visibles)
- Resolución 1920x1080, zoom 100%

---

## 🎥 Guión paso a paso

### 1️⃣ INTRO — Pantalla de Login (30 seg)

**Qué mostrar:**
- La pantalla de login con el fondo animado (gradiente + burbujas)
- El logo de INFODETS

**Qué decir:**
> "INFODETS es un sistema inteligente de gestión de conocimiento diseñado para entidades públicas. Utiliza inteligencia artificial y bases de datos vectoriales para responder consultas con fuentes oficiales verificables."

---

### 2️⃣ LOGIN (20 seg)

**Acciones:**
1. Ingresar email del administrador
2. Ingresar contraseña
3. Click en "Iniciar sesión"

**Qué decir:**
> "El sistema cuenta con autenticación segura con roles y permisos personalizables."

---

### 3️⃣ CHAT IA — Funcionalidad principal (2 min)

**Acciones:**
1. Ir a la sección "Consulta" (chat)
2. Mostrar el mensaje de bienvenida del bot
3. Hacer la primera consulta: "¿Cuáles son las normas del reglamento escolar?"
4. Esperar la respuesta — señalar:
   - La respuesta con formato
   - El **porcentaje de confianza**
   - Las **fuentes citadas** (con link al PDF)
   - El badge "Documentación oficial"
5. Hacer click en una fuente → se abre el PDF
6. Hacer segunda consulta: "¿Qué dice el estatuto del docente sobre licencias?"
7. Hacer tercera consulta que no tenga respuesta: "¿Cuál es el procedimiento para solicitar una beca?"
   - Mostrar que **escala automáticamente** y genera un ticket

**Qué decir:**
> "El chat utiliza RAG (Retrieval Augmented Generation) para buscar en la base de conocimiento y responder con fuentes verificables. Cada respuesta incluye un nivel de confianza y citas a los documentos originales."

> "Cuando el sistema no encuentra información, escala automáticamente la consulta al equipo para que sea respondida."

---

### 4️⃣ GESTIÓN DE DOCUMENTOS (1 min)

**Acciones:**
1. Ir a "Documentación" en el menú
2. Mostrar la lista de documentos indexados
3. Click en "Cargar documento"
4. Subir un PDF nuevo
5. Mostrar que el sistema **analiza con IA** y sugiere metadatos (título, categoría)
6. Confirmar la carga
7. Mostrar el mensaje de éxito con cantidad de chunks procesados

**Qué decir:**
> "Los administradores pueden cargar documentos PDF que se procesan automáticamente: se extraen los textos, se fragmentan y se generan embeddings vectoriales para la búsqueda semántica."

---

### 5️⃣ DASHBOARD ADMINISTRATIVO (1 min)

**Acciones:**
1. Ir a "Dashboard" → mostrar métricas generales
2. Ir a "Usuarios" → mostrar la lista
3. Mostrar perfiles y permisos de un usuario
4. Ir a "Log de usuarios" → mostrar auditoría

**Qué decir:**
> "El panel administrativo permite gestionar usuarios con roles granulares, monitorear la actividad del sistema y mantener un registro de auditoría completo."

---

### 6️⃣ NOTICIAS (30 seg)

**Acciones:**
1. Ir a "Noticias" desde el menú
2. Mostrar las noticias publicadas con imágenes
3. (Opcional) Crear una noticia rápida

**Qué decir:**
> "El sistema incluye un módulo de noticias institucionales para mantener informados a los usuarios."

---

### 7️⃣ TICKETS / MIS CONSULTAS (30 seg)

**Acciones:**
1. Ir a "Mis Consultas"
2. Mostrar el ticket que se generó automáticamente en el paso 3
3. Mostrar que tiene estado "pendiente"
4. (Opcional) Responder el ticket como admin

**Qué decir:**
> "Las consultas que el sistema no puede resolver se convierten en tickets de seguimiento, creando un loop de mejora continua."

---

### 8️⃣ PERSONALIZACIÓN VISUAL (1 min)

**Acciones:**
1. Ir a "Temas y Visualización"
2. Cambiar a tema "Ciudad" → mostrar que cambia todo
3. Cambiar el logo
4. Seleccionar fondo blanco para el logo
5. Activar modo oscuro
6. Volver a tema "Estándar"

**Qué decir:**
> "La plataforma es completamente personalizable: colores, tipografía, logo y tema visual. Cada entidad puede adaptarla a su identidad institucional."

---

### 9️⃣ CONSULTA COMO INVITADO (30 seg)

**Acciones:**
1. Cerrar sesión
2. En el login, click "Continuar como invitado"
3. Completar nombre y email
4. Hacer una consulta
5. Mostrar que responde igual pero sin historial

**Qué decir:**
> "Los ciudadanos pueden realizar consultas sin necesidad de registrarse, democratizando el acceso a la información pública."

---

### 🔟 CIERRE (30 seg)

**Qué mostrar:**
- La URL pública: https://agilizesoluciones.uk
- (Opcional) El diagrama de arquitectura del README

**Qué decir:**
> "INFODETS es una solución completa, 100% self-hosted, que combina inteligencia artificial con gestión documental para transformar la atención ciudadana. Desarrollado con Next.js, FastAPI, PostgreSQL, Qdrant y modelos de lenguaje de última generación."

---

## 💡 Tips para la grabación

| Tip | Detalle |
|-----|---------|
| Velocidad | No apurarse, dar tiempo a que carguen las respuestas del chat |
| Mouse | Movimientos suaves, señalar con el cursor lo que se explica |
| Errores | Si algo falla, pausar y retomar (se edita después) |
| Audio | Hablar claro, sin ruido de fondo. Micrófono cerca |
| Tema visual | Usar tema "Ciudad" o "Estándar" (los más vistosos) |
| Navegador | Chrome en modo incógnito, sin bookmarks ni extensiones |

---

## 🎵 Post-producción (opcional)

- Música de fondo suave (libre de derechos)
- Agregar texto/títulos en las transiciones entre secciones
- Agregar zoom en las partes importantes (confianza, fuentes)
- Duración final ideal: 5-7 minutos

---

*INFODETS — Video Demo Guide v1.0*
