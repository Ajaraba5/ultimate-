# ✅ CHECKLIST PRE-DEPLOYMENT

## Antes de subir a producción, verifica:

### 🔧 Configuración

- [ ] Archivo `.env` creado y configurado
- [ ] `NODE_ENV=production` establecido
- [ ] `PORT` configurado (o dejarlo automático)
- [ ] Base de datos PostgreSQL accesible
- [ ] `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` correctos
  - **O** `DATABASE_URL` configurada (para servicios cloud)

### 🔐 Seguridad

- [ ] `JWT_SECRET` generado con 64+ caracteres aleatorios
- [ ] **NUNCA** usar el JWT_SECRET del ejemplo
- [ ] Contraseñas de base de datos seguras
- [ ] `.env` está en `.gitignore`
- [ ] No hay credenciales en el código fuente

### 📦 Dependencias

- [ ] `npm install` ejecutado sin errores
- [ ] `node_modules/` excluido de Git
- [ ] `package.json` y `package-lock.json` comprometidos

### 🗄️ Base de Datos

- [ ] PostgreSQL versión 13+ instalado
- [ ] Base de datos `electoral_system` creada
- [ ] Usuario con permisos CREATE, ALTER, DROP, INSERT, UPDATE, DELETE
- [ ] Esquema inicializado (`npm run setup-db`)

### 🌐 Networking

- [ ] Puerto 3000 (o el configurado) disponible
- [ ] Firewall permite tráfico HTTP/HTTPS
- [ ] Si usas un proxy (Nginx/Apache), está configurado para WebSocket
- [ ] CORS configurado con tus dominios permitidos

### 🎨 Opcional pero Recomendado

- [ ] Google Maps API Key configurada (`GOOGLE_MAPS_API_KEY`)
- [ ] Dominio DNS apuntando al servidor
- [ ] Certificado SSL configurado (HTTPS)
- [ ] Backups automáticos configurados
- [ ] Monitoreo/alertas configurados

---

## Post-Deployment

Después de deployar, asegúrate de:

- [ ] La aplicación responde en la URL
- [ ] Login funciona con credenciales por defecto
- [ ] **CAMBIAR** contraseña de admin inmediatamente
- [ ] **CAMBIAR** contraseña de contador de prueba
- [ ] Importar datos de Excel funciona
- [ ] Exportar reportes funciona
- [ ] WebSocket conecta (tiempo real funciona)
- [ ] Mapa de Google carga correctamente
- [ ] Crear nuevos usuarios contadores
- [ ] Eliminar usuarios de prueba si no se necesitan

---

## Comandos Útiles

### Verificar variables de entorno
```bash
# Ver todas las variables (ten cuidado con secretos)
printenv | grep -E 'DB_|JWT_|NODE_'

# Verificar Node.js
node --version  # Debe ser >= 16.0.0

# Verificar npm
npm --version   # Debe ser >= 8.0.0

# Verificar PostgreSQL
psql --version  # Debe ser >= 13.0
```

### Probar conexión a base de datos
```bash
# Conectar manualmente
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# Dentro de psql:
\dt          # Ver tablas
\du          # Ver usuarios
SELECT COUNT(*) FROM personas;  # Verificar datos
\q           # Salir
```

### Verificar aplicación
```bash
# Health check
curl http://localhost:3000/health

# Ver logs
pm2 logs electoral-system  # Si usas PM2
heroku logs --tail          # Si usas Heroku
railway logs                # Si usas Railway
```

### Reiniciar aplicación
```bash
# PM2
pm2 restart electoral-system

# Heroku
heroku restart

# Railway
railway restart

# Systemd (Linux server)
sudo systemctl restart electoral
```

---

## 🚨 Checklist de Seguridad en Producción

- [ ] **NUNCA** usar credenciales por defecto en producción
- [ ] **NUNCA** compartir el archivo `.env`
- [ ] **NUNCA** commitear `.env` a Git
- [ ] **NUNCA** exponer secretos en logs
- [ ] **SIEMPRE** usar HTTPS en producción
- [ ] **SIEMPRE** cambiar passwords después del primer deploy
- [ ] **SIEMPRE** tener backups
- [ ] **SIEMPRE** monitorear logs de seguridad

---

## ✅ Todo Listo?

Si marcaste todos los checkboxes relevantes, **¡estás listo para deployar!**

Elige tu plataforma:
- **Rápido y gratis:** [Railway o Render](QUICK-DEPLOY.md)
- **Control total:** [VPS/Dedicated Server](DEPLOYMENT.md#opción-1-vpsservidor-dedicado)
- **Guía completa:** [DEPLOYMENT.md](DEPLOYMENT.md)

---

**¡Éxito con tu deployment! 🚀**
