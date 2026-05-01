# INFODETS — Frontend

Aplicación web construida con Next.js 16 (App Router) + TypeScript + Mantine UI.

## Stack

- **Next.js** 16 + React 19 + TypeScript
- **Mantine UI** v9 (componentes, formularios, fechas, gráficos)
- **Zustand** (estado global con persist)
- **Axios** (HTTP con interceptores JWT)
- **Framer Motion** (animaciones)
- **TanStack Query** v5

## Inicio local

```bash
cd Frontend/infodets-web
npm install
npm run dev
```

Disponible en `http://localhost:3000`

> Requiere el backend corriendo en `http://localhost:8000`

## Variables de entorno

Crear `Frontend/infodets-web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/v1
```

En producción el Dockerfile usa:
```
NEXT_PUBLIC_API_URL=http://32.192.124.14:8000/v1
```

## Páginas principales

| Ruta | Descripción | Acceso |
|---|---|---|
| `/` | Login | Público |
| `/invitado` | Consulta sin registro | Público |
| `/consulta` | Chat con IA (SSE) | Autenticado |
| `/perfil` | Perfil del usuario | Autenticado |
| `/documentacion` | Carga de documentos | Con permiso |
| `/noticias` | Noticias institucionales | Autenticado |
| `/dashboard` | Panel administrativo | Admin |
| `/dashboard/usuarios` | CRUD usuarios | Admin |
| `/dashboard/derechos` | Perfiles y permisos | Admin |
| `/dashboard/notificaciones` | Tickets y validaciones IA | Admin |

## Scripts

```bash
npm run dev      # Desarrollo con hot-reload
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linting
```

## Estructura

```
src/
├── app/              → Páginas (App Router)
├── components/       → Componentes reutilizables
├── hooks/            → Hooks personalizados
├── services/api/     → Llamadas al backend
├── store/            → Zustand (session, ui)
├── lib/              → axios, queryClient, constants
└── types/            → Tipos TypeScript
```

## Docker (producción)

```bash
# Build
docker build -t infodets-frontend .

# Run
docker run -d --name infodets-web --restart unless-stopped -p 3000:3000 infodets-frontend

# Logs
docker logs infodets-web --tail 50
```
