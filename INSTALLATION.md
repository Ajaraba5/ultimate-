# 🚀 GUÍA DE INSTALACIÓN PASO A PASO
## Sistema de Votación Electoral Enterprise v3.0.0

---

## 📋 REQUISITOS PREVIOS

Antes de comenzar, asegúrate de tener instalado:

- ✅ **Node.js** versión 16.0.0 o superior
- ✅ **PostgreSQL** versión 13.0 o superior
- ✅ **NPM** versión 8.0.0 o superior
- ✅ **Git** (opcional, para clonar el repositorio)

### Verificar versiones instaladas:

```bash
node --version
npm --version
psql --version
```

---

## 📦 PASO 1: INSTALACIÓN DE DEPENDENCIAS

### 1.1. Navegar al directorio del proyecto

```bash
cd "c:\Users\alejo\OneDrive\Desktop\epic voation"
```

### 1.2. Instalar dependencias de Node.js

```bash
npm install
```

Este comando instalará todas las dependencias listadas en `package.json`:
- Express (servidor web)
- PostgreSQL driver
- Socket.IO (WebSocket real-time)
- Bcryptjs (encriptación)
- JWT (autenticación)
- ExcelJS (importación/exportación)
- Y muchas más...

**Tiempo estimado:** 2-3 minutos

---

## 🗄️ PASO 2: CONFIGURAR BASE DE DATOS PostgreSQL

### 2.1. Iniciar PostgreSQL

**Windows:**
- Busca "pgAdmin" o "SQL Shell (psql)" en el menú inicio
- O ejecuta: `psql -U postgres`

**Linux/Mac:**
```bash
sudo -u postgres psql
```

### 2.2. Crear la base de datos

```sql
CREATE DATABASE electoral_system;
```

### 2.3. Verificar que se creó correctamente

```sql
\l
```

Deberías ver `electoral_system` en la lista.

### 2.4. Salir de psql

```sql
\q
```

---

## ⚙️ PASO 3: CONFIGURAR VARIABLES DE ENTORNO

### 3.1. Crear archivo .env

Copia el archivo de ejemplo:

```bash
copy .env.example .env
```

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

### 3.2. Editar .env con tus credenciales

Abre el archivo `.env` con tu editor favorito y configura:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=electoral_system
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_DE_POSTGRES

# Seguridad (IMPORTANTE: Cambia esto en producción)
JWT_SECRET=genera_un_secreto_super_seguro_de_64_caracteres_minimo_aqui
JWT_EXPIRES_IN=12h
BCRYPT_ROUNDS=12

# Servidor
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Google Maps (Opcional)
GOOGLE_MAPS_API_KEY=tu_api_key_aqui

# Backup
BACKUP_INTERVAL_HOURS=6

# Sesiones
SESSION_TIMEOUT_HOURS=12
```

### 3.3. Generar JWT_SECRET seguro

**Opción 1 - Node.js:**
```javascript
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Opción 2 - PowerShell:**
```powershell
[Convert]::ToBase64String((1..64|%{Get-Random -Max 256}))
```

Copia el resultado y úsalo como `JWT_SECRET`.

---

## 🔧 PASO 4: INICIALIZAR BASE DE DATOS

### 4.1. Ejecutar script de setup

```bash
npm run setup-db
```

Este comando:
- ✅ Crea todas las tablas necesarias (users, personas, lideres, zonas, etc.)
- ✅ Crea índices optimizados
- ✅ Inserta datos iniciales
- ✅ Crea triggers automáticos
- ✅ Crea usuario admin predeterminado
- ✅ Crea contador de prueba

**Salida esperada:**
```
✅ Conexión a PostgreSQL exitosa
✅ Base de datos inicializada correctamente
✅ Tablas creadas
✅ Índices optimizados
✅ Triggers activos
✅ Datos iniciales insertados
🎊 Sistema listo para usar!

📌 Credenciales de acceso:
   Admin - Usuario: admin, Password: Admin123!
   Contador - Usuario: contador1, Password: Contador123!

⚠️  IMPORTANTE: Cambia estas contraseñas en producción
```

---

## 🚀 PASO 5: INICIAR EL SERVIDOR

### 5.1. Modo Desarrollo (con auto-reload)

```bash
npm run dev
```

### 5.2. Modo Producción

```bash
npm start
```

**Salida esperada:**
```
🚀 Iniciando Sistema de Votación Electoral Enterprise v3.0.0...
🏰 La Fortaleza Digital de la Democracia

📡 Conectando a PostgreSQL...
✅ Conexión a PostgreSQL exitosa
🔌 Inicializando WebSocket...
✅ Socket.IO inicializado y configurado

✅ ========================================
✅ SISTEMA INICIADO EXITOSAMENTE
✅ ========================================

🌐 Servidor HTTP: http://localhost:3000
🔌 WebSocket: ws://localhost:3000
🏥 Health Check: http://localhost:3000/health

📌 Credenciales de acceso:
   👨‍💼 Admin: admin / Admin123!
   📊 Contador: contador1 / Contador123!

🔐 Capas de seguridad activas: 9
⚡ Rate limiting: ACTIVO
📊 Monitoring: ACTIVO
🛡️ CSRF Protection: ACTIVO

🎊 ¡Sistema listo para producción!
```

