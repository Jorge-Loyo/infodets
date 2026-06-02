# Guía: Deploy Local con URL Pública (Cloudflare Tunnel)

## Requisitos de la VM
- Ubuntu 22.04+ (o cualquier Linux con Docker)
- Docker + Docker Compose instalados
- 4GB RAM mínimo
- 20GB disco

## Paso 1 — Instalar Docker (si no está)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Cerrar y abrir sesión para que tome efecto
```

## Paso 2 — Clonar el proyecto

```bash
git clone https://github.com/Jorge-Loyo/infodets.git
cd infodets
```

## Paso 3 — Levantar todo

```bash
docker-compose -f docker-compose.local.yml up --build -d
```

Esto levanta:
- PostgreSQL 17 en puerto 5432
- Qdrant en puerto 6333
- Backend (FastAPI) en puerto 8000
- Frontend (Next.js) en puerto 3000

Verificar:
```bash
docker ps
curl http://localhost:8000/docs
curl http://localhost:3000
```

## Paso 4 — Correr migraciones (primera vez)

```bash
docker exec infodets-backend alembic upgrade head
```

## Paso 5 — Instalar Cloudflare Tunnel

```bash
# Instalar cloudflared
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared jammy main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared
```

## Paso 6 — Exponer con URL pública (modo rápido sin cuenta)

```bash
# Frontend (URL pública para la profe)
cloudflared tunnel --url http://localhost:3000
```

Te va a dar una URL tipo: `https://random-words.trycloudflare.com`

Esa URL es pública y funciona desde cualquier navegador.

> ⚠️ Esta URL cambia cada vez que reiniciás cloudflared. Si querés URL fija, necesitás cuenta de Cloudflare (gratis).

## Paso 6b — URL fija con cuenta Cloudflare (opcional)

```bash
cloudflared tunnel login
cloudflared tunnel create infodets
cloudflared tunnel route dns infodets infodets.tudominio.com

# Crear config
cat > ~/.cloudflared/config.yml << EOF
tunnel: infodets
credentials-file: /home/$USER/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: infodets.tudominio.com
    service: http://localhost:3000
  - hostname: api-infodets.tudominio.com
    service: http://localhost:8000
  - service: http_status:404
EOF

# Correr como servicio
sudo cloudflared service install
sudo systemctl start cloudflared
```

## Comandos útiles

```bash
# Ver logs
docker-compose -f docker-compose.local.yml logs -f backend

# Reiniciar todo
docker-compose -f docker-compose.local.yml restart

# Parar todo
docker-compose -f docker-compose.local.yml down

# Parar y borrar datos
docker-compose -f docker-compose.local.yml down -v
```

## Notas
- La PC/VM debe estar prendida para que funcione
- Cognito sigue funcionando (es servicio cloud de AWS, independiente del EC2)
- Los datos se guardan en Docker volumes (persisten)
- Si querés migrar los documentos del EC2, exportar de PostgreSQL e importar acá
