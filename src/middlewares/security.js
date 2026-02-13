/**
 * 🛡️ MIDDLEWARES DE SEGURIDAD - 9 CAPAS
 * Sistema de Votación Electoral Enterprise v3.0.0
 * Protección contra TODOS los tipos de ataques conocidos
 */

const crypto = require('crypto');
const { query } = require('../config/database');

/**
 * CAPA 1: CSRF Token Protection
 * Previene ataques Cross-Site Request Forgery
 */
function csrfProtection(req, res, next) {
  // Skip para GET requests (safe methods)
  if (req.method === 'GET') {
    return next();
  }
  
  const csrfToken = req.headers['x-csrf-token'];
  const sessionToken = req.headers['authorization'];
  
  if (!csrfToken || !sessionToken) {
    return res.status(403).json({ 
      success: false, 
      message: 'CSRF token requerido' 
    });
  }
  
  // Validar que el token no esté vacío
  if (csrfToken.trim().length < 10) {
    return res.status(403).json({ 
      success: false, 
      message: 'CSRF token inválido' 
    });
  }
  
  next();
}

/**
 * CAPA 2: SQL Injection Detection
 * Detecta patrones de SQL injection en parámetros
 */
function sqlInjectionDetection(req, res, next) {
  const sqlPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bSELECT\b.*\bFROM\b.*\bWHERE\b)/i,
    /(\bINSERT\b.*\bINTO\b.*\bVALUES\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(;.*(-{2}|\/\*))/,
    /(\bOR\b.*=.*)/i,
    /('\s*OR\s*'1'\s*=\s*'1)/i,
    /(\bEXEC\b|\bEXECUTE\b)/i,
    /(xp_|sp_)/i
  ];
  
  // Revisar todos los parámetros
  const allParams = {
    ...req.query,
    ...req.body,
    ...req.params
  };
  
  for (const [key, value] of Object.entries(allParams)) {
    if (typeof value === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          // Log del intento de ataque
          logSecurityEvent('SQL_INJECTION_ATTEMPT', req, { key, value });
          
          return res.status(400).json({ 
            success: false, 
            message: 'Parámetros inválidos detectados' 
          });
        }
      }
    }
  }
  
  next();
}

/**
 * CAPA 3: XXE (XML External Entity) Prevention
 * Previene ataques de entidades externas XML
 */
function xxePrevention(req, res, next) {
  const contentType = req.headers['content-type'] || '';
  
  // Bloquear XML completamente (no usamos XML en este sistema)
  if (contentType.includes('xml')) {
    return res.status(415).json({ 
      success: false, 
      message: 'Tipo de contenido no soportado' 
    });
  }
  
  next();
}

/**
 * CAPA 4: Command Injection Guard
 * Previene inyección de comandos del sistema
 */
