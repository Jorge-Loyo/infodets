<div align="center">

<!-- Animated Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a73e8,100:00c9ff&height=220&section=header&text=INFODETS&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Sistema%20de%20Gestión%20de%20Conocimiento%20Dinámico&descSize=18&descAlignY=55" width="100%"/>

<br/>

<!-- Typing Animation -->

<a href="https://git.io/typing-svg"><img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=1A73E8&center=true&vCenter=true&multiline=true&repeat=true&width=700&height=80&lines=IA+%2B+RAG+para+consultas+ciudadanas+inteligentes;Soberanía+de+datos+%7C+Mejora+continua+%7C+Fuentes+oficiales" alt="Typing SVG" /></a>

<br/>

<!-- Badges -->

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![AWS](https://img.shields.io/badge/AWS-EC2%20|%20RDS%20|%20Cognito-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

<br/>

[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)]()
[![Branch](https://img.shields.io/badge/Branch-Testeo-blue?style=flat-square&logo=git)]()
[![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=flat-square)]()

</div>

---

## 🧠 ¿Qué es INFODETS?

**INFODETS** es un sistema inteligente de gestión de conocimiento diseñado para entidades públicas. Utiliza **Inteligencia Artificial** y **bases de datos vectoriales (RAG)** para responder consultas ciudadanas con fuentes oficiales verificables.

<div align="center">

```mermaid
graph LR
    A[👤 Usuario] -->|Consulta| B[🤖 Chat IA]
    B -->|Busca| C[📚 Base Vectorial]
    C -->|Contexto| D[🧠 Gemini/Groq]
    D -->|Respuesta + Fuentes| A
    E[📄 Documentos] -->|Ingesta| C
    F[🔄 Loop Mejora] -->|Detecta vacíos| E
```

</div>

### ✨ Características principales

|        Funcionalidad         | Descripción                                                                     |
| :--------------------------: | :------------------------------------------------------------------------------ |
|       🤖 **Chat RAG**        | Respuestas inteligentes basadas en documentos oficiales con citación de fuentes |
| 📄 **Ingesta de documentos** | Carga y procesamiento automático de PDFs con embeddings vectoriales             |
|    🔄 **Mejora continua**    | Detección automática de vacíos de información y sugerencias de ingesta          |
|  👥 **Gestión de usuarios**  | Roles, perfiles y permisos granulares con autenticación Cognito                 |
|       📰 **Noticias**        | Sistema de publicaciones institucionales con imágenes en Cloudinary             |
|    🎨 **Personalización**    | Temas, colores y logo configurables por el administrador                        |
|        🎫 **Tickets**        | Sistema de consultas formales con seguimiento                                   |
|       📊 **Dashboard**       | Métricas y estadísticas del sistema                                             |

---

## 🏗️ Arquitectura

<div align="center">

```mermaid
graph TB
    subgraph Frontend["🖥️ Frontend — Next.js 16"]
        UI[React 19 + Mantine UI]
        Store[Zustand State]
    end

    subgraph Backend["⚙️ Backend — FastAPI"]
        API[REST API]
        RAG[Motor RAG]
        Auth[JWT + Cognito]
    end

    subgraph Data["💾 Datos"]
        RDS[(PostgreSQL RDS)]
        Qdrant[(Qdrant Vectorial)]
        Cloud[☁️ Cloudinary]
    end

    subgraph AI["🧠 IA"]
        Gemini[Google Gemini]
        Groq[Groq - Fallback]
    end

    subgraph Infra["☁️ AWS"]
        EC2[EC2 t3.small]
        Cognito[Cognito]
        N8N[n8n Workflows]
    end

    UI --> API
    API --> RAG
    RAG --> Qdrant
    RAG --> Gemini
    RAG --> Groq
    API --> RDS
    API --> Auth
    Auth --> Cognito
    API --> Cloud
    API --> N8N
```

</div>

---

## 🛠️ Stack Tecnológico

<div align="center">

|        Capa        |          Tecnología          |    Versión    |
| :----------------: | :--------------------------: | :-----------: |
|    🖥️ Frontend     | Next.js + React + TypeScript | 16 / 19 / 5.0 |
|     ⚙️ Backend     |       FastAPI + Python       | 0.115 / 3.13  |
|  💾 Base de datos  |      AWS RDS PostgreSQL      |      17       |
| 🔍 Base vectorial  |     Qdrant (self-hosted)     |    Latest     |
|  🧠 IA Principal   |        Google Gemini         |      2.0      |
|   🧠 IA Fallback   |         Groq (Llama)         |    Latest     |
|  🔐 Autenticación  |   AWS Cognito + JWT HS256    |       —       |
|    🖼️ Imágenes     |        Cloudinary CDN        |       —       |
|  🔄 Orquestación   |         n8n (Docker)         |    Latest     |
| ☁️ Infraestructura |   AWS EC2 + RDS + Cognito    |       —       |

</div>

---

## 🚀 Inicio Rápido

### Prerequisitos

| Herramienta | Versión  |                Instalación                 |
| :---------: | :------: | :----------------------------------------: |
|     Git     | Reciente | [Descargar](https://git-scm.com/downloads) |
|   Node.js   |   20+    |      [Descargar](https://nodejs.org)       |
|   Python    |   3.13   | [Descargar](https://python.org/downloads)  |

> ⚠️ Al instalar Python, marcar **"Add Python to PATH"**

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/Jorge-Loyo/infodets.git
cd infodets
git checkout Testeo
```

### 2️⃣ Túneles SSH (requeridos para desarrollo local)

```bash
# Terminal 1 — Base de datos
ssh -i "ruta/keyinfodets.pem" -L 5432:infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com:5432 ubuntu@32.192.124.14 -N

# Terminal 2 — Qdrant
ssh -i "ruta/keyinfodets.pem" -L 6333:localhost:6333 ubuntu@32.192.124.14 -N
```

### 3️⃣ Backend

```bash
cd Backend
py -m venv venv
source venv/Scripts/activate    # Windows Git Bash
pip install -r requirements.txt
uvicorn main:app --reload
```

### 4️⃣ Frontend

```bash
cd Frontend/infodets-web
npm install
npm run dev
```

### 5️⃣ Verificar

|    Servicio    |            URL             |
| :------------: | :------------------------: |
|  🖥️ Frontend   |   http://localhost:3000    |
| ⚙️ Backend API |   http://localhost:8000    |
|  📖 Docs API   | http://localhost:8000/docs |

---

## 🐳 Docker

```bash
# Desarrollo (hot-reload)
docker-compose -f docker-compose.dev.yml up --build

# Producción
docker-compose up --build
```

---

## 🌐 Producción

<div align="center">

|  Servicio   |             URL             |  Motor  |
| :---------: | :-------------------------: | :-----: |
| 🖥️ Frontend | `http://32.192.124.14:3000` | Docker  |
| ⚙️ Backend  | `http://32.192.124.14:8000` | systemd |
|  🔍 Qdrant  | `http://32.192.124.14:6333` | Docker  |
|   🔄 n8n    | `http://32.192.124.14:5678` | Docker  |

</div>

### Deploy al servidor

```bash
# Conectar al EC2
ssh -i "keyinfodets.pem" ubuntu@32.192.124.14

# Actualizar backend
cd /home/ubuntu/infodets
git pull origin main
source Backend/venv/bin/activate
pip install -r Backend/requirements.txt
sudo systemctl restart fastapi

# Actualizar frontend
docker restart infodets-frontend
```

---

## 📁 Estructura del Proyecto

```
infodets/
├── 🔙 Backend/
│   ├── app/
│   │   ├── api/v1/routes/     → Endpoints REST
│   │   ├── core/              → Config, DB, Settings
│   │   ├── middleware/        → Auth, permisos
│   │   ├── models/            → SQLAlchemy models
│   │   ├── schemas/           → Pydantic schemas
│   │   └── services/          → Lógica de negocio (RAG, IA, Cloudinary)
│   ├── alembic/               → Migraciones DB
│   ├── tests/                 → Tests unitarios
│   ├── main.py                → Entry point
│   └── requirements.txt
│
├── 🖥️ Frontend/infodets-web/
│   ├── src/
│   │   ├── app/               → Pages (App Router)
│   │   ├── components/        → Componentes reutilizables
│   │   ├── hooks/             → Custom hooks
│   │   ├── services/api/      → Servicios HTTP
│   │   ├── store/             → Zustand stores
│   │   └── types/             → TypeScript types
│   └── package.json
│
├── 📄 Document/               → Documentación técnica
├── 📊 Data/                   → Scripts de datos
├── 🐳 docker-compose.yml      → Producción
└── 🐳 docker-compose.dev.yml  → Desarrollo
```

---

## 🔐 Variables de Entorno

Crear `Backend/.env` con las siguientes variables (solicitar valores al líder):

```env
# AWS Cognito
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=<pool_id>
COGNITO_CLIENT_ID=<client_id>
COGNITO_CLIENT_SECRET=<secret>

# App
APP_ENV=development
SECRET_KEY=<secret_key>
FRONTEND_URL=http://localhost:3000

# Base de datos
DATABASE_URL=postgresql://user:pass@localhost:5432/infodets

# IA
GEMINI_API_KEY=<key>
GROQ_API_KEY=<key>

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=infodets_docs

# Cloudinary (imágenes persistentes)
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

# n8n
N8N_URL=http://localhost:5678

# AWS Credentials (temporales — laboratorio)
AWS_ACCESS_KEY_ID=<temporal>
AWS_SECRET_ACCESS_KEY=<temporal>
AWS_SESSION_TOKEN=<temporal>
```

---

## 🌿 Ramas

|      Rama       | Propósito                     |
| :-------------: | :---------------------------- |
|     `main`      | 🚀 Producción — deploy al EC2 |
|    `Testeo`     | 🧪 Rama activa de desarrollo  |
|   `Frontend`    | 🖥️ Desarrollo UI              |
|    `Backend`    | ⚙️ Desarrollo API             |
| `Configuracion` | 🔧 Infraestructura            |
|     `Data`      | 📊 Datos y modelos IA         |

---

## 📖 Documentación

| Documento                                                            | Descripción                  |
| :------------------------------------------------------------------- | :--------------------------- |
| [📋 Guía de Instalación](Document/guias/GUIA_INSTALACION.md)          | Setup completo paso a paso   |
| [📐 Plan de Desarrollo](Document/planificacion/PLAN_DESARROLLO_EQUIPO.md) | Roadmap y sprints            |
| [🧠 Mejoras RAG](Document/planificacion/RAG_Mejoras_Por_Fases.md)     | Fases de mejora del motor IA |
| [🖥️ Comandos VM](Document/guias/COMANDOS_VM.md)                      | Conexión y operación de la VM |

---

## 👥 Equipo

<div align="center">

|                 Rol                 |   Responsable    |
| :---------------------------------: | :--------------: |
| Especialista Funcional / Full Stack |  Fernando Moya   |
|       Tech Lead / Full Stack        | Santiago Isbaner |
|    Product Manager / Full Stack     |    Jorge Loyo    |

</div>

---

<div align="center">

<!-- Footer Wave -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a73e8,100:00c9ff&height=120&section=footer" width="100%"/>

<br/>

**INFODETS** — Sistema de Gestión de Conocimiento Dinámico

_Desarrollado con ❤️ para la gestión pública inteligente_

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github)](https://github.com/Jorge-Loyo/infodets)

</div>
