# Deploy 24/7 (1 mes) en VPS con Docker

Esta opción es la más rentable para tu presupuesto: 1 VPS con app + PostgreSQL + backups diarios.

## 1) Requisitos del VPS

- Ubuntu 22.04
- 2 vCPU, 4 GB RAM (mínimo recomendado)
- 50 GB SSD
- Dominio opcional (si no, puedes usar IP)

## 2) Instalar Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Cierra sesión SSH y vuelve a entrar.

## 3) Subir proyecto al VPS

```bash
git clone TU_REPO_GITHUB
cd epic\ voation
cp .env.vps.example .env
nano .env
```

Configura al menos:
- `POSTGRES_PASSWORD`
- `JWT_SECRET`

## 4) Levantar servicios 24/7

```bash
docker compose -f docker-compose.vps.yml up -d --build
```

## 5) Inicializar esquema (solo primera vez)

⚠️ Esto crea esquema desde `src/database/schema.sql`.

```bash
docker compose -f docker-compose.vps.yml exec app node src/database/setup.js
```

## 6) Cargar tus excels (si los incluyes en el servidor)

```bash
docker compose -f docker-compose.vps.yml exec app node src/database/import-mounted-excels.js
docker compose -f docker-compose.vps.yml exec app node src/database/reset-contadores-por-sede.js
docker compose -f docker-compose.vps.yml exec app node src/database/exportar-contadores-txt.js
```

## 7) Verificación

```bash
curl -s http://127.0.0.1:3000/health
```

## 8) Mantener activo 24/7

- `restart: unless-stopped` ya está configurado.
- Backup diario en carpeta `./backups` del servidor.

## 9) Comandos útiles

```bash
# Ver logs
docker compose -f docker-compose.vps.yml logs -f app

# Reiniciar app
docker compose -f docker-compose.vps.yml restart app

# Estado
docker compose -f docker-compose.vps.yml ps

# Apagar
docker compose -f docker-compose.vps.yml down
```
