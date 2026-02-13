# ⚡ GUÍA RÁPIDA DE DEPLOYMENT

## 🎯 Lo más rápido posible

### 1️⃣ Railway (5 minutos) ⭐ RECOMENDADO

```bash
# 1. Instala Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Inicializar proyecto
railway init

# 4. Agregar PostgreSQL
railway add

# 5. Deploy
railway up

# 6. Abrir en navegador
railway open
```

**Después del deploy:**
```bash
# Inicializar base de datos
railway run npm run setup-db
```

✅ **Tu app está en:** `https://tu-app.railway.app`

---

### 2️⃣ Render (5 minutos)

1. Ve a https://render.com
2. New Web Service → Conecta tu repo
3. Build: `npm install`
4. Start: `node src/server.js`
5. Add PostgreSQL
6. Conecta DB al servicio
7. Deploy!

**Variables de entorno necesarias:**
```
NODE_ENV=production
JWT_SECRET=[genera uno seguro]
DATABASE_URL=[automático de Render]
```

Después del deploy → Shell → `npm run setup-db`

✅ **Tu app está en:** `https://tu-app.onrender.com`

---

### 3️⃣ Heroku (10 minutos)

```bash
# 1. Login
heroku login

# 2. Crear app
heroku create nombre-de-tu-app

# 3. Agregar PostgreSQL
heroku addons:create heroku-postgresql:mini

# 4. Variables de entorno
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 5. Deploy
git push heroku main

# 6. Inicializar DB
heroku run npm run setup-db

# 7. Abrir
heroku open
```

✅ **Tu app está en:** `https://nombre-de-tu-app.herokuapp.com`

---

### 4️⃣ DigitalOcean (Droplet básico)

```bash
# 1. Crea un Droplet Ubuntu 22.04
# 2. SSH al servidor
ssh root@tu-ip

# 3. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 5. Configurar DB
sudo -u postgres psql
CREATE DATABASE electoral_system;
CREATE USER electoral WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE electoral_system TO electoral;
\q

# 6. Clonar proyecto
cd /var/www
git clone tu-repo electoral-system
cd electoral-system

# 7. Instalar dependencias
npm install

# 8. Configurar .env
nano .env
# Pega tu configuración

# 9. Inicializar DB
npm run setup-db

# 10. Instalar PM2
sudo npm install -g pm2

# 11. Iniciar
pm2 start src/server.js --name electoral
pm2 save
pm2 startup

# 12. Instalar Nginx
sudo apt install nginx -y

# 13. Configurar proxy reverso
sudo nano /etc/nginx/sites-available/electoral
```

Contenido:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar
sudo ln -s /etc/nginx/sites-available/electoral /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL con Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.com
```

✅ **Tu app está en:** `https://tu-dominio.com`

---

## 🔑 Variables de Entorno Importantes

```env
# Básicas
NODE_ENV=production
PORT=3000

# Base de datos (individual O DATABASE_URL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=electoral_system
DB_USER=postgres
DB_PASSWORD=tu_password

# O si usas DATABASE_URL (cloud)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Seguridad (GENERA UNO NUEVO)
JWT_SECRET=tu_secreto_de_64_caracteres_minimo_aleatorio

# Opcional pero recomendado
GOOGLE_MAPS_API_KEY=tu_api_key
```

---

## 🚨 Después de cada Deploy

1. **Acceder a tu app**
2. **Login:** admin / Admin123!
3. **CAMBIAR PASSWORD inmediatamente**
4. **Importar tus datos** (Excel)
5. **Crear usuarios contadores**

---

## 🆘 Troubleshooting Rápido

### Error: Cannot connect to database
- Verifica DATABASE_URL o DB_* variables
- Asegúrate que PostgreSQL esté corriendo
- Verifica firewall/security groups

### Error: Port already in use
- Cambia PORT en .env
- O mata el proceso: `lsof -ti:3000 | xargs kill -9`

### App funciona pero sin datos
- Ejecuta: `npm run setup-db`
- Verifica que la DB esté vacía antes

### WebSocket no conecta
- Verifica que el proxy pase las cabeceras Upgrade
- En Nginx necesitas la config especial para /socket.io/

---

## 📚 Más Información

- **Guía Completa:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Instalación Local:** [INSTALLATION.md](INSTALLATION.md)  
- **Configuración:** [CONFIGURATION.md](CONFIGURATION.md)
- **Seguridad:** [SECURITY.md](SECURITY.md)

---

**¿Listo?** Elige una opción y en minutos tendrás tu sistema electoral en producción! 🚀
