# GUÍA DE INSTALACIÓN — INFODETS
## Cómo correr el proyecto en una máquina nueva

---

> **Proyecto:** INFODETS — Sistema de Gestión de Conocimiento Dinámico
> **Repositorio:** https://github.com/Jorge-Loyo/infodets
> **Rama principal de desarrollo:** `Frontend`

---

## OPCIÓN A — Instalación manual (recomendada para desarrollo)

### Prerequisitos

Instalar en la máquina nueva antes de comenzar:

| Herramienta | Versión | Descarga |
|---|---|---|
| Git | Cualquier versión reciente | https://git-scm.com/downloads |
| Node.js | 20 o superior | https://nodejs.org |
| Python | 3.13 | https://www.python.org/downloads/ |
| Docker Desktop | Cualquier versión reciente | https://www.docker.com/products/docker-desktop/ |

> Durante la instalación de Python marcar obligatoriamente: **Add Python to PATH**

---

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/Jorge-Loyo/infodets.git
cd infodets
git checkout Frontend
```

---

### Paso 2 — Configurar el Front-End

```bash
cd Frontend/infodets-web
npm install
```

Crear el archivo `.env.local` dentro de `Frontend/infodets-web/` con este contenido:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/v1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_uOuYTO6Ce
NEXT_PUBLIC_COGNITO_CLIENT_ID=6sr8e9s203gb8reco11d9gsal1
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_REDIRECT_SIGN_IN=http://localhost:3000/consulta
NEXT_PUBLIC_REDIRECT_SIGN_OUT=http://localhost:3000/login
```

Correr el Front-End:

```bash
npm run dev
```

---

### Paso 3 — Configurar el Back-End

```bash
cd /c/git/infodets/Backend
py -m venv venv
source venv/Scripts/activate      # Windows Git Bash
# source venv/bin/activate         # Mac / Linux
pip install -r requirements.txt
```

Solicitar el archivo `.env` al líder del proyecto — contiene credenciales sensibles y no se sube a Git.
Copiarlo en `Backend/.env`.

Correr el Back-End:

```bash
uvicorn main:app --reload
```

---

### Paso 4 — Verificar que todo funciona

Abrir en el navegador:

| Servicio | URL |
|---|---|
| Front-End | http://localhost:3000 |
| Back-End API | http://localhost:8000 |
| Documentación API | http://localhost:8000/docs |

---

## OPCIÓN B — Docker (más simple, recomendada para pruebas rápidas)

Solo necesitas tener **Docker Desktop** instalado y el archivo `.env` del Back-End.

```bash
git clone https://github.com/Jorge-Loyo/infodets.git
cd infodets
git checkout Frontend
```

Solicitar el archivo `.env` al líder del proyecto y copiarlo en `Backend/.env`.

Levantar todo con un solo comando:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

Docker instala automáticamente todas las dependencias de Node.js y Python. No necesitas instalarlas manualmente.

Verificar en el navegador:

| Servicio | URL |
|---|---|
| Front-End | http://localhost:3000 |
| Back-End API | http://localhost:8000 |
| Documentación API | http://localhost:8000/docs |

Para detener:

```bash
docker-compose down
```

---

## INFRAESTRUCTURA AWS (solo para referencia)

Los servicios en la nube ya están configurados y corriendo:

| Servicio | URL / Endpoint |
|---|---|
| Servidor EC2 | `32.192.124.14` |
| n8n | http://32.192.124.14:5678 |
| RDS PostgreSQL | `infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com` |
| Cognito User Pool | `us-east-1_uOuYTO6Ce` |

Para conectarse al servidor EC2:

```bash
ssh -i "keyinfodets.pem" ubuntu@32.192.124.14
```

> El archivo `keyinfodets.pem` debe solicitarse al líder del proyecto.

Para conectarse a la base de datos RDS desde VS Code (extensión PostgreSQL), primero abrir el túnel SSH en una terminal y dejarlo corriendo:

```bash
ssh -i "keyinfodets.pem" -L 5432:infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com:5432 ubuntu@32.192.124.14 -N
```

Luego conectarse con:

| Campo | Valor |
|---|---|
| Host | `127.0.0.1` |
| Port | `5432` |
| Database | `infodets` |
| Username | `infodets_admin` |
| SSL | `require` |

---

## ARCHIVOS SENSIBLES — SOLICITAR AL LÍDER DEL PROYECTO

Estos archivos no están en Git por seguridad:

| Archivo | Contiene |
|---|---|
| `Backend/.env` | Credenciales de Cognito, RDS, n8n y claves secretas |
| `keyinfodets.pem` | Clave SSH para acceder al EC2 |

---

*INFODETS — Sistema de Gestión de Conocimiento Dinámico*
*Guía de instalación v1.0*
