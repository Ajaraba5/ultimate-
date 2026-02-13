/**
 * 🔐 MIDDLEWARE DE AUTENTICACIÓN JWT
 * Sistema de Votación Electoral Enterprise v3.0.0
 */

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Middleware para verificar JWT token
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de autenticación no proporcionado' 
      });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar si la sesión existe y no ha expirado
    const sessionResult = await query(
      `SELECT s.*, u.is_active, u.role, u.username, u.nombre_completo
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE u.id = $1 AND s.expires_at > NOW()
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [decoded.userId]
    );
    
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Sesión expirada o inválida' 
      });
    }
    
    const session = sessionResult.rows[0];
    
    // Verificar si el usuario está activo
    if (!session.is_active) {
      return res.status(403).json({ 
        success: false, 
        message: 'Usuario desactivado' 
      });
    }
    
    // Agregar información del usuario al request
    req.user = {
      userId: decoded.userId,
      username: session.username,
      role: session.role,
      nombreCompleto: session.nombre_completo
    };
    
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado' 
      });
    }
    
    console.error('Error en autenticación:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error en autenticación' 
    });
  }
}

/**
 * Middleware para verificar rol de administrador
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado. Solo administradores.' 
    });
  }
  next();
}

/**
 * Middleware para verificar rol de contador
 */
function requireContador(req, res, next) {
  if (req.user.role !== 'contador') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado. Solo contadores.' 
    });
  }
  next();
}

/**
 * Middleware flexible que permite admin o contador
 */
function requireAuthenticated(req, res, next) {
  if (!req.user || !['admin', 'contador'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado' 
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireContador,
  requireAuthenticated
};
