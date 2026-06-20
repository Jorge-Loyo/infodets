#!/bin/bash
# /home/infodets/deploy.sh
# Auto-deploy script triggered by GitHub webhook

REPO_DIR="/home/infodets/infodets"
COMPOSE_FILE="docker-compose.standalone.yml"
LOG_FILE="/home/infodets/deploy.log"

echo "$(date) - Deploy iniciado..." >> "$LOG_FILE"

cd "$REPO_DIR" || exit 1

# Descartar cambios locales y pull (preservar .env.standalone)
cp Backend/.env.standalone /tmp/.env.standalone.bak 2>/dev/null
git reset --hard HEAD
git pull origin main >> "$LOG_FILE" 2>&1
cp /tmp/.env.standalone.bak Backend/.env.standalone 2>/dev/null

# Rebuild y restart containers
docker compose -f "$COMPOSE_FILE" up -d --build backend >> "$LOG_FILE" 2>&1

# Correr migraciones
docker exec infodets-backend alembic upgrade head >> "$LOG_FILE" 2>&1 || true

docker compose -f "$COMPOSE_FILE" up -d --build frontend >> "$LOG_FILE" 2>&1

# Limpiar imágenes viejas
docker image prune -f >> "$LOG_FILE" 2>&1

echo "$(date) - Deploy completado ✅" >> "$LOG_FILE"
