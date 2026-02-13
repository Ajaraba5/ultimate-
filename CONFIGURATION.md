# ⚙️ CONFIGURACIÓN AVANZADA
## Sistema de Votación Electoral Enterprise v3.0.0

---

## 🔧 VARIABLES DE ENTORNO DETALLADAS

### Base de Datos (PostgreSQL)

```env
# Host de PostgreSQL
# Local: localhost
# Remoto: IP o dominio del servidor
DB_HOST=localhost

# Puerto de PostgreSQL
# Default: 5432
DB_PORT=5432

# Nombre de la base de datos
DB_NAME=electoral_system

# Usuario PostgreSQL
# Crear usuario específico para la app (recomendado)
DB_USER=postgres

# Contraseña del usuario
# IMPORTANTE: Usar contraseña segura en producción
DB_PASSWORD=tu_password_seguro_aqui
```

### Seguridad

```env
# JWT Secret
# Generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Longitud mínima: 64 caracteres
JWT_SECRET=genera_un_secreto_super_seguro_de_64_caracteres_minimo_aqui

# Tiempo de expiración de JWT
# Formatos válidos: '1h', '12h', '1d', '7d'
JWT_EXPIRES_IN=12h

# Rondas de Bcrypt
# Rango recomendado: 10-12
# Más alto = más seguro pero más lento
BCRYPT_ROUNDS=12
```

### Servidor

```env
# Puerto del servidor
# Cambiar si 3000 está en uso
PORT=3000

# Entorno de ejecución
# Valores: 'development', 'production', 'test'
NODE_ENV=production
```

### Rate Limiting

```env
# Ventana de tiempo para rate limiting (milisegundos)
# Default: 900000 (15 minutos)
RATE_LIMIT_WINDOW_MS=900000

# Máximo de requests por ventana
# Default: 100
RATE_LIMIT_MAX_REQUESTS=100
```

### Google Maps (Opcional)

```env
# API Key de Google Maps
# Obtener en: https://console.cloud.google.com/
GOOGLE_MAPS_API_KEY=tu_api_key_de_google_maps_aqui
```

### Backup

```env
# Intervalo de backup automático (horas)
# Default: 6 (cada 6 horas)
BACKUP_INTERVAL_HOURS=6

# Ruta de almacenamiento de backups
# Default: ./backups
BACKUP_PATH=./backups

# Cantidad de backups a retener
# Default: 30 (últimos 30 backups)
BACKUP_RETENTION_COUNT=30
```

### Sesiones

```env
# Timeout de sesión (horas)
# Default: 12 horas
SESSION_TIMEOUT_HOURS=12

# Limpieza automática de sesiones expiradas (minutos)
# Default: 60 (cada hora)
SESSION_CLEANUP_INTERVAL_MINUTES=60
```

---

## 📊 CONFIGURACIÓN DE POSTGRESQL

### Archivo postgresql.conf

```ini
# Conexiones
max_connections = 100
superuser_reserved_connections = 3

# Memoria
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 64MB

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Autovacuum
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min

# SSL
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'

# Timeouts
statement_timeout = 30000
idle_in_transaction_session_timeout = 600000
```

### Optimización para producción

```sql
-- Análisis de tablas
ANALYZE VERBOSE;

-- Vacuum completo
VACUUM FULL ANALYZE;

-- Reindexar
REINDEX DATABASE electoral_system;

-- Estadísticas de uso
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🚀 CONFIGURACIÓN DE NODE.JS

### package.json - Scripts personalizados

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --coverage",
    "setup-db": "node src/database/setup.js",
    "backup": "node scripts/backup.js",
    "restore": "node scripts/restore.js",
    "clean-logs": "node scripts/clean-logs.js",
    "migrate": "node scripts/migrate.js"
  }
}
```

### Configuración de PM2 (Producción)

Crear archivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'electoral-system',
    script: './src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

Comandos PM2:

