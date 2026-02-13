/**
 * 🛣️ AUTH ROUTES
 */

const express = require('express');
const router = express.Router();
const { login, logout, verifySession, changePassword } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/rateLimiter');

// Rutas públicas
router.post('/login', loginLimiter, login);

// Rutas protegidas
router.post('/logout', authenticateToken, logout);
router.get('/verify', authenticateToken, verifySession);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;
