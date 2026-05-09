# INFODETS — Backend

API REST construida con FastAPI (Python 3.13). Gestiona autenticación, RAG, ingesta de documentos, permisos y el loop de retroalimentación.

## Stack

- **FastAPI** 0.115 + Uvicorn
- **SQLAlchemy** 2.0 + Alembic (migraciones)
- **PostgreSQL** 17 via AWS RDS
- **Qdrant** (base vectorial)
- **Google Gemini** (embeddings + generación) + **Groq** (fallback)
- **AWS Cognito** (autenticación)

## Inicio local

```bash
# 1. Crear entorno virtual
py -m venv venv
source venv/Scripts/activate   # Windows Git Bash
# source venv/bin/activate      # Mac / Linux

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Copiar variables de entorno (solicitar al líder)
# Backend/.env

# 4. Levantar
uvicorn main:app --reload
```

> Requiere tunnels SSH activos para RDS (5432) y Qdrant (6333). Ver [Guía de instalación](../Document/GUIA_INSTALACION.md).

## Variables de entorno

El archivo `.env` no se sube a Git. Estructura requerida:

```env
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
COGNITO_CLIENT_SECRET=
DATABASE_URL=postgresql://...
SECRET_KEY=
GEMINI_API_KEY=
GEMINI_GENERATION_KEY=
GROQ_API_KEY=
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=infodets_docs
N8N_URL=
SEARCH_API_KEY=
SEARCH_API_URL=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
FRONTEND_URL=http://localhost:3000
APP_ENV=development
```

## Migraciones

```bash
# Aplicar migraciones pendientes
alembic upgrade head

# Crear nueva migración
alembic revision --autogenerate -m "descripcion"
```

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/v1/auth/login` | Login → JWT |
| POST | `/v1/chat/stream` | Chat RAG con SSE |
| POST | `/v1/chat/invitado` | Chat sin autenticación |
| POST | `/v1/admin/ingesta` | Subir PDF → Qdrant |
| GET | `/v1/permisos/{id}` | Permisos del usuario |
| GET | `/health` | Health check |

Documentación interactiva: `http://localhost:8000/docs`

## Estructura

```
Backend/
├── main.py
├── app/
│   ├── api/v1/routes/   → Endpoints por dominio
│   ├── core/            → Settings, DB
│   ├── middleware/       → Auth JWT
│   ├── models/          → SQLAlchemy
│   ├── schemas/         → Pydantic
│   └── services/        → Lógica de negocio
├── alembic/             → Migraciones
└── requirements.txt
```

## Producción (EC2)

```bash
sudo systemctl start fastapi
sudo systemctl enable fastapi   # arranque automático
sudo systemctl status fastapi
sudo journalctl -u fastapi -n 50 --no-pager
```
