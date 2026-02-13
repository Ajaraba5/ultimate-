# ⚡ OPTIMIZACIONES PARA MANEJAR MÁS USUARIOS

## 🎯 Mejoras de rendimiento implementadas

Tu código ya tiene algunas optimizaciones, pero aquí hay más:

### 1. Limitar conexiones WebSocket simultáneas

```javascript
// En src/socket/socketHandler.js
const MAX_CONNECTIONS = 100; // Límite de conexiones simultáneas
let activeConnections = 0;

io.on('connection', (socket) => {
  if (activeConnections >= MAX_CONNECTIONS) {
    socket.emit('error', 'Demasiados usuarios conectados. Intenta más tarde.');
    socket.disconnect(true);
    return;
  }
  
  activeConnections++;
  console.log(`Conexiones activas: ${activeConnections}`);
  
  socket.on('disconnect', () => {
    activeConnections--;
  });
});
```

### 2. Cachear datos frecuentes

```javascript
// Usar un cache simple para estadísticas
const NodeCache = require('node-cache');
const statsCache = new NodeCache({ stdTTL: 30 }); // Cache por 30 segundos

async function getDashboard(req, res) {
  // Revisar cache primero
  const cached = statsCache.get('dashboard');
  if (cached) {
    return res.json(cached);
  }
  
  // Si no hay cache, consultar DB
  const stats = await query(/* tu query */);
  
  // Guardar en cache
  statsCache.set('dashboard', stats);
  
  res.json(stats);
}
```

### 3. Limitar actualizaciones en tiempo real

```javascript
// En lugar de actualizar cada segundo, actualizar cada 5-10 segundos
setInterval(() => {
  io.emit('estadisticas-actualizadas', stats);
}, 10000); // 10 segundos en lugar de 1-2
```

### 4. Optimizar queries a la base de datos

```javascript
// Usar índices en PostgreSQL
CREATE INDEX idx_personas_voto ON personas(voto);
CREATE INDEX idx_personas_partido ON personas(partido);
CREATE INDEX idx_personas_lider_id ON personas(lider_id);
CREATE INDEX idx_personas_contador_id ON personas(contador_id);
```

---

## 📊 Monitoreo de recursos

### Instalar monitor de uso
```bash
npm install node-os-utils
```

```javascript
// En src/server.js
const osUtils = require('node-os-utils');

setInterval(async () => {
  const cpu = await osUtils.cpu.usage();
  const mem = await osUtils.mem.info();
  
  console.log(`CPU: ${cpu}% | RAM: ${mem.usedMemMb}MB / ${mem.totalMemMb}MB`);
  
  // Alerta si está alto
  if (cpu > 80 || mem.usedMemPercentage > 80) {
    console.warn('⚠️ Recursos críticos!');
  }
}, 60000); // Cada minuto
```

---

## 🚀 Plan de escalamiento

### Fase 1: Gratis (0-30 usuarios)
- Railway/Render gratuito
- Sin optimizaciones necesarias

### Fase 2: Crecimiento (30-100 usuarios)
- Railway Hobby: $5-10/mes
- Implementar caché básico
- Optimizar queries

### Fase 3: Producción (100-300 usuarios)
- Railway Hobby+: $15-20/mes
- Caché avanzado (Redis)
- Load balancing si es necesario

### Fase 4: Enterprise (300+ usuarios)
- VPS dedicado o Railway Pro
- Base de datos separada
- CDN para assets estáticos
- Múltiples instancias

---

## 💰 Costos estimados reales

Para 200 usuarios activos simultáneos en día de elecciones:

**Railway Hobby:**
```
Base: $5/mes
RAM extra (1-2 GB): ~$5-10/mes
Total: ~$10-15/mes
```

**Render Standard:**
```
Precio fijo: $25/mes
PostgreSQL: $7/mes
Total: $32/mes
```

**VPS (DigitalOcean):**
```
Droplet 2GB RAM: $12/mes
PostgreSQL managed: $15/mes o auto-instalado gratis
Total: $12-27/mes
```

---

## ⚠️ Recomendación final

Para empezar:
1. ✅ Deploy en Railway GRATIS
2. ✅ Haz pruebas con 10-20 usuarios
3. ✅ Monitorea el uso de recursos
4. ⚠️ Si ves que se satura → Upgrade a Hobby ($5)

Para 200 usuarios en producción:
- **Railway Hobby con 2GB RAM** ($10-15/mes)
- **O VPS básico** ($5-12/mes)

No necesitas gastar mucho, pero gratis no aguantará 200 usuarios concurrentes.

---

## 🎯 Testing de carga

Antes del día importante, haz pruebas de carga:

```bash
# Instalar herramienta de testing
npm install -g artillery

# Crear test
artillery quick --count 200 --num 10 https://tu-app.railway.app
```

Esto simulará 200 usuarios haciendo 10 requests cada uno.
Verás si tu plan actual aguanta o no.

---

**Conclusión**: Empieza gratis, monitorea, y upgrade cuando lo necesites.
Railway hace súper fácil escalar con un click. 🚀
