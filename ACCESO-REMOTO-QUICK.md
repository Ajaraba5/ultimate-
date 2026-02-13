# 🌐 ACCESO REMOTO - RESUMEN RÁPIDO

Tu sistema electoral está corriendo localmente. Para que otros accedan desde internet:

## ⚡ OPCIÓN MÁS RÁPIDA (5 minutos)

### 🚀 Con Cloudflare (Gratis, sin cuenta)

```powershell
# 1. Instalar cloudflared
choco install cloudflared

# 2. Ejecutar script automático
.\start-with-cloudflare.bat
```

**¡Listo!** Te dará una URL como `https://xyz.trycloudflare.com`

---

### 🔧 Con ngrok (requiere cuenta gratis)

```powershell
# 1. Registrarse en https://ngrok.com
# 2. Instalar ngrok
choco install ngrok

# 3. Configurar token (solo una vez)
ngrok config add-authtoken TU_TOKEN_DE_NGROK

# 4. Ejecutar script automático
.\start-with-ngrok.bat
```

**¡Listo!** Te dará una URL como `https://abc123.ngrok-free.app`

---

## 📖 MÁS INFORMACIÓN

- **Guía completa de túneles:** [ACCESO-REMOTO.md](ACCESO-REMOTO.md)
- **Deploy permanente (Railway, Render):** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Deploy rápido cloud:** [QUICK-DEPLOY.md](QUICK-DEPLOY.md)

---

## 🎯 ¿Cuál elegir?

| Necesitas | Usa esto | Tiempo |
|-----------|----------|---------|
| **Demo ahora mismo** | Cloudflare Tunnel | 2 min |
| **URL que no cambie** | ngrok (cuenta pago) o Railway | 5 min |
| **Acceso 24/7** | Railway/Render | 15 min |
| **App en producción** | VPS o Railway Pro | 30 min |

---

## 🚀 Scripts Disponibles

Están listos para usar:

### Windows
- `start-with-ngrok.bat` - Inicia app + ngrok
- `start-with-cloudflare.bat` - Inicia app + cloudflare

### Linux/Mac
- `start-with-ngrok.sh` - Inicia app + ngrok (bash)
- `start-with-cloudflare.sh` - Inicia app + cloudflare (bash)

---

## ⚙️ Configuración Manual

Si prefieres hacerlo paso a paso:

```powershell
# Terminal 1: Iniciar tu app
set ALLOW_EXTERNAL_ACCESS=true
npm start

# Terminal 2: Iniciar túnel
cloudflared tunnel --url http://localhost:3000
# O con ngrok:
ngrok http 3000
```

---

## 📱 Compartir la URL

Una vez que tengas la URL, compártela así:

```
🗳️ Sistema de Votación Electoral

🌐 URL: https://tu-url-del-tunnel.com

Credenciales:
👨‍💼 Admin: admin / Admin123!
📊 Contador: contador1 / Contador123!

⚠️ Cambiar passwords al entrar
```

---

## 🆘 Problemas Comunes

### "Cannot connect"
✅ Verifica que tu app esté corriendo en localhost:3000
✅ Revisa el firewall de Windows

### "Tunnel not working"
✅ Reinicia el túnel
✅ Verifica que ALLOW_EXTERNAL_ACCESS=true esté en .env

### "App lenta"
✅ Los túneles gratuitos pueden ser lentos
✅ Considera deployar en Railway/Render

---

**¿Listo para empezar?** Ejecuta uno de los scripts .bat 🚀
