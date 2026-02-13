# ⚡ INICIO RÁPIDO - 5 Minutos
## Sistema de Votación Electoral Enterprise v3.0.0

¿Quieres el sistema funcionando YA? Sigue estos pasos:

---

## 🚀 PASO 1: INSTALAR DEPENDENCIAS (1 min)

```powershell
npm install
```

---

## 🗄️ PASO 2: CREAR BASE DE DATOS (1 min)

Abre PostgreSQL (pgAdmin o psql):

```sql
CREATE DATABASE electoral_system;
```

Sal con `\q`

---

## ⚙️ PASO 3: CONFIGURAR (1 min)

**Copiar archivo de configuración:**
```powershell
Copy-Item .env.example .env
```

**Editar `.env`** con tus credenciales de PostgreSQL:
```env
DB_PASSWORD=tu_password_de_postgres
```

**Generar JWT secret seguro:**
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copiar el resultado y pegarlo en `.env` como `JWT_SECRET=...`

---

## 🔧 PASO 4: INICIALIZAR BASE DE DATOS (1 min)

```powershell
npm run setup-db
```

Deberías ver:
```
✅ Base de datos inicializada correctamente
🎊 Sistema listo para usar!
```

---

## 🎉 PASO 5: INICIAR SERVIDOR (1 min)

```powershell
npm start
```

Deberías ver:
```
✅ SISTEMA INICIADO EXITOSAMENTE
🌐 Servidor HTTP: http://localhost:3000
```

---

## 🌐 PASO 6: ACCEDER

Abre tu navegador en: **http://localhost:3000**

### Credenciales de Admin:
- **Usuario:** `admin`
- **Contraseña:** `Admin123!`

### Credenciales de Contador:
- **Usuario:** `contador1`
- **Contraseña:** `Contador123!`

---

## ✅ ¡LISTO!

Tu sistema electoral está funcionando. Ahora puedes:

1. ✅ Explorar el panel de admin
2. ✅ Ver gráficos en tiempo real
3. ✅ Importar datos desde Excel
4. ✅ Crear contadores
5. ✅ Marcar votos

---

## 🆘 ¿PROBLEMAS?

### Error: "Cannot connect to PostgreSQL"
- Verifica que PostgreSQL esté corriendo
- Verifica credenciales en `.env`

### Error: "Port 3000 already in use"
- Cambia el puerto en `.env`: `PORT=3001`

### Error: "Module not found"
- Ejecuta: `npm install`

---

## 📚 SIGUIENTE PASO

Lee la **[Guía de Instalación Completa](INSTALLATION.md)** para:
- Configuración avanzada
- Seguridad en producción
- Importación de datos reales
- Personalización del sistema

---

## 🎊 ¡BIENVENIDO A LA FORTALEZA DIGITAL!

**Sistema de Votación Electoral Enterprise v3.0.0**

🔐 9 Capas de Seguridad | ⚡ < 200ms Respuesta | 📊 Real-time WebSocket | 🗺️ Mapas Interactivos