---

## 🌐 PASO 6: ACCEDER AL SISTEMA

### 6.1. Abrir navegador

Abre tu navegador preferido (Chrome, Firefox, Edge) y navega a:

```
http://localhost:3000
```

### 6.2. Login como Administrador

- **Usuario:** `admin`
- **Contraseña:** `Admin123!`

### 6.3. Login como Contador

- **Usuario:** `contador1`
- **Contraseña:** `Contador123!`

---

## 📊 PASO 7: VERIFICAR FUNCIONAMIENTO

### 7.1. Health Check

Visita: http://localhost:3000/health

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2026-02-12T...",
  "uptime": 123,
  "database": "connected",
  "memory": {
    "used": "50 MB",
    "total": "100 MB"
  },
  "version": "3.0.0"
}
```

### 7.2. Panel de Admin

1. Ingresa con credenciales de admin
2. Verifica que veas el dashboard con 4 gráficos
3. Los gráficos se actualizarán cada 10 segundos

### 7.3. WebSocket

Abre la consola del navegador (F12) y verifica:
```
✅ WebSocket conectado
```

---

## 📥 PASO 8: IMPORTAR DATOS DE EJEMPLO

### 8.1. Preparar archivo Excel

Crea un archivo Excel con las siguientes columnas:
- Nombre
- Documento
- Teléfono
- Dirección
- Líder
- Partido (ROJO o VERDE)
- Zona

**Ejemplo:**
| Nombre | Documento | Teléfono | Dirección | Líder | Partido | Zona |
|--------|-----------|----------|-----------|-------|---------|------|
| Juan Pérez | 123456789 | 555-0001 | Calle 1 #10 | Carlos López | ROJO | Centro |
| María García | 987654321 | 555-0002 | Calle 2 #20 | Ana Martínez | VERDE | Norte |

### 8.2. Importar

1. En el panel de admin, ve a la pestaña "Importar/Exportar"
2. Haz clic en "Elegir archivo"
3. Selecciona tu archivo Excel
4. Haz clic en "Importar"

**Resultado esperado:**
```
✅ Importación exitosa!
Personas: 2400
Líderes: 12
Zonas: 5
```

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### Problema 1: "Error conectando a PostgreSQL"

**Solución:**
- Verifica que PostgreSQL esté corriendo
- Verifica credenciales en `.env`
- Verifica que la base de datos `electoral_system` exista

### Problema 2: "Port 3000 already in use"

**Solución:**
- Cambia el puerto en `.env`: `PORT=3001`
- O detén el proceso que está usando el puerto 3000

### Problema 3: "Token inválido"

**Solución:**
- Borra localStorage del navegador (F12 → Application → Local Storage → Clear)
- Vuelve a hacer login

### Problema 4: "Cannot find module..."

**Solución:**
```bash
npm install
```

---

## 📚 RECURSOS ADICIONALES

- 📖 **Documentación completa:** Ver README.md
- 🔒 **Guía de seguridad:** Ver docs/security.md
- 🚀 **Guía de despliegue:** Ver docs/deployment.md
- 🐛 **Reportar bugs:** Contacta al equipo de soporte

---

## ✅ CHECKLIST DE INSTALACIÓN

- [ ] Node.js instalado (v16+)
- [ ] PostgreSQL instalado (v13+)
- [ ] Dependencias instaladas (`npm install`)
- [ ] Base de datos creada (`CREATE DATABASE electoral_system`)
- [ ] Archivo .env configurado
- [ ] Base de datos inicializada (`npm run setup-db`)
- [ ] Servidor iniciado (`npm start`)
- [ ] Login funcional (admin / Admin123!)
- [ ] Dashboard visible con gráficos
- [ ] WebSocket conectado
- [ ] (Opcional) Datos de ejemplo importados

---

## 🎊 ¡FELICITACIONES!

Tu sistema electoral está completamente instalado y funcionando.

### Próximos pasos:

1. ✅ Cambia las contraseñas predeterminadas
2. ✅ Crea contadores adicionales
3. ✅ Importa tus datos reales
4. ✅ Personaliza zonas y lugares de votación
5. ✅ Revisa la configuración de seguridad

---

**¿Necesitas ayuda?**
- 📧 Email: soporte@electoral-enterprise.com
- 💬 Telegram: @ElectoralSupport
- 📞 WhatsApp: +XX XXX XXX XXXX

🎉 **¡Bienvenido a la Fortaleza Digital de la Democracia!**
