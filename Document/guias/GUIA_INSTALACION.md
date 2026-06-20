# GUÍA DE INSTALACIÓN — INFODETS v1.0.0
## Cómo correr el proyecto

---

> **Proyecto:** INFODETS — Sistema de Gestión de Conocimiento Dinámico
> **Repositorio:** https://github.com/Jorge-Loyo/infodets
> **Rama activa de desarrollo:** `Testeo`
> **Producción:** https://agilizesoluciones.uk

---

## PREREQUISITOS

| Herramienta | Versión | Descarga |
|:-:|:-:|:-:|
| Git | Reciente | https://git-scm.com/downloads |
| Node.js | 20+ | https://nodejs.org |
| Python | 3.13 | https://python.org/downloads |
| Docker | Reciente | https://get.docker.com |

> ⚠️ Al instalar Python, marcar **"Add Python to PATH"**

---

## OPCIÓN 1: DESARROLLO LOCAL

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/Jorge-Loyo/infodets.git
cd infodets
git checkout Testeo
```

### Paso 2 — Configurar el Backend

```bash
cd Backend
py -m venv venv
source venv/Scripts/activate      # Windows Git Bash
# source venv/bin/activate         # Mac / Linux
pip install -r requirements.txt
```

Solicitar el archivo `.env` al líder del proyecto y copiarlo en `Backend/.env`.

El `.env` debe apuntar a la VM para la base de datos:

```env
DB_HOST=192.168.56.101
DATABASE_URL=postgresql://infodets_admin:Infodets2024!@192.168.56.101:5432/infodets
QDRANT_URL=http://192.168.56.101:6333
```

Levantar el backend:

```bash
uvicorn main:app --reload
```

### Paso 3 — Configurar el Frontend

```bash
cd Frontend/infodets-web
npm install
```

El archivo `.env.local` debe contener:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/v1
NEXT_PUBLIC_DOCS_URL=http://localhost:8000
```

Levantar el frontend:

```bash
npm run dev
```

### Paso 4 — Verificar

| Servicio | URL |
|:-:|:-:|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Docs API (Swagger) | http://localhost:8000/docs |

---

## OPCIÓN 2: DESPLIEGUE COMPLETO CON DOCKER (VM/Servidor)

### Paso 1 — Clonar y configurar

```bash
git clone https://github.com/Jorge-Loyo/infodets.git
cd infodets
git checkout main
```

### Paso 2 — Configurar `.env.standalone`

Copiar `Backend/.env` como base y ajustar:

```env
DB_HOST=db
DATABASE_URL=postgresql://infodets_admin:Infodets2024!@db:5432/infodets
QDRANT_URL=http://qdrant:6333
FRONTEND_URL=http://<TU_IP_O_DOMINIO>:3000
```

### Paso 3 — Levantar todo

```bash
docker compose -f docker-compose.standalone.yml up --build -d
```

### Paso 4 — Correr migraciones

```bash
docker exec infodets-backend alembic upgrade head
```

### Paso 5 — Verificar

```bash
docker compose -f docker-compose.standalone.yml ps
```

---

## SISTEMA EN PRODUCCIÓN

El sistema está desplegado en una VM con acceso público via Cloudflare Tunnel:

| Servicio | URL |
|:-:|:-:|
| Frontend | https://agilizesoluciones.uk |
| Backend API | https://api.agilizesoluciones.uk |
| Docs Swagger | https://api.agilizesoluciones.uk/docs |
| n8n Workflows | https://n8n.agilizesoluciones.uk |
| Qdrant Dashboard | http://192.168.56.101:6333/dashboard |

### Conexión SSH a la VM

```bash
ssh infodets@192.168.56.101
```

### Comandos útiles en la VM

```bash
# Estado de containers
docker compose -f ~/infodets/docker-compose.standalone.yml ps

# Logs del backend
docker logs infodets-backend --tail 50

# Rebuild después de cambios
docker compose -f ~/infodets/docker-compose.standalone.yml up -d --build backend frontend

# Reiniciar Cloudflare Tunnel
sudo systemctl restart cloudflared
```

---

## AUTENTICACIÓN

El sistema usa **autenticación local con bcrypt + JWT HS256**.

- No depende de AWS Cognito
- Contraseña por defecto para usuarios nuevos: `Infodets2024!`
- Al primer login se hashea la contraseña y se almacena en la DB
- Para blanquear contraseñas: `/dashboard/usuarios` → ícono 🔒

