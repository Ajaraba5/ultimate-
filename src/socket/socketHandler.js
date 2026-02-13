/**
 * 🔌 WEBSOCKET HANDLER
 * Real-time updates con Socket.IO
 */

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

function initializeSocket(io) {
  // Middleware de autenticación para Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Token no proporcionado'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar sesión
      const result = await query(
        'SELECT u.* FROM users u WHERE u.id = $1 AND u.is_active = true',
        [decoded.userId]
      );
      
      if (result.rows.length === 0) {
        return next(new Error('Usuario no encontrado'));
      }
      
      socket.user = {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role
      };
      
      next();
    } catch (error) {
      next(new Error('Autenticación fallida'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`✅ Usuario conectado: ${socket.user.username} (${socket.user.role})`);
    
    // Unirse a sala según rol
    if (socket.user.role === 'admin') {
      socket.join('admins');
      console.log(`👨‍💼 Admin ${socket.user.username} unido a sala admins`);
    } else if (socket.user.role === 'contador') {
      socket.join('contadores');
      socket.join(`contador-${socket.user.userId}`);
      console.log(`📊 Contador ${socket.user.username} unido a salas`);
    }
    
    // Evento: Voto marcado
    socket.on('voto-marcado', async (data) => {
      try {
        // Emitir a todos los admins
        io.to('admins').emit('voto-actualizado', {
          personaId: data.personaId,
          contadorId: socket.user.userId,
          timestamp: new Date().toISOString()
        });
        
        // Obtener estadísticas actualizadas
        const statsResult = await query(`
          SELECT 
            COUNT(*)::INTEGER as total_personas,
            COUNT(*) FILTER (WHERE voto = true)::INTEGER as total_votados,
            ROUND(COUNT(*) FILTER (WHERE voto = true) * 100.0 / NULLIF(COUNT(*), 0), 2) as porcentaje
          FROM personas
        `);
        
        // Emitir estadísticas actualizadas a admins
        io.to('admins').emit('estadisticas-actualizadas', statsResult.rows[0]);
        
        console.log(`📊 Voto marcado por ${socket.user.username}`);
        
      } catch (error) {
        console.error('Error en voto-marcado:', error);
      }
    });
    
    // Evento: Solicitar estadísticas en tiempo real
    socket.on('solicitar-estadisticas', async () => {
      try {
        const statsResult = await query(`
          SELECT 
            COUNT(*)::INTEGER as total_personas,
            COUNT(*) FILTER (WHERE voto = true)::INTEGER as total_votados,
            COUNT(*) FILTER (WHERE voto = false)::INTEGER as total_pendientes,
            ROUND(COUNT(*) FILTER (WHERE voto = true) * 100.0 / NULLIF(COUNT(*), 0), 2) as porcentaje,
            COUNT(*) FILTER (WHERE partido = 'ROJO' AND voto = true)::INTEGER as votados_rojo,
            COUNT(*) FILTER (WHERE partido = 'VERDE' AND voto = true)::INTEGER as votados_verde
          FROM personas
        `);
        
        socket.emit('estadisticas-actualizadas', statsResult.rows[0]);
        
      } catch (error) {
        console.error('Error en solicitar-estadisticas:', error);
      }
    });
    
    // Evento: Notificar cambio en asignaciones
    socket.on('asignacion-cambiada', (data) => {
      // Notificar al contador afectado
      io.to(`contador-${data.contadorId}`).emit('asignacion-actualizada', {
        mensaje: 'Tus asignaciones han sido actualizadas',
        timestamp: new Date().toISOString()
      });
    });
    
    // Evento: Broadcast de mensaje del admin
    socket.on('admin-broadcast', (data) => {
      if (socket.user.role === 'admin') {
        io.to('contadores').emit('mensaje-admin', {
          mensaje: data.mensaje,
          timestamp: new Date().toISOString()
        });
        
        console.log(`📢 Admin ${socket.user.username} envió broadcast: ${data.mensaje}`);
      }
    });
    
    // Desconexión
    socket.on('disconnect', () => {
      console.log(`❌ Usuario desconectado: ${socket.user.username}`);
    });
    
    // Error handler
    socket.on('error', (error) => {
      console.error(`⚠️ Socket error para ${socket.user.username}:`, error);
    });
  });
  
  // Función helper para emitir estadísticas periódicas (cada 10 segundos)
  setInterval(async () => {
    try {
      const statsResult = await query(`
        SELECT 
          COUNT(*)::INTEGER as total_personas,
          COUNT(*) FILTER (WHERE voto = true)::INTEGER as total_votados,
          ROUND(COUNT(*) FILTER (WHERE voto = true) * 100.0 / NULLIF(COUNT(*), 0), 2) as porcentaje
        FROM personas
      `);
      
      // Emitir a todos los admins conectados
      io.to('admins').emit('heartbeat-estadisticas', statsResult.rows[0]);
      
    } catch (error) {
      console.error('Error en heartbeat estadísticas:', error);
    }
  }, 10000); // Cada 10 segundos
  
  console.log('✅ Socket.IO inicializado y configurado');
}

module.exports = initializeSocket;
