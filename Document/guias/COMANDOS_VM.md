# 🖥️ Comandos de Conexión a la VM (VirtualBox)

## Conexión SSH

```bash
ssh infodets@192.168.56.101
```

> Contraseña: la que configuraste al instalar Ubuntu Server

---

## Comandos útiles en la VM

### Ver estado de los containers

```bash
docker compose -f ~/infodets/docker-compose.standalone.yml ps
```

### Ver logs del backend

```bash
docker logs infodets-backend --tail 50
```

### Ver logs del frontend

```bash
docker logs infodets-frontend --tail 50
```

### Ver estado del tunnel (Cloudflare)

```bash
sudo systemctl status cloudflared
```

### Reiniciar un servicio específico

```bash
docker compose -f ~/infodets/docker-compose.standalone.yml restart backend
docker compose -f ~/infodets/docker-compose.standalone.yml restart frontend
```

### Rebuildar después de un git pull

```bash
cd ~/infodets
git pull origin Testeo
docker compose -f docker-compose.standalone.yml up -d --build frontend
docker compose -f docker-compose.standalone.yml up -d --build backend
```

### Reiniciar todo

```bash
docker compose -f ~/infodets/docker-compose.standalone.yml down
docker compose -f ~/infodets/docker-compose.standalone.yml up -d
```

### Reiniciar tunnel de Cloudflare

```bash
sudo systemctl restart cloudflared
```

---

## URLs públicas

| Servicio | URL |
|----------|-----|
| Frontend | https://agilizesoluciones.uk |
| API | https://api.agilizesoluciones.uk |
| API Docs | https://api.agilizesoluciones.uk/docs |
| n8n | https://n8n.agilizesoluciones.uk |

## URLs locales (desde tu PC)

| Servicio | URL |
|----------|-----|
| Frontend | http://192.168.56.101 |
| Backend | http://192.168.56.101:8000 |
| Docs | http://192.168.56.101:8000/docs |
| Qdrant | http://192.168.56.101:6333/dashboard |
| n8n | http://192.168.56.101:5678 |

---

## Conexión al EC2 (AWS)

```bash
ssh -i "/c/Desarrollo/Popurri/Key/keyinfodets.pem" ubuntu@32.192.124.14
```

### Túnel SSH a RDS (desde Git Bash, puerto 5433)

```bash
ssh -i "/c/Desarrollo/Popurri/Key/keyinfodets.pem" -L 5433:infodets-db.cjgfkaqwabgp.us-east-1.rds.amazonaws.com:5432 ubuntu@32.192.124.14 -N
```

### Túnel SSH a Qdrant de AWS

```bash
ssh -i "/c/Desarrollo/Popurri/Key/keyinfodets.pem" -L 6334:localhost:6333 ubuntu@32.192.124.14 -N
```

---

## Copiar archivos a la VM (SCP)

```bash
scp archivo.txt infodets@192.168.56.101:~/
```

## Copiar archivos desde EC2

```bash
scp -i "/c/Desarrollo/Popurri/Key/keyinfodets.pem" ubuntu@32.192.124.14:~/archivo.txt .
```
