/**
 * ⚠️ ERROR HANDLER MIDDLEWARE
 * Manejo centralizado de errores
 */

const { query } = require('../config/database');

/**
 * Handler 404 - Ruta no encontrada
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
}

/**
 * Handler de errores global
 */
async function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);
  
  // Log del error en audit_log
  try {
    await query(
      `INSERT INTO audit_log (user_id, action, details, ip_address, user_agent, success, error_message)
       VALUES ($1, $2, $3, $4, $5, false, $6)`,
      [
        req.user?.userId || null,
        'ERROR',
        JSON.stringify({
          path: req.path,
          method: req.method,
          body: req.body
        }),
        req.ip,
        req.headers['user-agent'],
        err.message
      ]
    );
  } catch (logError) {
    console.error('Error logging error:', logError);
  }
  
  // Determinar código de estado
  const statusCode = err.statusCode || err.status || 500;
  
  // No exponer detalles internos en producción
  const message = process.env.NODE_ENV === 'production' 
    ? 'Error interno del servidor'
    : err.message;
  
  const response = {
    success: false,
    message: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  };
  
  res.status(statusCode).json(response);
}

/**
 * Handler para errores de validación
 */
function validationErrorHandler(errors) {
  return {
    success: false,
    message: 'Errores de validación',
    errors: errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }))
  };
}

/**
 * AsyncHandler wrapper para evitar try-catch en cada ruta
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  notFoundHandler,
  errorHandler,
  validationErrorHandler,
  asyncHandler
};
