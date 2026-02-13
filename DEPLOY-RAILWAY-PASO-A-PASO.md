# 🚂 DEPLOY 24/7 EN RAILWAY - PASO A PASO

## ✅ Prerequisitos
- Git instalado
- Cuenta GitHub (gratis)
- 15 minutos de tiempo

---

## 📋 PASOS DETALLADOS

### 1️⃣ Preparar tu proyecto para Git

```powershell
# Abrir PowerShell en tu carpeta del proyecto
cd "C:\Users\alejo\OneDrive\Desktop\epic voation"

# Inicializar Git (si no lo has hecho)
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit - Sistema Electoral v3.0"
```

### 2️⃣ Subir a GitHub

**Opción A: Desde la web (más fácil)**
1. Ve a https://github.com/new
2. Nombre del repo: `sistema-electoral`
3. Privado o público (tu elección)
4. Click "Create repository"
5. Copia los comandos que aparecen:

```powershell
git remote add origin https://github.com/TU_USUARIO/sistema-electoral.git
git branch -M main
git push -u origin main
```

**Opción B: Con GitHub CLI**
```powershell
# Instalar GitHub CLI
winget install GitHub.cli

# Login
gh auth login

# Crear repo y subir
gh repo create sistema-electoral --private --source=. --push
```

### 3️⃣ Deploy en Railway

**A. Ir a Railway**
1. Ve a https://railway.app
2. Click "Start a New Project"
3. Login con GitHub
4. Autoriza Railway

**B. Crear proyecto**
1. Click "Deploy from GitHub repo"
2. Selecciona tu repo `sistema-electoral`
3. Railway detectará automáticamente Node.js
4. Click "Deploy Now"

**C. Agregar PostgreSQL**
1. En tu proyecto, click "+ New"
2. Selecciona "Database"
3. Selecciona "PostgreSQL"
4. Railway creará la base de datos automáticamente

**D. Conectar la base de datos**
Railway conecta automáticamente con la variable `DATABASE_URL`.
Tu código ya está preparado para esto (lo configuramos antes).

**E. Variables de entorno**
1. Click en tu servicio (Node.js)
2. Ve a "Variables"
3. Agrega estas variables:

```
NODE_ENV=production
JWT_SECRET=tu_secret_de_64_caracteres_aleatorio
PORT=3000
ALLOW_EXTERNAL_ACCESS=true
```

Para generar JWT_SECRET:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**F. Inicializar base de datos**
1. En Railway, click en tu servicio
2. Ve a "Settings"
3. En "Deploy Triggers", espera que termine el primer deploy
4. Luego en la terminal de Railway ejecuta:
```bash
npm run setup-db
```

O desde tu PC local:
```powershell
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link al proyecto
railway link

# Ejecutar setup
railway run npm run setup-db
```

### 4️⃣ Obtener tu URL

1. En Railway, click en tu servicio
2. Ve a "Settings"
3. En "Networking", click "Generate Domain"
4. Railway te dará una URL como: `https://tu-app.up.railway.app`

---

## 🎉 ¡LISTO!

Tu aplicación ya está en línea 24/7 en:
**https://tu-app.up.railway.app**

### Accesos:
- **Frontend:** https://tu-app.up.railway.app
- **Admin:** https://tu-app.up.railway.app/admin
- **Contador:** https://tu-app.up.railway.app/contador

**Credenciales:**
- Admin: `admin` / `Admin123!`
- Contador: `contador1` / `Contador123!`

---

## 📊 Railway - Plan Gratuito

✅ $5 de crédito gratis cada mes
✅ 500 horas de ejecución/mes (suficiente para 24/7)
✅ PostgreSQL incluido
✅ SSL/HTTPS automático
✅ Auto-deploy desde GitHub (cada push se despliega automáticamente)
✅ Logs en tiempo real
✅ Métricas y monitoreo

---

## 🔄 Actualizar tu app

Cada vez que hagas cambios:

```powershell
git add .
git commit -m "Descripción de cambios"
git push
```

Railway desplegará automáticamente los cambios en ~2 minutos.

---

## 🆘 Troubleshooting

### Error: "Application failed to start"
1. Ve a "Deployments" en Railway
2. Click en el deployment fallido
3. Revisa los logs
4. Probablemente falte una variable de entorno

### Error: "Cannot connect to database"
1. Verifica que PostgreSQL esté agregado
2. Railway debe tener la variable `DATABASE_URL` automáticamente
3. Revisa que tu código use `DATABASE_URL` (ya está configurado)

### No puedo ejecutar npm run setup-db
```powershell
# Opción 1: Desde Railway CLI
railway run npm run setup-db

# Opción 2: Desde la web
# Ve a tu servicio → Settings → One-Click Deploy
# Cambia temporalmente el start command a:
npm run setup-db && npm start
# Después de que corra, vuelve a cambiarlo a:
npm start
```

### La app es lenta
- El plan gratuito puede tener cold starts
- Upgrade a plan Hobby ($5/mes) para mejor rendimiento

---

## 💡 Tips Importantes

1. **Dominio personalizado** (opcional)
   - Settings → Networking → Custom Domain
   - Agrega tu dominio (si tienes uno)

2. **Revisar consumo**
   - Dashboard → Usage
   - Monitorea tu crédito gratis

3. **Ver logs**
   - Tu servicio → Deployments → View Logs
   - Para debugging en tiempo real

4. **Backup de base de datos**
   - PostgreSQL → Connect → Copia las credenciales
   - Usa pgAdmin o DBeaver para hacer backups

---

## 🎯 Próximos pasos opcionales

1. **Agrega dominio propio**: `www.misistema.com`
2. **Configura Google Maps API Key**
3. **Cambia contraseñas por defecto**
4. **Importa tus datos reales (Excel)**
5. **Crea usuarios contadores reales**

---

¿Listo para empezar? Ejecuta el primer comando:

```powershell
cd "C:\Users\alejo\OneDrive\Desktop\epic voation"
git init
```

¡Y sigue los pasos! 🚀
