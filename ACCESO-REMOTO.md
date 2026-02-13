# 🌐 ACCESO REMOTO INMEDIATO - Guía Práctica

## 🚀 OPCIÓN 1: ngrok - Túnel Instantáneo (RECOMENDADO para pruebas)

### ¿Qué es ngrok?
Un túnel seguro que expone tu localhost a internet al instante. Perfecto para demos y pruebas.

### Ventajas
- ✅ **5 minutos** para tener tu app en línea
- ✅ **GRATIS** (con algunas limitaciones)
- ✅ **HTTPS automático** (seguro)
- ✅ **No requiere configuración de router**
- ✅ **Tu app sigue en tu PC**

### Desventajas
- ❌ URL cambia cada vez que reinicias (gratis)
- ❌ Se detiene si apagas tu PC
- ❌ Límite de conexiones en plan gratis

### Paso a Paso

#### 1. Descargar ngrok
```powershell
# Opción A: Con Chocolatey
choco install ngrok

# Opción B: Descarga manual
# Ve a https://ngrok.com/download
# Descarga el .zip para Windows
# Extrae ngrok.exe a una carpeta (ej: C:\ngrok)
```

#### 2. Crear cuenta (gratis)
- Ve a https://dashboard.ngrok.com/signup
- Regístrate con email o GitHub
- Copia tu authtoken

#### 3. Configurar authtoken
```powershell
# Si instalaste con Chocolatey:
ngrok config add-authtoken TU_TOKEN_AQUI

# Si descargaste manualmente:
cd C:\ngrok
.\ngrok config add-authtoken TU_TOKEN_AQUI
```

#### 4. Iniciar tu aplicación
```powershell
# Asegúrate que tu app esté corriendo
npm start
# Debe estar en http://localhost:3000
```

#### 5. Crear el túnel
```powershell
# En otra terminal:
ngrok http 3000
```

#### 6. ¡Listo! 🎉
Verás algo como:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

