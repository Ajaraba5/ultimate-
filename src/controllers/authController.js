/**
 * 🔑 AUTH CONTROLLER
 * Manejo de autenticación y sesiones
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, transaction } = require('../config/database');
const { timingSafeEqual } = require('../middlewares/security');

/**
 * Login de usuario
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña requeridos'
      });
    }
    
    // Buscar usuario
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      // Log de intento fallido
      await logAuditEvent(null, 'LOGIN_FAILED', req, { 
        reason: 'user_not_found',
        username 
      }, false);
      
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      });
    }
    
    const user = result.rows[0];
    
    // Verificar si está bloqueado
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Usuario bloqueado temporalmente por intentos fallidos',
        blockedUntil: user.bloqueado_hasta
      });
    }
    
    // Verificar si está activo
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Usuario desactivado'
      });
    }
    
    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      // Incrementar intentos fallidos
      const newAttempts = user.intentos_fallidos + 1;
      const bloqueadoHasta = newAttempts >= 5 
        ? new Date(Date.now() + 15 * 60 * 1000) // Bloquear 15 minutos
        : null;
      
      await query(
        `UPDATE users 
         SET intentos_fallidos = $1, bloqueado_hasta = $2 
         WHERE id = $3`,
        [newAttempts, bloqueadoHasta, user.id]
      );
      
      await logAuditEvent(user.id, 'LOGIN_FAILED', req, {
        reason: 'wrong_password',
        attempts: newAttempts
      }, false);
      
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos',
        remainingAttempts: Math.max(0, 5 - newAttempts)
      });
    }
    
    // Login exitoso - Resetear intentos fallidos
    await query(
      `UPDATE users 
       SET intentos_fallidos = 0, 
           bloqueado_hasta = NULL, 
           ultimo_login = NOW() 
       WHERE id = $1`,
      [user.id]
    );
    
    // Generar JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );
    
    // Crear sesión
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 horas
    
    await query(
      `INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        tokenHash,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'],
        expiresAt
      ]
    );
    
    // Log de login exitoso
    await logAuditEvent(user.id, 'LOGIN_SUCCESS', req, { role: user.role }, true);
    
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          nombreCompleto: user.nombre_completo,
          email: user.email
        }
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
}

/**
 * Logout de usuario
 */
async function logout(req, res) {
  try {
    const userId = req.user.userId;
    
    // Eliminar todas las sesiones del usuario
    await query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    
    await logAuditEvent(userId, 'LOGOUT', req, {}, true);
    
    res.json({
      success: true,
      message: 'Logout exitoso'
    });
    
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error en logout'
    });
  }
}

/**
 * Verificar sesión actual
 */
async function verifySession(req, res) {
  try {
    const userId = req.user.userId;
    
    const result = await query(
      'SELECT id, username, role, nombre_completo, email FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Error verificando sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando sesión'
    });
  }
}

/**
 * Cambiar contraseña
 */
async function changePassword(req, res) {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva requeridas'
      });
    }
    
    // Validar nueva contraseña
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 8 caracteres'
      });
    }
    
    // Obtener usuario
    const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    
    // Verificar contraseña actual
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!passwordMatch) {
      await logAuditEvent(userId, 'PASSWORD_CHANGE_FAILED', req, {
        reason: 'wrong_current_password'
      }, false);
      
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }
    
    // Hash nueva contraseña
    const newPasswordHash = await bcrypt.hash(
      newPassword, 
      parseInt(process.env.BCRYPT_ROUNDS) || 12
    );
    
    // Actualizar contraseña
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );
    
    // Invalidar todas las sesiones (forzar re-login)
    await query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    
    await logAuditEvent(userId, 'PASSWORD_CHANGED', req, {}, true);
    
    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente. Por favor inicia sesión nuevamente.'
    });
    
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error cambiando contraseña'
    });
  }
}

/**
 * Helper para log de auditoría
 */
async function logAuditEvent(userId, action, req, details, success) {
  try {
    await query(
      `INSERT INTO audit_log (user_id, action, details, ip_address, user_agent, success)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        action,
        JSON.stringify(details),
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'],
        success
      ]
    );
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

module.exports = {
  login,
  logout,
  verifySession,
  changePassword
};
