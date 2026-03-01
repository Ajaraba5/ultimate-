/**
 * ⏱️ RATE LIMITING MIDDLEWARE
 * Protección contra ataques DDoS y brute force
 */

const rateLimit = require('express-rate-limit');
const { query } = require('../config/database');

/**
 * Rate limiter global para todas las rutas
 */
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Por favor intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // No limitar healthcheck ni archivos estáticos para evitar falsos positivos
  skip: (req) => {
    if (req.path === '/health') return true;
    if (req.path.startsWith('/css/') || req.path.startsWith('/js/') || req.path.startsWith('/uploads/')) return true;
    if (req.path.endsWith('.ico') || req.path.endsWith('.png') || req.path.endsWith('.jpg') || req.path.endsWith('.svg')) return true;
    return false;
  },
  // Usar IP del cliente
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  // Handler cuando se excede el límite
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Demasiadas solicitudes. Por favor intenta más tarde.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiter estricto para login (prevenir brute force)
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos
  message: {
    success: false,
    message: 'Demasiados intentos de login. Cuenta bloqueada temporalmente.'
  },
  skipSuccessfulRequests: true, // No contar requests exitosos
  keyGenerator: (req) => {
    // Limitar por IP y username
    const username = req.body.username || 'unknown';
    return `${req.ip}-${username}`;
  },
  handler: async (req, res) => {
    const username = req.body.username;
    const ipAddress = req.ip;
    
    // Registrar intento de brute force
    try {
      await query(
        `INSERT INTO audit_log (action, details, ip_address, user_agent, success)
         VALUES ($1, $2, $3, $4, false)`,
        [
          'BRUTE_FORCE_DETECTED',
          JSON.stringify({ username, attempts: 'exceeded' }),
          ipAddress,
          req.headers['user-agent']
        ]
      );
      
      console.warn(`🚨 Posible brute force attack - IP: ${ipAddress}, Username: ${username}`);
    } catch (error) {
      console.error('Error logging brute force:', error);
    }
    
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
      blockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
  }
});

/**
 * Rate limiter para importación de datos (operación costosa)
 */
const importLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100, // Máximo 100 importaciones por hora
  message: {
    success: false,
    message: 'Límite de importaciones alcanzado. Intenta más tarde.'
  },
  keyGenerator: (req) => {
    return req.user?.userId || req.ip;
  }
});

/**
 * Rate limiter para exportación de datos
 */
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // Máximo 20 exportaciones por hora
  message: {
    success: false,
    message: 'Límite de exportaciones alcanzado. Intenta más tarde.'
  },
  keyGenerator: (req) => {
    return req.user?.userId || req.ip;
  }
});

/**
 * Rate limiter para operaciones de votación
 */
const votingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // 60 votos por minuto (1 por segundo promedio)
  message: {
    success: false,
    message: 'Demasiados votos registrados muy rápido. Reduce la velocidad.'
  },
  keyGenerator: (req) => {
    return req.user?.userId || req.ip;
  }
});

/**
 * Rate limiter para búsquedas
 */
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 búsquedas por minuto
  message: {
    success: false,
    message: 'Demasiadas búsquedas. Por favor espera un momento.'
  },
  keyGenerator: (req) => {
    return req.user?.userId || req.ip;
  }
});

/**
 * Middleware personalizado para tracking de requests
 */
async function requestTracking(req, res, next) {
  const startTime = Date.now();
  
  // Log de la request
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.userId
    };
    
    // Log solo si tarda más de 200ms o es un error
    if (duration > 200 || res.statusCode >= 400) {
      console.warn('⚠️ Slow/Error request:', logData);
    }
  });
  
  next();
}

module.exports = {
  globalLimiter,
  loginLimiter,
  importLimiter,
  exportLimiter,
  votingLimiter,
  searchLimiter,
  requestTracking
};