**Comparte esa URL** (https://abc123.ngrok-free.app) con quien quieras.

### Comandos útiles de ngrok

```powershell
# Túnel básico
ngrok http 3000

# Con subdominio personalizado (requiere plan pago)
ngrok http 3000 --subdomain=mi-votacion

# Ver estadísticas en navegador
# Abre: http://localhost:4040
```

### Mantener ngrok corriendo

```powershell
# Dejar ngrok en segundo plano
Start-Process powershell -ArgumentList "ngrok http 3000" -WindowStyle Minimized
```

---

## 🌐 OPCIÓN 2: Cloudflare Tunnel (GRATIS, más estable)

### Ventajas sobre ngrok
- ✅ **Totalmente GRATIS**
- ✅ **Dominio fijo** (no cambia)
- ✅ **Sin límites de conexiones**
- ✅ **Más rápido** (red de Cloudflare)

### Paso a Paso

#### 1. Instalar cloudflared
```powershell
# Descargar desde:
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# O con Chocolatey:
choco install cloudflared
```

#### 2. Login
```powershell
cloudflared tunnel login
```
Se abrirá navegador para autorizar.

#### 3. Crear túnel
```powershell
cloudflared tunnel create mi-sistema-electoral
```
Guarda el ID del túnel que aparece.

#### 4. Configurar túnel
Crea archivo de configuración:
```powershell
# En tu directorio de proyecto
@"
url: http://localhost:3000
tunnel: TU_TUNNEL_ID_AQUI
credentials-file: C:\Users\TU_USUARIO\.cloudflared\TU_TUNNEL_ID.json
"@ | Out-File -FilePath cloudflared-config.yml -Encoding UTF8
```

#### 5. Rutear el túnel
```powershell
cloudflared tunnel route dns mi-sistema-electoral votacion.tudominio.com
```

#### 6. Iniciar túnel
```powershell
cloudflared tunnel --config cloudflared-config.yml run
```

#### Quick Start (sin dominio propio)
```powershell
# La forma más rápida (URL temporal):
cloudflared tunnel --url http://localhost:3000
```
Te dará una URL tipo: https://xyz.trycloudflare.com

---

## 🏠 OPCIÓN 3: Tu Propio Router (Port Forwarding)

### ⚠️ Solo si tienes IP pública estática

### Ventajas
- ✅ Control total
- ✅ Sin intermediarios
- ✅ Gratis

### Desventajas
- ❌ Requiere configurar router
- ❌ Expone tu IP pública
- ❌ IP puede cambiar (a menos que sea estática)
- ❌ Problemas de seguridad si no se configura bien

### Paso a Paso

#### 1. Obtener tu IP local
```powershell
ipconfig | findstr /i "IPv4"
```
Busca algo como: 192.168.1.XX

#### 2. Configurar IP estática local (Windows)
```
Panel de Control → Red e Internet → Centro de redes
→ Cambiar configuración del adaptador
→ Click derecho en tu adaptador → Propiedades
→ IPv4 → Propiedades
→ Usar la siguiente dirección IP:
   IP: 192.168.1.100 (o la que tenías)
   Máscara: 255.255.255.0
   Puerta enlace: 192.168.1.1 (tu router)
   DNS: 8.8.8.8
```

#### 3. Acceder a tu router
Abre navegador: `http://192.168.1.1` (o 192.168.0.1)
Usuario/Pass común: admin/admin (consulta manual de tu router)

#### 4. Configurar Port Forwarding
Busca sección: "Port Forwarding" o "Virtual Server"

Agrega regla:
- **Nombre:** Sistema Electoral
- **Puerto Externo:** 3000 (o el que quieras)
- **Puerto Interno:** 3000
- **IP Interna:** 192.168.1.100 (tu PC)
- **Protocolo:** TCP
- **Estado:** Habilitado

#### 5. Obtener tu IP pública
```powershell
# Ver tu IP pública
curl ifconfig.me
```

#### 6. Acceder desde afuera
```
http://TU_IP_PUBLICA:3000
```

#### 7. Dominio dinámico (si tu IP cambia)
Usa servicios como:
- No-IP (https://www.noip.com/)
- DynDNS
- Duck DNS (gratis)

---

## 🚀 OPCIÓN 4: Deploy en la Nube (Permanente)

### Para acceso 24/7 sin depender de tu PC

#### Railway (El más fácil, GRATIS)
```powershell
# 1. Instalar CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Inicializar
railway init

# 4. Deploy
railway up

# 5. Agregar PostgreSQL
railway add

# 6. Inicializar BD
railway run npm run setup-db

# 7. Ver URL
railway open
```

Tu app estará en: `https://tu-app.railway.app`

#### Render (También muy fácil)
1. Ve a https://render.com
2. New Web Service
3. Conecta GitHub
4. Deploy automático
5. Agregar PostgreSQL
6. Listo!

---

## 📊 COMPARACIÓN RÁPIDA

| Opción | Tiempo Setup | Costo | Permanente | Facilidad |
|--------|-------------|-------|------------|-----------|
| **ngrok** | 5 min | Gratis* | ❌ (mientras PC encendida) | ⭐⭐⭐⭐⭐ |
| **Cloudflare Tunnel** | 10 min | Gratis | ❌ (mientras PC encendida) | ⭐⭐⭐⭐ |
| **Port Forwarding** | 30 min | Gratis | ❌ (mientras PC encendida) | ⭐⭐ |
| **Railway/Render** | 15 min | Gratis** | ✅ 24/7 | ⭐⭐⭐⭐⭐ |

*ngrok gratis tiene URL que cambia y límites  
**Railway/Render gratis con límites generosos

---

## 🎯 RECOMENDACIÓN SEGÚN TU CASO

### Para DEMOSTRACIÓN RÁPIDA (hoy/ahora)
→ **ngrok** - 5 minutos y listo

### Para PRUEBAS de varios días
→ **Cloudflare Tunnel** - Gratis y URL fija

### Para PRODUCCIÓN REAL (elecciones)
→ **Railway o Render** - Siempre disponible, rápido, profesional

### Para APRENDER/experimentar
→ **Port Forwarding** - Entender cómo funciona

---

## 🚀 QUICK START - LA MÁS RÁPIDA

```powershell
# OPCIÓN A: ngrok (requiere cuenta gratis)
# 1. Descarga: https://ngrok.com/download
# 2. Extrae a C:\ngrok
# 3. Obtén token: https://dashboard.ngrok.com/get-started/your-authtoken
# 4. Ejecuta:
cd C:\ngrok
.\ngrok config add-authtoken TU_TOKEN
.\ngrok http 3000

# OPCIÓN B: Cloudflare (sin cuenta, inmediato)
# 1. Descarga cloudflared
# 2. Ejecuta:
cloudflared tunnel --url http://localhost:3000
```

---

## ⚙️ Configuración Adicional para Acceso Externo

Si usas ngrok o túneles, actualiza CORS en tu aplicación:

```javascript
// src/server.js - Permitir acceso desde cualquier origen (solo para desarrollo)
app.use(cors({
  origin: true, // Permite cualquier origen
  credentials: true
}));
```

---

## 🆘 TROUBLESHOOTING

### ngrok: "tunnel not found"
```powershell
# Reinstalar authtoken
ngrok config add-authtoken TU_TOKEN
```

### No pueden conectarse
- Verifica firewall Windows (permitir puerto 3000)
- Verifica que tu app esté corriendo en localhost:3000
- Prueba primero desde tu propia red

### Cloudflare: error de conexión
```powershell
# Asegúrate de tener cloudflared corriendo
cloudflared tunnel --url http://localhost:3000
```

### "Cannot connect to database" después de deploy
- Verifica que DATABASE_URL esté configurado
- Ejecuta: npm run setup-db en el servidor

---

## 📱 Para Compartir con Otros

Una vez que tengas tu URL (de ngrok, cloudflare, o cloud):

```
🗳️ Sistema de Votación Electoral

🌐 URL: https://tu-url-aqui.com

👨‍💼 Admin:
   Usuario: admin
   Password: Admin123!

📊 Contador:
   Usuario: contador1  
   Password: Contador123!

⚠️ IMPORTANTE: Cambiar passwords después del primer login
```

---

**¿Cuál prefieres? Elige y te ayudo con los detalles específicos! 🚀**
