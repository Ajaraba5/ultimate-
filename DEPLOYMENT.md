# 🚀 GUÍA DE DEPLOYMENT - SISTEMA DE VOTACIÓN ELECTORAL
## Cómo montar el sistema en un host de producción

---

## 📋 ÍNDICE

1. [Preparación Pre-Deployment](#preparación-pre-deployment)
2. [Opción 1: VPS/Servidor Dedicado (Recomendado)](#opción-1-vpsservidor-dedicado)
3. [Opción 2: Heroku](#opción-2-heroku)
4. [Opción 3: Railway](#opción-3-railway)
5. [Opción 4: Render](#opción-4-render)
6. [Opción 5: DigitalOcean App Platform](#opción-5-digitalocean-app-platform)
7. [Configuración de Base de Datos en la Nube](#configuración-de-base-de-datos)
8. [Configuración de Dominio](#configuración-de-dominio)
9. [Seguridad en Producción](#seguridad-en-producción)

---

## 🎯 PREPARACIÓN PRE-DEPLOYMENT

### 1. Checklist antes de desplegar

- [ ] Base de datos PostgreSQL configurada
- [ ] Variables de entorno actualizadas
- [ ] Contraseñas de admin cambiadas
- [ ] JWT_SECRET generado (64+ caracteres aleatorios)
- [ ] NODE_ENV=production
- [ ] Puerto configurado (variable PORT)
- [ ] CORS configurado para tu dominio
- [ ] Google Maps API Key (opcional pero recomendado)

### 2. Generar JWT_SECRET seguro

**Linux/Mac/WSL:**
```bash
openssl rand -hex 64
```

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**PowerShell:**
```powershell
$bytes = New-Object byte[] 64
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[System.BitConverter]::ToString($bytes) -replace '-',''
```

### 3. Actualizar .env para producción

```env
NODE_ENV=production
PORT=3000
DB_HOST=tu-host-postgresql.com
DB_PORT=5432
DB_NAME=electoral_system
DB_USER=tu_usuario_db
DB_PASSWORD=tu_password_seguro
JWT_SECRET=tu_secret_generado_de_64_caracteres_minimo
GOOGLE_MAPS_API_KEY=tu_api_key_de_google_maps
```

---

## 🖥️ OPCIÓN 1: VPS/SERVIDOR DEDICADO (Recomendado)

**Proveedores:** DigitalOcean, Linode, Vultr, AWS EC2, Google Cloud Compute

### Ventajas
- ✅ Control total del servidor
- ✅ Mejor rendimiento
- ✅ Escalable
- ✅ Sin limitaciones

### 1.1. Conexión al servidor

```bash
ssh root@tu-servidor-ip
```

### 1.2. Instalar Node.js

**Ubuntu/Debian:**
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version
npm --version
```

**CentOS/RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### 1.3. Instalar PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Configurar PostgreSQL:**
```bash
sudo -u postgres psql

# Dentro de psql:
CREATE DATABASE electoral_system;
CREATE USER electoral_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE electoral_system TO electoral_user;
\q
```

### 1.4. Instalar PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 1.5. Subir código al servidor

**Opción A: Git (Recomendado)**
```bash
# En el servidor
cd /var/www
git clone https://tu-repositorio.git electoral-system
cd electoral-system
npm install --production
```

**Opción B: SCP/SFTP**
```bash
# Desde tu máquina local
scp -r "c:\Users\alejo\OneDrive\Desktop\epic voation" root@tu-ip:/var/www/electoral-system
```

### 1.6. Configurar variables de entorno

```bash
cd /var/www/electoral-system
nano .env
# Pega tu configuración de producción
# Ctrl+X, Y, Enter para guardar
```

### 1.7. Inicializar base de datos

```bash
npm run setup-db
```

### 1.8. Iniciar con PM2

```bash
# Iniciar aplicación
pm2 start src/server.js --name electoral-system

# Guardar configuración
pm2 save

# Auto-inicio en reboot
pm2 startup
# Ejecuta el comando que te muestre PM2

# Ver logs
pm2 logs electoral-system

# Ver estado
pm2 status
```

### 1.9. Configurar Nginx como Reverse Proxy

**Instalar Nginx:**
```bash
sudo apt install nginx -y
```

**Crear configuración:**
```bash
sudo nano /etc/nginx/sites-available/electoral-system
```

**Contenido del archivo:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

**Activar configuración:**
```bash
sudo ln -s /etc/nginx/sites-available/electoral-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 1.10. Configurar SSL (HTTPS) con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática (verificar)
sudo certbot renew --dry-run
```

### 1.11. Configurar Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
sudo ufw status
```

---

## 🎨 OPCIÓN 2: HEROKU

### Ventajas
- ✅ Deploy súper fácil
- ✅ Free tier disponible
- ✅ Escalado automático
- ✅ PostgreSQL incluido

### 2.1. Preparar proyecto

**Crear Procfile:**
```bash
echo "web: node src/server.js" > Procfile
```

**Asegurar que package.json tenga:**
```json
{
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  }
}
```

### 2.2. Deploy a Heroku

```bash
# Instalar Heroku CLI
# Windows: descargar de https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Crear app
heroku create nombre-de-tu-app

# Agregar PostgreSQL
heroku addons:create heroku-postgresql:mini

# Configurar variables de entorno
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=tu_secret_generado
heroku config:set GOOGLE_MAPS_API_KEY=tu_api_key

# Deploy
git init
git add .
git commit -m "Initial deployment"
git push heroku main

# Inicializar base de datos
heroku run npm run setup-db

# Ver logs
heroku logs --tail

# Abrir app
heroku open
```

### 2.3. Configurar dominio personalizado

```bash
heroku domains:add www.tu-dominio.com
# Heroku te dará un DNS target para configurar en tu proveedor de dominio
```

---

## 🚂 OPCIÓN 3: RAILWAY

### Ventajas
- ✅ Deploy muy simple
- ✅ PostgreSQL incluido
- ✅ Free tier generoso ($5 gratis/mes)
- ✅ Auto-deploy desde GitHub

### 3.1. Deploy con Railway

1. Ve a https://railway.app
2. Conecta tu cuenta GitHub
3. Click "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Railway detectará automáticamente Node.js
6. Agrega PostgreSQL: Click "+ New" → "Database" → "PostgreSQL"
7. Railway creará automáticamente DATABASE_URL

### 3.2. Configurar variables

En Railway dashboard → Variables:
```
NODE_ENV=production
JWT_SECRET=tu_secret_generado
GOOGLE_MAPS_API_KEY=tu_api_key
PORT=3000
```

Railway conectará automáticamente la DB con DATABASE_URL

### 3.3. Inicializar DB

En Railway → Tu servicio → Settings → Custom Start Command:
```bash
npm run setup-db && node src/server.js
```

(Solo la primera vez, luego cambiar a `node src/server.js`)

---

## 🎯 OPCIÓN 4: RENDER

### Ventajas
- ✅ Free tier incluido
- ✅ SSL automático
- ✅ PostgreSQL gratuito
- ✅ Auto-deploy desde Git

### 4.1. Deploy con Render

1. Ve a https://render.com
2. Sign up/Login
3. Click "New +" → "Web Service"
4. Conecta tu repositorio Git
5. Configuración:
   - **Name:** electoral-system
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`

### 4.2. Crear PostgreSQL

1. Dashboard → "New +" → "PostgreSQL"
2. Name: electoral-db
3. Plan: Free
4. Copia la "Internal Database URL"

### 4.3. Variables de entorno

En tu Web Service → Environment:
```
NODE_ENV=production
DATABASE_URL=tu_internal_database_url_de_render
JWT_SECRET=tu_secret_generado
GOOGLE_MAPS_API_KEY=tu_api_key
PORT=10000
```

### 4.4. Inicializar DB

En Shell de Render o localmente con DATABASE_URL:
```bash
DATABASE_URL=tu_url npm run setup-db
```

---

## 🌊 OPCIÓN 5: DIGITALOCEAN APP PLATFORM

### Ventajas
- ✅ Integración con DO Managed Databases
- ✅ Escalado fácil
- ✅ $200 crédito gratis al registrarse

### 5.1. Deploy

1. https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Conecta GitHub/GitLab
4. Selecciona el repo
5. DO detectará Node.js automáticamente

### 5.2. Configurar DB

1. Crea "Managed Database" → PostgreSQL
2. En App Platform, vincula la DB
3. DO creará automáticamente DATABASE_URL

### 5.3. Variables de entorno

```
NODE_ENV=production
JWT_SECRET=tu_secret_generado
GOOGLE_MAPS_API_KEY=tu_api_key
```

---

## 🗄️ CONFIGURACIÓN DE BASE DE DATOS

### Bases de datos en la nube

**ElephantSQL (PostgreSQL gratis hasta 20MB)**
1. https://www.elephantsql.com/
2. Create New Instance
3. Plan: Tiny Turtle (Free)
4. Copia la URL de conexión

**Supabase (PostgreSQL gratis hasta 500MB)**
1. https://supabase.com/
2. New Project
3. Database → Connection String
4. Usa la Connection String en DATABASE_URL

**Neon (PostgreSQL serverless gratis)**
1. https://neon.tech/
2. Crea proyecto
3. Copia connection string

### Conectar a DB externa

Si usas DATABASE_URL (formato PostgreSQL estándar):

**Actualizar src/config/database.js:**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});
```

---

## 🌐 CONFIGURACIÓN DE DOMINIO

### Apuntar dominio a tu servidor

**Para VPS con IP estática:**
- Tipo A Record: `@` → `tu.ip.del.servidor`
- Tipo A Record: `www` → `tu.ip.del.servidor`

**Para servicios cloud (Heroku, Railway, Render):**
- Tipo CNAME: `www` → `tu-app.proveedor.com`
- Tipo ALIAS/ANAME: `@` → `tu-app.proveedor.com`

### Proveedores de dominios populares
- Namecheap
- GoDaddy
- Google Domains
- Cloudflare (DNS gratis + CDN)

---

## 🔒 SEGURIDAD EN PRODUCCIÓN

### 1. Variables de entorno NUNCA en Git

```bash
echo ".env" >> .gitignore
git rm --cached .env
```

### 2. Cambiar credenciales por defecto

Después del primer deploy, conectarse como admin y cambiar:
- Password de admin
- Crear nuevos usuarios
- Eliminar usuarios de prueba

### 3. Actualizar CORS

En `src/server.js`, actualiza:
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://tu-dominio.com', 'https://www.tu-dominio.com'],
  credentials: true
}));
```

### 4. Rate limiting configurado

Ya incluido en el proyecto, pero verifica que esté activo.

### 5. Backups automáticos

**PostgreSQL backup diario:**
```bash
# Agregar a crontab
0 2 * * * pg_dump -U electoral_user electoral_system > /backups/electoral_$(date +\%Y\%m\%d).sql
```

### 6. Monitoreo

**PM2 Monitoring:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
```

**Uptime monitoring:**
- UptimeRobot (gratis)
- Pingdom
- StatusCake

---

## 🎯 TROUBLESHOOTING COMÚN

### Error: "Cannot connect to database"
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar variables de entorno
echo $DATABASE_URL
```

### Error: "Port already in use"
```bash
# Matar proceso en puerto 3000
sudo lsof -ti:3000 | xargs kill -9
```

### Error: "Module not found"
```bash
# Reinstalar dependencias
rm -rf node_modules
npm install
```

### Aplicación lenta
```bash
# Ver uso de recursos
pm2 monit

# Reiniciar aplicación
pm2 restart electoral-system
```

---

## 📞 CHECKLIST FINAL POST-DEPLOYMENT

- [ ] Aplicación accesible desde internet
- [ ] HTTPS funcionando (candado verde)
- [ ] Login funcional
- [ ] Base de datos poblada
- [ ] WebSocket conectando (tiempo real)
- [ ] Importación de Excel funcional
- [ ] Exportación de reportes funcional
- [ ] Mapa de Google funcionando
- [ ] Backups configurados
- [ ] Monitoreo activo
- [ ] Credenciales por defecto cambiadas

---

## 🎉 ¡FELICIDADES!

Tu Sistema de Votación Electoral está ahora **EN PRODUCCIÓN** 🚀

### URLs de acceso:
- **Frontend Principal:** https://tu-dominio.com
- **Panel Admin:** https://tu-dominio.com/admin
- **Panel Contador:** https://tu-dominio.com/contador

### Próximos pasos recomendados:
1. Configurar CDN (Cloudflare)
2. Implementar backup automático
3. Configurar alertas de monitoreo
4. Optimizar imágenes y assets
5. Configurar analytics (opcional)

---

**¿Necesitas ayuda?** Revisa los logs:
```bash
pm2 logs electoral-system
```

**¡Éxito en tus elecciones! 🗳️**
