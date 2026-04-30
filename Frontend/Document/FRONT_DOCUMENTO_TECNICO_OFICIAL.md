# DOCUMENTO TÉCNICO OFICIAL
## DESARROLLO FRONT-END — SISTEMA INFODETS
### Sistema de Gestión de Conocimiento Dinámico

---

> **Versión:** 2.0
> **Estado:** Sprint Testeo — Sistema operativo
> **Rama activa:** `Testeo`

---

## ÍNDICE

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Arquitectura y estructura de directorios](#2-arquitectura-y-estructura-de-directorios)
3. [Autenticación](#3-autenticación)
4. [Sistema de permisos](#4-sistema-de-permisos)
5. [Módulos funcionales](#5-módulos-funcionales)
6. [Comunicación con el Backend](#6-comunicación-con-el-backend)
7. [Estándares de desarrollo](#7-estándares-de-desarrollo)
8. [Variables de entorno](#8-variables-de-entorno)
9. [Dependencias](#9-dependencias)

---

## 1. STACK TECNOLÓGICO

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript estricto |
| UI | Mantine UI v9 |
| Animaciones | Framer Motion |
| Iconos | Tabler Icons |
| Estado global | Zustand (con persist) |
| HTTP | Axios con interceptores |
| Fechas | @mantine/dates + dayjs |
| Fuente | Plus Jakarta Sans |

---

## 2. ARQUITECTURA Y ESTRUCTURA DE DIRECTORIOS

```
src/
├── app/
│   ├── page.tsx                    → Login (email + password)
│   ├── invitado/page.tsx           → Consulta sin registro
│   ├── consulta/page.tsx           → Chat con IA (ruta principal)
│   ├── perfil/page.tsx             → Perfil del usuario
│   ├── documentacion/page.tsx      → Carga de documentos
│   ├── noticias/page.tsx           → Noticias institucionales
│   ├── auth/callback/page.tsx      → Redirige a / (legacy)
│   └── dashboard/
│       ├── layout.tsx              → Layout del panel admin
│       ├── page.tsx                → Dashboard principal
│       ├── usuarios/               → CRUD de usuarios
│       ├── derechos/               → Perfiles y permisos
│       ├── notificaciones/         → Tickets + validaciones IA
│       ├── documentacion/          → Documentos + URLs oficiales
│       ├── noticias/               → CRUD noticias
│       ├── tablas/                 → Tablas administrables
│       └── panel-notificaciones/   → Panel de notificaciones
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx             → Lee permisos del store (sin fetch)
│   │   ├── AuthProvider.tsx        → Siempre ready=true (sin Amplify)
│   │   ├── Providers.tsx           → MantineProvider + QueryClient
│   │   └── PageLoader.tsx
│   └── chat/
│       ├── ChatPanel.tsx           → Chat SSE con IA
│       └── HistorialPanel.tsx      → Últimas 20 consultas
├── hooks/
│   ├── auth/
│   │   ├── useAuth.ts              → logout limpia store
│   │   └── useRequireAuth.ts       → Verifica permisos del store
│   ├── ui/useSidebar.ts
│   └── useTablaOpciones.ts
├── services/api/
│   ├── consultaService.ts
│   ├── usuarioService.ts
│   ├── perfilService.ts
│   ├── permisoService.ts
│   ├── tablaService.ts
│   ├── noticiaService.ts
│   └── ingestaService.ts
├── store/
│   ├── sessionStore.ts             → usuario + token + permisos (persistido)
│   └── uiStore.ts                  → sidebar + consultasCount
├── lib/
│   ├── axiosInstance.ts            → Token del store, sin Amplify
│   ├── constants.ts
│   └── queryClient.ts
└── types/
    ├── consulta.types.ts
    ├── usuario.types.ts
    └── ...
```

---

## 3. AUTENTICACIÓN

### Flujo de login

```
Usuario ingresa email + password
        ↓
Validación frontend: EMAIL_REGEX + PASSWORD_REGEX
(botón deshabilitado hasta que ambos sean válidos)
        ↓
POST /v1/auth/login
        ↓
GET /v1/permisos/{usuario_id} (con el token recibido)
        ↓
setSession(usuario, token, permisos) → Zustand + localStorage
        ↓
router.replace('/consulta')
```

### Política de contraseñas (Cognito)

| Regla | Valor |
|---|---|
| Longitud mínima | 8 caracteres |
| Mayúsculas | Al menos 1 |
| Minúsculas | Al menos 1 |
| Números | Al menos 1 |
| Símbolos | Al menos 1 (`!@#$%^&*...`) |

Ejemplo válido: `Infodets2024!`

### Logout

```ts
const logout = () => {
  clearSession()  // limpia usuario + token + permisos del store
  router.replace(ROUTES.HOME)
}
```

---

## 4. SISTEMA DE PERMISOS

Los permisos se cargan **una sola vez al login** y se persisten en localStorage.

### sessionStore

```ts
interface SessionStore {
  usuario: Usuario | null
  token: string | null
  permisos: Record<string, boolean>  // ← persistido
  setSession: (usuario, token, permisos?) => void
  setPermisos: (permisos) => void
  tienePermiso: (key: string) => boolean
  clearSession: () => void
}
```

### Secciones disponibles

**Menú (visibilidad):**
- `consulta`, `perfil`, `documentacion`, `noticias`, `dashboard`

**Acciones (backend):**
- `gestionar_usuarios`, `blanquear_password`, `gestionar_documentos`
- `gestionar_noticias`, `gestionar_tablas`, `ver_validaciones`

### Sidebar sin parpadeo

```ts
// Sidebar.tsx — lee del store, sin fetch
const { tienePermiso } = useSessionStore()
const itemsVisibles = MENU_ITEMS.filter(item => tienePermiso(item.key))
```

### Protección de rutas

```ts
// useRequireAuth — usa el store, sin fetch
if (adminOnly && !tienePermiso('dashboard')) {
  router.replace(ROUTES.CONSULTA)
}
```

---

## 5. MÓDULOS FUNCIONALES

### 5.1 Login (`/`)
- Form email + password con validación regex
- Botón deshabilitado hasta que ambos campos sean válidos
- Carga permisos al iniciar sesión
- Mensajes de error específicos (credenciales incorrectas, cuenta no confirmada, etc.)

### 5.2 Chat con IA (`/consulta`)
- Streaming SSE en tiempo real
- Fuentes con links al PDF original
- Badge de % de confianza
- Historial de consultas en panel lateral (se actualiza tras cada consulta)
- Sugerencias de consultas al inicio

### 5.3 Consulta invitado (`/invitado`)
- Formulario: nombre, apellido, email (requeridos), institución (Select desde tabla), consulta (mín. 10 chars)
- Botón deshabilitado hasta que todos los campos requeridos sean válidos
- Streaming SSE igual que el chat autenticado
- Una sola consulta por sesión
- Datos guardados en tabla `consultas_invitado`

### 5.4 Perfil (`/perfil`)
- Datos cargados desde el store (instantáneo) + sincronización con backend
- DatePicker para fecha de nacimiento (formato DD/MM/AAAA, no permite fechas futuras)
- Modo lectura / edición
- Botón "Guardar" aparece solo cuando hay cambios

### 5.5 Derechos y perfiles (`/dashboard/derechos`)
- Tarjetas de perfiles con permisos visibles
- Modal con tabs: "Menú visible" / "Acciones permitidas"
- Botones "Activar todos" / "Desactivar todos" por grupo
- Modal de asignación con perfil actual del usuario visible
- Al editar permisos → se propagan automáticamente a todos los usuarios del perfil

### 5.6 Usuarios (`/dashboard/usuarios`)
- Columna "Perfil" (reemplazó "Rol")
- Perfil obligatorio al crear usuario
- Blanqueo de contraseña con modal de confirmación
- Contraseña por defecto configurable desde la misma página

### 5.7 Notificaciones (`/dashboard/notificaciones`)
- Tab "Tickets vacíos" — consultas sin documentación (score < 70%)
- Tab "Validaciones IA" — respuestas para revisar/aprobar/rechazar
  - Aprobar → indexa en Qdrant
  - Rechazar → descarta
  - Score ≥ 85% → auto-indexado sin intervención

### 5.8 Documentación (`/dashboard/documentacion`)
- Tab "Documentos PDF" — subir, listar, eliminar
- Tab "URLs Oficiales" — agregar URLs para el Nivel 1 del loop de retroalimentación

---

## 6. COMUNICACIÓN CON EL BACKEND

### axiosInstance

```ts
// Sin Amplify — token directo del store
axiosInstance.interceptors.request.use((config) => {
  const token = useSessionStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 → limpia sesión y redirige a /
// Excepto /auth/login (para mostrar el error al usuario)
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginEndpoint) {
      useSessionStore.getState().clearSession()
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)
```

### Chat SSE

```ts
const res = await fetch(`${API_URL}/chat/stream`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ mensaje, usuario_id }),
})
const reader = res.body.getReader()
// Lee chunks y actualiza el estado en tiempo real
```

---

## 7. ESTÁNDARES DE DESARROLLO

### TypeScript

- `any` prohibido
- Tipos espejo de los DTOs del backend
- Validaciones con regex antes de enviar al servidor

### Convenciones

| Elemento | Convención |
|---|---|
| Componentes | PascalCase (`ChatPanel.tsx`) |
| Hooks | camelCase con prefijo `use` |
| Stores | camelCase con sufijo `Store` |
| Servicios | camelCase con sufijo `Service` |

### Emails

Siempre normalizados a minúsculas antes de enviar:
```ts
email: email.trim().toLowerCase()
```

### Fechas

Formato estándar: `DD/MM/AAAA`
- Frontend: `DatePickerInput` con `valueFormat="DD/MM/YYYY"`
- Backend: validación con regex `^(0[1-9]|[12]\d|3[01])/(0[1-9]|1[0-2])/(\d{4})$`

---

## 8. VARIABLES DE ENTORNO

### `.env.local` (Frontend)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/v1
```

---

## 9. DEPENDENCIAS

### Producción

| Paquete | Versión | Propósito |
|---|---|---|
| `next` | 16+ | Framework principal |
| `react` | 18+ | Base |
| `typescript` | 5+ | Tipado estricto |
| `@mantine/core` | 9.1.0 | Componentes UI |
| `@mantine/dates` | 9.1.0 | DatePicker |
| `@mantine/notifications` | 9.1.0 | Notificaciones |
| `@mantine/charts` | 9.1.0 | Gráficos |
| `@tabler/icons-react` | latest | Iconos |
| `framer-motion` | 11+ | Animaciones |
| `@tanstack/react-query` | 5+ | Estado del servidor |
| `zustand` | 4+ | Estado global |
| `axios` | 1+ | HTTP client |
| `dayjs` | latest | Manejo de fechas |

---

*INFODETS — Sistema de Gestión de Conocimiento Dinámico*
*Documento Técnico Frontend v2.0 — Sprint Testeo*
