# INFODETS

Sistema de Gestión de Conocimiento Dinámico para entidades públicas. Utiliza IA y bases de datos vectoriales (RAG) para responder consultas ciudadanas con fuentes oficiales, asegurando la soberanía de datos. Cuenta con un motor de mejora continua que detecta vacíos de información y facilita la ingesta de nuevas normativas.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Backend | FastAPI (Python 3.13) |
| Base de datos | AWS RDS PostgreSQL 17 |
| Base vectorial | Qdrant (self-hosted en EC2) |
| IA | Google Gemini + Groq (fallback) |
| Autenticación | AWS Cognito + JWT HS256 |
| Orquestación | n8n (Docker) |
| Infraestructura | AWS EC2 + RDS + Cognito |

## Inicio rápido

### Local (un solo comando)

**Windows:**
```bat
start-local.bat
```

**Git Bash / Linux / Mac:**
```bash
./start-local.sh
```

### Docker
```bash
# Desarrollo (hot-reload)
docker-compose -f docker-compose.dev.yml up --build

# Producción
docker-compose up --build
```

## URLs

| Servicio | Local | Producción |
|---|---|---|
| Frontend | http://localhost:3000 | http://32.192.124.14:3000 |
| Backend API | http://localhost:8000 | http://32.192.124.14:8000 |
| Docs API | http://localhost:8000/docs | http://32.192.124.14:8000/docs |

## Estructura

```
infodets/
├── Backend/          → FastAPI (Python)
├── Frontend/
│   └── infodets-web/ → Next.js
├── Document/         → Documentación técnica
├── .github/workflows/→ CI/CD GitHub Actions
├── docker-compose.yml
└── start-local.bat / start-local.sh
```

## Documentación

- [Guía de instalación](Document/GUIA_INSTALACION.md)
- [Stack tecnológico](Document/STACK.md)
- [Plan de desarrollo](Document/PLAN_DESARROLLO_EQUIPO.md)
- [Docker](Document/DOCKER.md)

## Requisitos previos

- Python 3.13
- Node.js 20+
- Archivo `Backend/.env` (solicitar al líder del proyecto)
- Tunnels SSH activos para RDS y Qdrant (ver [Guía de instalación](Document/GUIA_INSTALACION.md))

## Ramas

| Rama | Propósito |
|---|---|
| `main` | Producción — deploy automático al EC2 |
| `Testeo` | Rama activa de desarrollo |
| `Frontend` | Desarrollo Frontend |
| `Backend` | Desarrollo Backend |
| `Configuracion` | Infraestructura |
| `Data` | Datos y modelos IA |
