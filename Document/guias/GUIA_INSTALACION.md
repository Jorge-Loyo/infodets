# GUÍA DE INSTALACIÓN — INFODETS
## Cómo correr el proyecto en una máquina nueva

---

> **Proyecto:** INFODETS — Sistema de Gestión de Conocimiento Dinámico
> **Repositorio:** https://github.com/Jorge-Loyo/infodets
> **Rama activa de desarrollo:** `Testeo`

---

## PREREQUISITOS

Instalar antes de comenzar:

| Herramienta | Versión | Descarga |
|---|---|---|
| Git | Cualquier versión reciente | https://git-scm.com/downloads |
| Node.js | 20 o superior | https://nodejs.org |
| Python | 3.13 | https://www.python.org/downloads/ |

> Durante la instalación de Python marcar obligatoriamente: **Add Python to PATH**

---

## INSTALACIÓN LOCAL (desarrollo)

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/Jorge-Loyo/infodets.git
cd infodets
git checkout Testeo
```

---

### Paso 2 — Tunnels SSH (obligatorios antes de levantar el backend)

Abrir **dos terminales separadas** y dejarlas corriendo:

**Terminal 1 — Base de datos RDS:**
```bash
ssh -i "/c/git/Popurri/Key/keyinfodets.pem" -L 5432:infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com:5432 ubuntu@32.192.124.14 -N
```

**Terminal 2 — Qdrant:**
```bash
ssh -i "/c/git/Popurri/Key/keyinfodets.pem" -L 6333:localhost:6333 ubuntu@32.192.124.14 -N
```

---

### Paso 3 — Configurar el Backend

```bash
cd Backend
py -m venv venv
source venv/Scripts/activate      # Windows Git Bash
# source venv/bin/activate         # Mac / Linux
pip install -r requirements.txt
```

Solicitar el archivo `.env` al líder del proyecto y copiarlo en `Backend/.env`.

Levantar el backend:

```bash
uvicorn main:app --reload
```

---

### Paso 4 — Configurar el Frontend

```bash
cd Frontend/infodets-web
npm install
```

El archivo `.env.local` debe contener:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/v1
```

Levantar el frontend:

```bash
npm run dev
```

---

### Paso 5 — Verificar

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Documentación API | http://localhost:8000/docs |

---

## SISTEMA EN PRODUCCIÓN

El sistema está desplegado y accesible públicamente:

| Servicio | URL | Estado |
|---|---|---|
| Frontend | `http://32.192.124.14:3000` | ✅ Docker |
| Backend API | `http://32.192.124.14:8000` | ✅ systemd |
| Qdrant | `http://32.192.124.14:6333` | ✅ Docker |
| n8n | `http://32.192.124.14:5678` | ✅ Docker |

> ⚠️ **Credenciales AWS temporales:** Las credenciales `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` y `AWS_SESSION_TOKEN` en `Backend/.env` del EC2 expiran con cada sesión del laboratorio AWS Academy. Actualizarlas y reiniciar el backend con `sudo systemctl restart fastapi`.

**Gestión del frontend en producción:**
```bash
# Ver estado
docker ps | grep infodets-frontend

# Reiniciar
docker restart infodets-frontend

# Ver logs
docker logs infodets-frontend --tail 50
```

**Nota de deploy:** El EC2 `t3.small` (2GB RAM) requiere swap para compilar Next.js. El swap de 2GB ya está configurado en el EC2. Si se pierde tras un reinicio:
```bash
sudo swapon /swapfile
```

---

## AUTENTICACIÓN

El sistema usa **login propio con JWT HS256** — sin OAuth ni redirects de Cognito.

- Ir a http://localhost:3000
- Ingresar email y contraseña (las credenciales se gestionan en AWS Cognito)
- Los permisos se cargan al iniciar sesión y se persisten en localStorage

**Usuarios disponibles:**

| Email | Perfil |
|---|---|
| jorgenayati@gmail.com | Administrador |
| jorgenayaticmi@gmail.com | Operador |
| leryuslegys@gmail.com | Operador |
| sni15396@gmail.com | Operador |

> Para blanquear contraseñas ir a `/dashboard/usuarios` → ícono 🔒

---

## INFRAESTRUCTURA AWS

| Servicio | URL / Endpoint |
|---|---|
| Servidor EC2 | `32.192.124.14` |
| n8n | http://32.192.124.14:5678 |
| RDS PostgreSQL | `infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com` |
| Qdrant | http://32.192.124.14:6333 |
| Cognito User Pool | `us-east-1_uOuYTO6Ce` |

**Conexión SSH al EC2:**
```bash
ssh -i "C:\git\Popurri\Key\keyinfodets.pem" ubuntu@32.192.124.14
```

**Levantar Qdrant si está caído:**
```bash
ssh -i "C:\git\Popurri\Key\keyinfodets.pem" ubuntu@32.192.124.14 "docker start qdrant"
```

---

## VARIABLES DE ENTORNO — Backend (.env)

```env
# Cognito
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_uOuYTO6Ce
COGNITO_CLIENT_ID=40g4ffmsvf8mmk77kc37abucvd
COGNITO_CLIENT_SECRET=<solicitar al líder>

# App
APP_ENV=development
SECRET_KEY=<solicitar al líder>

# Base de datos
DATABASE_URL=postgresql://infodets_admin:<password>@localhost:5432/infodets

# Google Gemini
GEMINI_API_KEY=<solicitar al líder>
GEMINI_GENERATION_KEY=<solicitar al líder>

# Groq (fallback IA)
GROQ_API_KEY=<solicitar al líder>

# n8n
N8N_URL=http://32.192.124.14:5678
N8N_USER=admin
N8N_PASSWORD=<solicitar al líder>

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=infodets_docs

# Loop de retroalimentación
SEARCH_API_KEY=<solicitar al líder>
SEARCH_API_URL=https://google.serper.dev/search

# Contraseña por defecto para blanqueo
DEFAULT_PASSWORD=<solicitar al líder>

# AWS Credentials (para blanqueo de passwords en Cognito)
AWS_ACCESS_KEY_ID=<credenciales temporales del laboratorio>
AWS_SECRET_ACCESS_KEY=<credenciales temporales del laboratorio>
AWS_SESSION_TOKEN=<credenciales temporales del laboratorio>
```

> ⚠️ Las credenciales AWS son **temporales** (sesión de laboratorio). Deben actualizarse cada vez que se inicia una nueva sesión en el portal AWS Academy.

---

## ARCHIVOS SENSIBLES — SOLICITAR AL LÍDER

| Archivo | Contiene |
|---|---|
| `Backend/.env` | Todas las credenciales del sistema |
| `keyinfodets.pem` | Clave SSH para acceder al EC2 |

---

*INFODETS — Sistema de Gestión de Conocimiento Dinámico*
*Guía de instalación v2.0 — Actualizada al Sprint Testeo*