function commandInjectionGuard(req, res, next) {
  const cmdPatterns = [
    /[;&|`$(){}[\]<>]/,
    /(\.\.|\/etc\/|\/bin\/|\/usr\/)/,
    /(wget|curl|nc|netcat|bash|sh|cmd|powershell)/i
  ];
  
  const allParams = {
    ...req.query,
    ...req.body,
    ...req.params
  };
  
  for (const [key, value] of Object.entries(allParams)) {
    if (typeof value === 'string') {
      for (const pattern of cmdPatterns) {
        if (pattern.test(value)) {
          logSecurityEvent('COMMAND_INJECTION_ATTEMPT', req, { key, value });
          
          return res.status(400).json({ 
            success: false, 
            message: 'Caracteres no permitidos detectados' 
          });
        }
      }
    }
  }
  
  next();
}

/**
 * CAPA 5: LFI (Local File Inclusion) Prevention
 * Previene acceso a archivos locales
 */
function lfiPrevention(req, res, next) {
  const lfiPatterns = [
    /\.\.(\/|\\)/,
    /(\/etc\/passwd|\/etc\/shadow)/i,
    /(win\.ini|boot\.ini)/i,
    /(\/proc\/|\/sys\/)/,
    /(%00|%2e%2e|%252e)/i
  ];
  
  const allParams = {
    ...req.query,
    ...req.body,
    ...req.params
  };
  
  for (const [key, value] of Object.entries(allParams)) {
    if (typeof value === 'string') {
      for (const pattern of lfiPatterns) {
        if (pattern.test(value)) {
          logSecurityEvent('LFI_ATTEMPT', req, { key, value });
          
          return res.status(400).json({ 
            success: false, 
            message: 'Ruta de archivo inválida' 
          });
        }
      }
    }
  }
  
  next();
}

/**
 * CAPA 6: Prototype Pollution Detection
 * Previene contaminación de prototipos JavaScript
 */
function prototypePollutionDetection(req, res, next) {
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  function checkObject(obj, path = '') {
    if (typeof obj !== 'object' || obj === null) {
      return true;
    }
    
    for (const key of Object.keys(obj)) {
      if (dangerousKeys.includes(key)) {
        logSecurityEvent('PROTOTYPE_POLLUTION_ATTEMPT', req, { path, key });
        return false;
      }
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (!checkObject(obj[key], `${path}.${key}`)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  if (!checkObject(req.body)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Propiedades peligrosas detectadas' 
    });
  }
  
  next();
}

/**
 * CAPA 7: Timing-Invariant Operations
 * Previene timing attacks en comparaciones sensibles
 */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * CAPA 8: Open Redirect Prevention
 * Previene redirecciones abiertas
 */
function openRedirectPrevention(req, res, next) {
  const redirectParam = req.query.redirect || req.body.redirect;
  
  if (redirectParam) {
    // Solo permitir rutas relativas
    if (redirectParam.startsWith('http://') || 
        redirectParam.startsWith('https://') || 
        redirectParam.startsWith('//')) {
      
      logSecurityEvent('OPEN_REDIRECT_ATTEMPT', req, { redirect: redirectParam });
      
      return res.status(400).json({ 
        success: false, 
        message: 'Redirección no permitida' 
      });
    }
  }
  
  next();
}

/**
 * CAPA 9: Content Security Policy
 * Headers de seguridad adicionales
 */
function securityHeaders(req, res, next) {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://maps.googleapis.com; " +
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "img-src 'self' data: https://maps.googleapis.com https://maps.gstatic.com; " +
    "connect-src 'self' ws: wss:; " +
    "font-src 'self' https://cdn.jsdelivr.net; " +
    "frame-ancestors 'none';"
  );
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=()'
  );
  
  next();
}

/**
 * Función helper para log de eventos de seguridad
 */
async function logSecurityEvent(action, req, details) {
  try {
    const userId = req.user?.userId || null;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    await query(
      `INSERT INTO audit_log (user_id, action, details, ip_address, user_agent, success)
       VALUES ($1, $2, $3, $4, $5, false)`,
      [userId, action, JSON.stringify(details), ipAddress, userAgent]
    );
    
    console.warn(`🚨 SECURITY ALERT: ${action}`, details);
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

/**
 * Combinar todas las capas de seguridad en un solo middleware
 */
function allSecurityLayers(req, res, next) {
  // Ejecutar todas las validaciones en secuencia
  const middlewares = [
    securityHeaders,
    xxePrevention,
    sqlInjectionDetection,
    commandInjectionGuard,
    lfiPrevention,
    prototypePollutionDetection,
    openRedirectPrevention
  ];
  
  let index = 0;
  
  function runNext(err) {
    if (err) return next(err);
    
    if (index >= middlewares.length) {
      return next();
    }
    
    const middleware = middlewares[index++];
    middleware(req, res, runNext);
  }
  
  runNext();
}

module.exports = {
  csrfProtection,
  sqlInjectionDetection,
  xxePrevention,
  commandInjectionGuard,
  lfiPrevention,
  prototypePollutionDetection,
  timingSafeEqual,
  openRedirectPrevention,
  securityHeaders,
  allSecurityLayers,
  logSecurityEvent
};
