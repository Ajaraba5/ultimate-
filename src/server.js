/**
 * 🚀 SERVIDOR PRINCIPAL
 * Sistema de Votación Electoral Enterprise v3.0.0
 * La Fortaleza Digital de la Democracia
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Importar configuración y middlewares
const { testConnection, closePool } = require('./config/database');
const { allSecurityLayers } = require('./middlewares/security');
const { globalLimiter, requestTracking } = require('./middlewares/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// Importar routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const contadorRoutes = require('./routes/contador');
const apiRoutes = require('./routes/api');

// Importar WebSocket handler
const initializeSocket = require('./socket/socketHandler');

// Crear app Express
const app = express();
const server = http.createServer(app);

// Confiar en proxies (necesario para Cloudflare, Railway, etc.)
app.set('trust proxy', true);

// Configuración de CORS según entorno
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

// Si se permite acceso externo (para ngrok, tunnels, etc.)
const corsOrigin = process.env.ALLOW_EXTERNAL_ACCESS === 'true' 
  ? true // Permite cualquier origen (usar solo para demos/desarrollo)
  : allowedOrigins;

// Inicializar Socket.IO
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// ===================================
// MIDDLEWARES GLOBALES
// ===================================

// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: false // Lo manejamos manualmente
}));

// CORS
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

// Compression (Gzip)
app.use(compression());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Morgan logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request tracking
app.use(requestTracking);

// Rate limiting global
app.use(globalLimiter);

// Seguridad: 9 capas
app.use(allSecurityLayers);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// ===================================
// HEALTH CHECK
// ===================================

app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbConnected ? 'connected' : 'disconnected',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    version: '3.0.0'
  });
});

// ===================================
// API ROUTES
// ===================================

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contador', contadorRoutes);
app.use('/api/data', apiRoutes);

// ===================================
// SERVIR FRONTEND
// ===================================

// Login page (default)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Contador dashboard
app.get('/contador', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/contador.html'));
});

// Mapa electoral
app.get('/mapa', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/mapa.html'));
});

// ===================================
// ERROR HANDLERS
// ===================================

// 404 handler
app.use(notFoundHandler);

// Error handler global
app.use(errorHandler);

// ===================================
// INICIALIZAR SERVIDOR
// ===================================

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('🚀 Iniciando Sistema de Votación Electoral Enterprise v3.0.0...');
    console.log('🏰 La Fortaleza Digital de la Democracia');
    console.log('');
    
    // Test de base de datos
    console.log('📡 Conectando a PostgreSQL...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos');
      console.error('💡 Verifica tu configuración en .env');
      console.error('💡 Ejecuta: npm run setup-db para inicializar la BD');
      process.exit(1);
    }
    
    // Inicializar WebSocket
    console.log('🔌 Inicializando WebSocket...');
    initializeSocket(io);
    
    // Iniciar servidor
    server.listen(PORT, () => {
      console.log('');
      console.log('✅ ========================================');
      console.log('✅ SISTEMA INICIADO EXITOSAMENTE');
      console.log('✅ ========================================');
      console.log('');
      console.log(`🌐 Servidor HTTP: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('📌 Credenciales de acceso:');
      console.log('   👨‍💼 Admin: admin / Admin123!');
      console.log('   📊 Contador: contador1 / Contador123!');
      console.log('');
      console.log('🔐 Capas de seguridad activas: 9');
      console.log('⚡ Rate limiting: ACTIVO');
      console.log('📊 Monitoring: ACTIVO');
      console.log('🛡️ CSRF Protection: ACTIVO');
      console.log('');
      console.log('🎊 ¡Sistema listo para producción!');
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error fatal iniciando servidor:', error);
    process.exit(1);
  }
}

// ===================================
// GRACEFUL SHUTDOWN
// ===================================

async function gracefulShutdown(signal) {
  console.log('');
  console.log(`⚠️ Señal ${signal} recibida. Cerrando servidor...`);
  
  server.close(() => {
    console.log('✅ Servidor HTTP cerrado');
  });
  
  // Cerrar conexiones Socket.IO
  io.close(() => {
    console.log('✅ WebSocket cerrado');
  });
  
  // Cerrar pool de base de datos
  await closePool();
  
  console.log('✅ Shutdown completado');
  process.exit(0);
}

// Escuchar señales de terminación
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // En producción registramos el error y mantenemos el proceso vivo para evitar caídas por picos temporales.
  // Si necesitas estrategia fail-fast, usar PM2/systemd con restart policy.
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // No apagar el proceso por rechazos no manejados puntuales bajo carga.
});

// Iniciar servidor
startServer();

// Exportar para testing
module.exports = { app, server, io };
