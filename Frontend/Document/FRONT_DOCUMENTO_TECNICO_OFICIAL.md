# DOCUMENTO TÉCNICO OFICIAL
## DESARROLLO FRONT-END — SISTEMA INFODETS
### Sistema de Gestión de Conocimiento Dinámico

---

> **Versión:** 1.0  
> **Estado:** Definitivo  
> **Alcance:** Definición completa del stack, arquitectura, librerías, diseño y plan de desarrollo del Front-End

---

## ÍNDICE

1. [Visión General](#1-visión-general)
2. [Stack Tecnológico Oficial](#2-stack-tecnológico-oficial)
3. [Librerías de Diseño y Experiencia Visual](#3-librerías-de-diseño-y-experiencia-visual)
4. [Arquitectura y Estructura de Directorios](#4-arquitectura-y-estructura-de-directorios)
5. [Estándares de Desarrollo](#5-estándares-de-desarrollo)
6. [Comunicación con el Back-End](#6-comunicación-con-el-back-end)
7. [Módulos Funcionales](#7-módulos-funcionales)
8. [Plan de Desarrollo por Fases](#8-plan-de-desarrollo-por-fases)
9. [Tabla de Dependencias Completa](#9-tabla-de-dependencias-completa)

---

## 1. VISIÓN GENERAL

El Front-End del Sistema INFODETS es la capa de presentación e interacción del Sistema de Gestión de Conocimiento Dinámico. Su propósito es ofrecer a ciudadanos y personal administrativo una interfaz institucional, moderna y funcional que permita:

- Realizar consultas en lenguaje natural a la IA del sistema
- Visualizar respuestas con trazabilidad a documentos fuente
- Gestionar sesiones de usuario con autenticación segura
- Administrar y monitorear el sistema desde un panel de control

El diseño visual responde a los criterios de una entidad pública: estética limpia, seria y profesional, con micro-interacciones modernas que mejoran la experiencia sin comprometer la formalidad institucional.

---

## 2. STACK TECNOLÓGICO OFICIAL

| Capa | Tecnología | Justificación |
|---|---|---|
| Lenguaje | TypeScript (estricto) | Tipado 1:1 con DTOs de Python. `any` prohibido. |
| Framework | Next.js 14+ (App Router) | SSR, routing avanzado, optimización nativa |
| Librería base | React 18+ | Base del ecosistema, compatible con todo el stack |
| Componentes UI | Mantine UI v7 | Diseño institucional, accesible, hooks nativos |
| Estado del servidor | TanStack Query v5 | Caché, sincronización y fetching de datos de API |
| Estado global de UI | Zustand | Sesión, sidebar, notificaciones — sin boilerplate |
| Animaciones | Framer Motion | Transiciones de página y micro-animaciones |
| Cliente HTTP | Axios | Wrapper tipado para llamadas a FastAPI |
| Autenticación | AWS Amplify + Cognito | Gestión de sesiones y rutas protegidas |
| Calidad de código | ESLint + Prettier | Consistencia y formato unificado del equipo |

---

## 3. LIBRERÍAS DE DISEÑO Y EXPERIENCIA VISUAL

### 3.1 Animaciones y Transiciones — Framer Motion

Framer Motion es la librería estándar del ecosistema React para animaciones declarativas.
Se integra de forma nativa con Next.js App Router y no genera conflictos con Mantine.

```bash
npm install framer-motion
```

**Uso en INFODETS:**
- Transición de entrada y salida del Sidebar
- Animación de aparición progresiva de respuestas del chat
- Transiciones suaves entre páginas (fade, slide)
- Micro-animaciones en botones (hover, tap)

**Ejemplo de botón con micro-interacción:**
```tsx
import { motion } from 'framer-motion'
import { Button } from '@mantine/core'

<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
  <Button>Consultar</Button>
</motion.div>
```

---

### 3.2 Iconografía — Tabler Icons

Librería oficial recomendada por Mantine. Más de 5.000 íconos SVG, minimalistas y consistentes
con el lenguaje visual de Mantine UI.

```bash
npm install @tabler/icons-react
```

**Uso en INFODETS:**
- Íconos del Sidebar y navegación
- Íconos de acciones en el chat (enviar, copiar, reportar)
- Íconos del Dashboard administrativo

---

### 3.3 Gráficos — Mantine Charts + Recharts

Para el Dashboard de administración (RF4), se utilizará la librería oficial de Mantine
basada en Recharts, garantizando consistencia visual con el resto de la interfaz.

```bash
npm install @mantine/charts recharts
```

**Uso en INFODETS:**
- Gráfico de "hot topics" (temas más consultados)
- Gráfico de volumen de consultas por período
- Visualización de reportes de feedback

---

### 3.4 Tipografía — Next.js Font (nativo)

Next.js incluye optimización de fuentes nativa sin dependencias externas.
No impacta el rendimiento ni genera layout shift.

```tsx
// src/app/layout.tsx
import { Plus_Jakarta_Sans } from 'next/font/google'

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })
```

**Fuente seleccionada:** Plus Jakarta Sans
- Moderna, legible y con carácter institucional
- Alternativa: Inter (más neutral, igualmente válida)

---

### 3.5 Criterio de Diseño Visual

| Elemento | Criterio |
|---|---|
| Paleta de colores | Definida en el tema de Mantine (colores institucionales) |
| Espaciado | Sistema de espaciado de Mantine (4px base) |
| Bordes y radios | Redondeados suaves (`md`: 8px) para modernidad sin informalidad |
| Sombras | Sutiles, solo en modales y cards elevados |
| Animaciones | Duraciones cortas (150ms–300ms), sin efectos llamativos |
| Modo oscuro | Soportado nativamente por Mantine, activable por preferencia del sistema |

---

## 4. ARQUITECTURA Y ESTRUCTURA DE DIRECTORIOS

```
/src
  │
  ├── /app                          → Rutas y páginas (Next.js App Router)
  │     ├── /login                  → Página de autenticación
  │     ├── /consulta               → Interfaz de chat con IA (RF2)
  │     ├── /dashboard              → Panel administrativo (RF4)
  │     ├── layout.tsx              → Layout raíz: Providers, fuente, tema
  │     └── page.tsx                → Redirección según estado de sesión
  │
  ├── /components
  │     ├── /chat                   → ChatInput, ChatResponse, FeedbackButton, SourceLink
  │     ├── /layout                 → AppShell, Sidebar, Header, PageLoader, ErrorBoundary
  │     └── /ui                     → Componentes genéricos reutilizables (Badge, Card, etc.)
  │
  ├── /hooks
  │     ├── /auth                   → useAuth, useSession, usePermissions
  │     ├── /data                   → useConsultas, useFeedback, useHistorial
  │     └── /ui                     → useModal, useSidebar, useToast
  │
  ├── /services
  │     ├── /api                    → Funciones tipadas de llamada a FastAPI
  │     └── /auth                   → Funciones de integración con Cognito
  │
  ├── /store                        → Stores de Zustand
  │     ├── sessionStore.ts         → Usuario autenticado, token, rol
  │     └── uiStore.ts              → Estado del sidebar, modales, notificaciones
  │
  ├── /types                        → Interfaces TypeScript espejo de DTOs Python
  │     ├── consulta.types.ts
  │     ├── feedback.types.ts
  │     ├── usuario.types.ts
  │     └── dashboard.types.ts
  │
  └── /lib
        ├── queryClient.ts          → Configuración global de TanStack Query
        ├── axiosInstance.ts        → Instancia de Axios con interceptores
        └── constants.ts            → Constantes globales del proyecto
```

---

## 5. ESTÁNDARES DE DESARROLLO

### 5.1 TypeScript Estricto

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

- El uso de `any` está prohibido salvo casos excepcionales con comentario justificado
- Cada tipo en `/types` debe corresponder 1:1 con un DTO definido en el Back-End Python

---

### 5.2 Variables de Entorno por Ambiente

```
.env.local          → Desarrollo local
.env.staging        → Ambiente de pruebas
.env.production     → Producción
```

```env
NEXT_PUBLIC_API_URL=https://api.infodets.gob/v1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<valor>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<valor>
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

---

### 5.3 Manejo Global de Errores y Estados de Carga

- Componente `<ErrorBoundary>` en el layout raíz para errores no controlados
- Hook `useToast` con Mantine Notifications para errores de API
- Componente `<PageLoader>` animado con Framer Motion para transiciones de página
- TanStack Query configurado con `onError` global en el `QueryClient`

---

### 5.4 Convenciones de Código

| Elemento | Convención |
|---|---|
| Componentes | PascalCase (`ChatInput.tsx`) |
| Hooks | camelCase con prefijo `use` (`useAuth.ts`) |
| Stores | camelCase con sufijo `Store` (`sessionStore.ts`) |
| Tipos | PascalCase con sufijo `.types.ts` (`consulta.types.ts`) |
| Servicios | camelCase con sufijo `Service` (`consultaService.ts`) |
| Ramas Git | `feature/nombre`, `fix/nombre`, `chore/nombre` |
| Commits | Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:` |

---

## 6. COMUNICACIÓN CON EL BACK-END

### 6.1 Datos Estáticos y Consultas Normales — TanStack Query

Para todos los endpoints que devuelven respuestas completas (historial, feedback, dashboard):

```ts
const { data, isLoading, error } = useQuery({
  queryKey: ['historial', userId],
  queryFn: () => historialService.getByUser(userId),
})
```

---

### 6.2 Chat con IA — Streaming (SSE o WebSocket)

El mecanismo de streaming debe confirmarse con el equipo de Back-End antes de construir
el componente de chat. Las opciones son:

| Mecanismo | Cuándo usarlo |
|---|---|
| SSE (EventSource) | Streaming unidireccional desde FastAPI. Opción recomendada. |
| WebSockets | Si se requiere comunicación bidireccional en tiempo real. |
| TanStack Query | Solo si la IA responde de forma completa (sin streaming). |

> **Acción bloqueante:** Esta decisión debe tomarse en la Fase 0 antes de iniciar el desarrollo del módulo de chat.

---

### 6.3 Autenticación — AWS Cognito con Amplify

- El token JWT de Cognito se almacena en el store de Zustand (`sessionStore`)
- El middleware de Next.js valida la sesión en cada ruta protegida
- Axios intercepta cada request para inyectar el token en el header `Authorization`

---

## 7. MÓDULOS FUNCIONALES

### 7.1 Módulo de Autenticación

- Página de login con formulario Mantine
- Integración con AWS Cognito via Amplify
- Middleware de Next.js para protección de rutas
- Control de acceso por rol: `admin` y `operador`

---

### 7.2 Módulo de Consulta — Chat con IA (RF2)

- Input de texto para preguntas en lenguaje natural
- Respuesta de la IA con renderizado progresivo (streaming)
- Enlace cliqueable al documento fuente para validación legal
- Botón de feedback integrado al final de cada respuesta
- Historial de consultas en el Sidebar

---

### 7.3 Módulo de Panel Administrativo — Dashboard (RF4)

- Gráfico de "hot topics" (temas más consultados)
- Gráfico de volumen de consultas por período
- Vista de reportes de feedback enviados por operadores
- Control de acceso exclusivo para rol `admin`

---

### 7.4 Layout y Navegación

- AppShell de Mantine como contenedor principal
- Sidebar colapsable con animación Framer Motion
- Header con nombre del usuario, rol y opción de logout
- Transiciones de página animadas

---

## 8. PLAN DE DESARROLLO POR FASES

### FASE 0 — Decisiones Previas (Sin código)

Estas decisiones deben estar resueltas antes de inicializar el proyecto.
Ninguna fase posterior puede comenzar sin completar esta.

- [ ] Confirmar con Back-End si el chat usa streaming (SSE o WebSocket)
- [ ] Confirmar uso de Next.js App Router (v14+)
- [ ] Definir si Cognito se integra con AWS Amplify o `next-auth`
- [ ] Acordar convención de ramas, commits y proceso de PR
- [ ] Definir paleta de colores institucional para el tema de Mantine

---

### FASE 1 — Scaffolding y Configuración Base

**Objetivo:** Proyecto corriendo con toda la infraestructura técnica configurada.

1. Inicializar proyecto Next.js 14 con TypeScript estricto
2. Instalar todas las dependencias (ver sección 9)
3. Configurar `tsconfig.json` con `strict: true`
4. Crear estructura de directorios completa
5. Configurar archivos `.env` por ambiente
6. Configurar tema de Mantine con colores institucionales y tipografía
7. Configurar `QueryClient` global con manejo de errores
8. Configurar instancia de Axios con interceptores de token
9. Configurar ESLint + Prettier

**Entregable:** `localhost:3000` corriendo con Mantine, TanStack Query y Framer Motion operativos.

---

### FASE 2 — Autenticación con Cognito

**Objetivo:** Flujo completo de login/logout antes de construir cualquier pantalla protegida.

1. Implementar `useAuth` y `useSession` hooks
2. Crear `sessionStore` en Zustand
3. Crear página `/login` con formulario Mantine y animación de entrada
4. Implementar middleware de Next.js para rutas protegidas
5. Probar flujo completo: login → redirección → logout → redirección

**Entregable:** Rutas protegidas funcionando con control de roles.

---

### FASE 3 — Layout Base y Navegación

**Objetivo:** Shell de la aplicación listo para montar todas las vistas.

1. Crear layout principal con Mantine `AppShell`
2. Implementar Sidebar animado (Framer Motion) con historial de búsquedas
3. Implementar Header con datos del usuario y logout
4. Crear componente `<PageLoader>` para transiciones
5. Crear componente `<ErrorBoundary>` global

**Entregable:** Layout navegable, animado y con autenticación integrada.

---

### FASE 4 — Módulo de Consulta — Chat con IA (RF2)

**Objetivo:** Interfaz central del sistema funcional y conectada al Back-End.

1. Crear componente `<ChatInput>` con animación de envío
2. Implementar conexión con endpoint de consulta (SSE o TanStack Query según Fase 0)
3. Crear componente `<ChatResponse>` con renderizado progresivo y enlace a fuente
4. Integrar `<FeedbackButton>` al final de cada respuesta
5. Conectar historial de consultas al Sidebar

**Entregable:** Chat funcional, animado y conectado al Back-End.

---

### FASE 5 — Panel Administrativo y Dashboard (RF4)

**Objetivo:** Vistas de gestión para administradores con datos reales.

1. Crear Dashboard con gráficos de Mantine Charts
2. Crear vista de reportes de feedback
3. Implementar restricción de acceso por rol `admin`
4. Conectar todos los datos con TanStack Query

**Entregable:** Panel administrativo funcional con datos reales del Back-End.

---

## 9. TABLA DE DEPENDENCIAS COMPLETA

### Dependencias de Producción

| Paquete | Versión | Propósito |
|---|---|---|
| `next` | 14+ | Framework principal con App Router |
| `react` | 18+ | Base de la interfaz |
| `react-dom` | 18+ | Renderizado en el DOM |
| `typescript` | 5+ | Tipado estricto |
| `@mantine/core` | 7+ | Componentes UI institucionales |
| `@mantine/hooks` | 7+ | Hooks nativos de UI y formularios |
| `@mantine/notifications` | 7+ | Sistema de notificaciones global |
| `@mantine/charts` | 7+ | Gráficos para el Dashboard |
| `@tabler/icons-react` | latest | Iconografía consistente con Mantine |
| `framer-motion` | 11+ | Animaciones y transiciones |
| `@tanstack/react-query` | 5+ | Estado del servidor y caché |
| `zustand` | 4+ | Estado global de UI y sesión |
| `axios` | 1+ | Cliente HTTP tipado con interceptores |
| `aws-amplify` | 6+ | Integración con AWS Cognito |
| `recharts` | 2+ | Base de gráficos para Mantine Charts |

### Dependencias de Desarrollo

| Paquete | Propósito |
|---|---|
| `eslint` | Análisis estático de código |
| `eslint-config-next` | Reglas de ESLint para Next.js |
| `prettier` | Formato unificado de código |
| `@types/react` | Tipos de React para TypeScript |
| `@types/node` | Tipos de Node para TypeScript |

---

## NOTAS FINALES

- Este documento es la referencia técnica oficial para el desarrollo del Front-End de INFODETS
- Cualquier cambio en el stack o la arquitectura debe ser documentado y versionado en este archivo
- Las decisiones de la Fase 0 son bloqueantes: ningún desarrollo comienza sin resolverlas
- El documento de Back-End (FastAPI) debe consultarse en paralelo para mantener la coherencia entre DTOs y tipos TypeScript

---

*Sistema INFODETS — Sistema de Gestión de Conocimiento Dinámico*  
*Documento Técnico Oficial — Front-End v1.0*
