# 🎨 DEPLOY 24/7 EN RENDER - PASO A PASO

## ✅ Prerequisitos
- Git instalado
- Cuenta GitHub (gratis)
- 15 minutos de tiempo

---

## 📋 PASOS DETALLADOS

### 1️⃣ Preparar Git (si no lo has hecho)

```powershell
cd "C:\Users\alejo\OneDrive\Desktop\epic voation"
git init
git add .
git commit -m "Initial commit"
```

### 2️⃣ Subir a GitHub

1. Ve a https://github.com/new
2. Nombre: `sistema-electoral`
3. Create repository
4. Ejecuta:

```powershell
git remote add origin https://github.com/TU_USUARIO/sistema-electoral.git
git branch -M main
git push -u origin main
```

### 3️⃣ Deploy en Render

**A. Crear cuenta**
1. Ve a https://render.com
2. Sign Up con GitHub
3. Autoriza Render

**B. Crear PostgreSQL**
1. Dashboard → New +
2. PostgreSQL
3. Name: `electoral-db`
4. Database: `electoral_system`
5. User: `electoral_user`
6. Region: Oregon (US West)
7. Plan: **Free**
8. Create Database
9. **IMPORTANTE**: Copia la "Internal Database URL"

**C. Crear Web Service**
1. Dashboard → New +
2. Web Service
3. Connect repository → Busca `sistema-electoral`
4. Configuración:
   - **Name**: `sistema-electoral`
   - **Region**: Oregon (igual que la DB)
   - **Branch**: `main`
   - **Root Directory**: (dejar vacío)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Plan**: Free

**D. Variables de entorno**

Antes de crear, ve a "Advanced" y agrega:

```
NODE_ENV=production
DATABASE_URL=[pega aquí la Internal Database URL que copiaste]
JWT_SECRET=[genera uno nuevo]
PORT=10000
ALLOW_EXTERNAL_ACCESS=true
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Para generar JWT_SECRET:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**E. Crear servicio**
Click "Create Web Service"

Render empezará a deployar (tarda ~5 minutos).

**F. Inicializar base de datos**

1. Espera que el deploy termine (status: Live)
2. En tu servicio, ve a "Shell" (menú izquierdo)
3. Ejecuta:
```bash
npm run setup-db
```

### 4️⃣ Obtener tu URL

En tu dashboard verás algo como:
**https://sistema-electoral-xxxx.onrender.com**

Esa es tu URL pública 24/7!

---

## 🎉 ¡LISTO!

### URLs de acceso:
- **Frontend:** https://sistema-electoral-xxxx.onrender.com
- **Admin:** https://sistema-electoral-xxxx.onrender.com/admin
- **Contador:** https://sistema-electoral-xxxx.onrender.com/contador

**Credenciales:**
- Admin: `admin` / `Admin123!`
- Contador: `contador1` / `Contador123!`

---

## 📊 Render - Plan Gratuito

✅ Hosting gratis ilimitado
✅ PostgreSQL gratis (90 días, luego $7/mes)
✅ SSL/HTTPS automático
✅ Auto-deploy desde GitHub
✅ 750 horas/mes gratis
⚠️ Se "duerme" después de 15 min sin uso (tarda ~30s en despertar)

---

## 🔄 Actualizar tu app

```powershell
git add .
git commit -m "Mis cambios"
git push
```

Render auto-despliega en ~5 minutos.

---

## ⚡ Evitar que se "duerma"

El plan gratuito se duerme. Opciones:

**Opción 1: Upgrade a plan pago ($7/mes)**
- Dashboard → Settings → Upgrade to Paid
- Nunca se duerme

**Opción 2: Ping cada 10 minutos (gratis)**

Usa un servicio como UptimeRobot:
1. Ve a https://uptimerobot.com
2. Add New Monitor
3. URL: tu URL de Render
4. Interval: 5 minutes
5. Gratis hasta 50 monitores

---

## 🆘 Troubleshooting

### Error: "Build failed"
- Revisa los logs en "Events"
- Verifica que package.json esté bien

### Error: "Cannot connect to database"
- Verifica que DATABASE_URL esté correcta
- Debe ser la "Internal Database URL", no la External

### La app es lenta al inicio
- Es normal en plan free (cold start)
- Usa UptimeRobot o upgrade a plan pago

### No puedo acceder a /admin
- Verifica que el servidor esté "Live" (verde)
- Revisa logs en tiempo real

---

## 💡 Tips

1. **Custom Domain** (gratis con Render)
   - Settings → Custom Domain
   - Agrega tu dominio

2. **Ver logs en tiempo real**
   - Tu servicio → Logs
   - Útil para debugging

3. **Conectar a PostgreSQL**
   - Database → Connect
   - Usa las credenciales con pgAdmin

4. **Backups automáticos**
   - Render hace backups automáticos de la DB
   - Settings → Backups

---

## 📈 Comparación: Render vs Railway

| Feature | Render Free | Railway Free |
|---------|-------------|--------------|
| Hosting | ✅ Ilimitado | ✅ 500h/mes |
| PostgreSQL | ✅ 90 días | ✅ Ilimitado* |
| Cold starts | ⚠️ Sí (15 min) | ⚠️ A veces |
| SSL | ✅ Auto | ✅ Auto |
| Auto-deploy | ✅ Sí | ✅ Sí |
| Custom domain | ✅ Gratis | ✅ Gratis |

*Con $5 crédito/mes

**Recomendación**: Railway si quieres que esté siempre activo, Render si no te importa que se duerma.

---

¿Listo? Empieza aquí:

```powershell
cd "C:\Users\alejo\OneDrive\Desktop\epic voation"
git init
git add .
git commit -m "Initial commit"
```

🚀
