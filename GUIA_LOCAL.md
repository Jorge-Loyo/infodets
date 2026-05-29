# Guía: Levantar INFODETS en Local (Windows + Git Bash)

## Requisitos

- Python 3.13 instalado en `C:\Users\<tu_usuario>\AppData\Local\Programs\Python\Python313\`
- Node.js 20+
- Git Bash
- Archivo `Backend/.env` configurado
- Clave SSH `keyinfodets.pem` para acceder al EC2

---

## Paso 1 — Abrir 4 terminales de Git Bash

Necesitás 4 terminales corriendo en paralelo:

| Terminal | Función |
|----------|---------|
| 1 | Túnel SSH a PostgreSQL (RDS) |
| 2 | Túnel SSH a Qdrant |
| 3 | Backend (FastAPI) |
| 4 | Frontend (Next.js) |

---

## Paso 2 — Terminal 1: Túnel SSH a PostgreSQL

```bash
ssh -i "/c/Desarrollo/Popurri/Key/keyinfodets.pem" -L 5432:infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com:5432 ubuntu@32.192.124.14 -N
```

> Se queda colgado sin output — eso es normal. Significa que el túnel está activo.

---

## Paso 3 — Terminal 2: Túnel SSH a Qdrant

```bash
ssh -i "/c/Desarrollo/Popurri/Key/keyinfodets.pem" -L 6333:localhost:6333 ubuntu@32.192.124.14 -N
```

> Igual que el anterior, se queda sin output.

---

## Paso 4 — Terminal 3: Backend (FastAPI)

```bash
cd /c/Desarrollo/infodets/Backend
source .venv/Scripts/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Si el entorno virtual no existe o está roto:

```bash
cd /c/Desarrollo/infodets/Backend
rm -rf .venv
/c/Users/jorge/AppData/Local/Programs/Python/Python313/python.exe -m venv .venv
source .venv/Scripts/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> Deberías ver: `Uvicorn running on http://0.0.0.0:8000`

---

## Paso 5 — Terminal 4: Frontend (Next.js)

```bash
cd /c/Desarrollo/infodets/Frontend/infodets-web
npm install
npm run dev
```

> Deberías ver: `Ready in Xms` y `Local: http://localhost:3000`

---

## Verificar que todo funciona

| Servicio | URL | Esperado |
|----------|-----|----------|
| Frontend | http://localhost:3000 | Página de login/inicio |
| Backend API | http://localhost:8000/docs | Swagger UI |
| PostgreSQL | Túnel en terminal 1 activo | Sin errores |
| Qdrant | http://localhost:6333/collections | JSON con colecciones |

---

## Problemas comunes

### `pip: command not found` o `uvicorn: command not found`
El venv no se activó correctamente. Usá siempre:
```bash
source .venv/Scripts/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### `[WinError 10054]` en los túneles SSH
Qdrant no está corriendo en el EC2. Conectate al servidor y levantalo:
```bash
ssh -i "/c/Desarrollo/Popurri/Key/keyinfodets.pem" ubuntu@32.192.124.14
sudo docker run -d --name qdrant -p 6333:6333 qdrant/qdrant
```

### `column documentos.X does not exist`
Falta correr la migración de base de datos:
```bash
cd /c/Desarrollo/infodets/Backend
source .venv/Scripts/activate
python -m alembic upgrade head
```

### Frontend apunta a producción en vez de localhost
Verificar que `Frontend/infodets-web/.env.local` tenga:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/v1
```

### PDF corrupto al subir (`'/Root'`)
El archivo PDF está dañado. Abrilo en un visor y re-exportalo como PDF nuevo.

---

## Detener todo

- En cada terminal: `Ctrl + C`
- Para desactivar el venv: `deactivate`

---

## Deploy a producción

```bash
cd /c/Desarrollo/infodets
git add .
git commit -m "descripción del cambio"
git push origin Testeo

# Merge a main (deploy automático)
git checkout main
git merge Testeo
git push origin main
git checkout Testeo
```

> El deploy a producción es automático al pushear a `main` via GitHub Actions.