### Usuarios disponibles

| Email | Perfil |
|:-:|:-:|
| jorgenayati@gmail.com | Administrador |
| jorgenayaticmi@gmail.com | Operador |
| leryuslegys@gmail.com | Operador |
| sni15396@gmail.com | Operador |

---

## DEPLOY AUTOMÁTICO

Cada push a la rama `main` dispara un deploy automático en la VM:

1. GitHub webhook → `https://deploy.agilizesoluciones.uk/webhook`
2. El script hace `git pull` + rebuild de containers
3. Todo se actualiza sin intervención manual

### Flujo de trabajo

```
Desarrollo en Testeo → Merge a main → Deploy automático en VM
```

---

## ARQUITECTURA

```
┌─────────────────────────────────────────────────┐
│              VM (VirtualBox / Servidor)          │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Frontend │  │ Backend  │  │ PostgreSQL   │ │
│  │ Next.js  │  │ FastAPI  │  │ (Docker)     │ │
│  │ :3000    │  │ :8000    │  │ :5432        │ │
│  └──────────┘  └──────────┘  └──────────────┘ │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Qdrant   │  │   n8n    │  │    Nginx     │ │
│  │ :6333    │  │ :5678    │  │ :80          │ │
│  └──────────┘  └──────────┘  └──────────────┘ │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Cloudflare Tunnel (HTTPS automático)     │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Servicios externos  │
│ • Google Gemini     │
│ • Groq (fallback)   │
│ • Cloudinary (imgs) │
│ • Serper (búsqueda) │
└─────────────────────┘
```

---

## VARIABLES DE ENTORNO — Backend (.env)

```env
# App
APP_ENV=development
SECRET_KEY=<solicitar al líder>

# Base de datos
DB_HOST=192.168.56.101
DB_PORT=5432
DB_NAME=infodets
DB_USER=infodets_admin
DB_PASSWORD=<solicitar al líder>
DATABASE_URL=postgresql://infodets_admin:<password>@192.168.56.101:5432/infodets

# Google Gemini
GEMINI_API_KEY=<solicitar al líder>
GEMINI_GENERATION_KEY=<solicitar al líder>

# Groq (fallback IA)
GROQ_API_KEY=<solicitar al líder>

# Qdrant
QDRANT_URL=http://192.168.56.101:6333
QDRANT_COLLECTION=infodets_docs

# Cloudinary (imágenes)
CLOUDINARY_CLOUD_NAME=<solicitar al líder>
CLOUDINARY_API_KEY=<solicitar al líder>
CLOUDINARY_API_SECRET=<solicitar al líder>

# n8n
N8N_URL=http://192.168.56.101:5678
N8N_USER=admin
N8N_PASSWORD=<solicitar al líder>

# Loop de retroalimentación
SEARCH_API_KEY=<solicitar al líder>
SEARCH_API_URL=https://google.serper.dev/search

# Cohere (re-ranking)
COHERE_API_KEY=<solicitar al líder>

# Contraseña por defecto para blanqueo
DEFAULT_PASSWORD=Infodets2024!

# Cognito (opcional, legacy)
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
COGNITO_CLIENT_SECRET=
```

---

## ARCHIVOS SENSIBLES — SOLICITAR AL LÍDER

| Archivo | Contiene |
|:-:|:-:|
| `Backend/.env` | Credenciales del sistema |
| `Backend/.env.standalone` | Credenciales para la VM (Docker) |

---

## STACK TECNOLÓGICO

| Capa | Tecnología | Versión |
|:-:|:-:|:-:|
| Frontend | Next.js + React + TypeScript | 16 / 19 / 5.0 |
| Backend | FastAPI + Python | 0.115 / 3.13 |
| Base de datos | PostgreSQL | 17 |
| Base vectorial | Qdrant | Latest |
| IA Principal | Google Gemini | 2.0 |
| IA Fallback | Groq (Llama) | Latest |
| Autenticación | JWT HS256 + bcrypt | — |
| Imágenes | Cloudinary CDN | — |
| Orquestación | n8n (Docker) | Latest |
| Proxy/HTTPS | Nginx + Cloudflare Tunnel | — |

---

*INFODETS — Sistema de Gestión de Conocimiento Dinámico*
*Guía de instalación v3.0 — Junio 2026*
