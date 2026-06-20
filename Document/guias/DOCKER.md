# INFODETS — Docker

## Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Archivo `Backend/.env` con las variables de Cognito (pedirlo al líder del proyecto)

---

## Comandos

### Desarrollo (con hot-reload)
Usar cuando estás desarrollando y quieres ver los cambios en tiempo real:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Producción
Usar para probar la build final o distribuir:
```bash
docker-compose up --build
```

### Detener los contenedores
```bash
docker-compose down
```

### Ver logs en tiempo real
```bash
# Todos los servicios
docker-compose logs -f

# Solo el back-end
docker-compose logs -f backend

# Solo el front-end
docker-compose logs -f frontend
```

### Reconstruir desde cero (si hay cambios en dependencias)
```bash
docker-compose down --volumes
docker-compose up --build
```

---

## URLs una vez levantado

| Servicio | URL |
|---|---|
| Front-End | http://localhost:3000 |
| Back-End API | http://localhost:8000 |
| Documentación API | http://localhost:8000/docs |

---

## Variables de entorno

El archivo `Backend/.env` **no se sube a Git** por seguridad.
Solicitar al líder del proyecto el archivo con las credenciales de Cognito.

El archivo debe tener esta estructura:
```env
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=<valor>
COGNITO_CLIENT_ID=<valor>
COGNITO_CLIENT_SECRET=<valor>
FRONTEND_URL=http://localhost:3000
CLOUDFRONT_URL=<valor>
REDIRECT_URI=http://localhost:8000/v1/auth/callback
APP_ENV=development
SECRET_KEY=<valor>
```