```bash
# Instalar PM2
npm install -g pm2

# Iniciar app
pm2 start ecosystem.config.js

# Ver logs
pm2 logs electoral-system

# Monitoreo
pm2 monit

# Restart
pm2 restart electoral-system

# Stop
pm2 stop electoral-system

# Auto-start al reiniciar sistema
pm2 startup
pm2 save
```

---

## 🔒 CONFIGURACIÓN DE NGINX (Reverse Proxy)

Crear archivo `/etc/nginx/sites-available/electoral-system`:

```nginx
upstream electoral_backend {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/electoral-system-access.log;
    error_log /var/log/nginx/electoral-system-error.log;

    # Max upload size
    client_max_body_size 10M;

    # Proxy settings
    location / {
        proxy_pass http://electoral_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://electoral_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://electoral_backend;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Activar configuración:

```bash
sudo ln -s /etc/nginx/sites-available/electoral-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔥 FIREWALL (UFW)

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir PostgreSQL solo desde localhost
sudo ufw allow from 127.0.0.1 to any port 5432

# Ver reglas
sudo ufw status verbose
```

---

## 📈 MONITOREO Y LOGGING

### Winston Logger (ya incluido)

Configuración en `src/utils/logger.js`:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### Health Check automático

Script `scripts/health-check.js`:

```javascript
const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  if (res.statusCode == 200) {
    console.log('✅ Sistema operativo');
    process.exit(0);
  } else {
    console.log('❌ Sistema con problemas');
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.log('❌ Sistema caído:', err);
  process.exit(1);
});

request.end();
```

Cron job para monitoreo (cada 5 minutos):

```bash
*/5 * * * * /usr/bin/node /path/to/scripts/health-check.js >> /var/log/health-check.log 2>&1
```

---

## 💾 BACKUP AUTOMÁTICO

Script `scripts/backup.js`:

```javascript
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const backupDir = process.env.BACKUP_PATH || './backups';
const dbName = process.env.DB_NAME || 'electoral_system';
const date = new Date().toISOString().split('T')[0];
const filename = `backup_${date}_${Date.now()}.sql`;
const filepath = path.join(backupDir, filename);

// Crear directorio si no existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Backup
exec(`pg_dump -U ${process.env.DB_USER} ${dbName} > ${filepath}`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error en backup:', error);
    return;
  }
  
  console.log(`✅ Backup creado: ${filename}`);
  
  // Limpieza de backups antiguos
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('backup_'))
    .sort()
    .reverse();
  
  const retention = parseInt(process.env.BACKUP_RETENTION_COUNT) || 30;
  
  if (files.length > retention) {
    files.slice(retention).forEach(file => {
      fs.unlinkSync(path.join(backupDir, file));
      console.log(`🗑️ Eliminado: ${file}`);
    });
  }
});
```

Cron job (diario a las 2 AM):

```bash
0 2 * * * /usr/bin/node /path/to/scripts/backup.js >> /var/log/backup.log 2>&1
```

---

## 🔄 ACTUALIZACIÓN DEL SISTEMA

### Actualizar dependencias:

```bash
# Ver dependencias desactualizadas
npm outdated

# Actualizar todas (cuidado en producción)
npm update

# Actualizar una específica
npm update express

# Auditoría de seguridad
npm audit

# Corregir vulnerabilidades
npm audit fix
```

### Migración de base de datos:

Crear archivo `migrations/001_add_new_field.sql`:

```sql
-- Agregar nuevo campo
ALTER TABLE personas ADD COLUMN email VARCHAR(100);

-- Crear índice
CREATE INDEX idx_personas_email ON personas(email);
```

Script de migración `scripts/migrate.js`:

```javascript
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function migrate() {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir).sort();
  
  for (const file of files) {
    if (path.extname(file) === '.sql') {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      try {
        await pool.query(sql);
        console.log(`✅ Migración aplicada: ${file}`);
      } catch (error) {
        console.error(`❌ Error en ${file}:`, error.message);
      }
    }
  }
}

migrate().then(() => process.exit(0));
```

---

**Última actualización:** 12 de Febrero, 2026  
**Versión:** 3.0.0
