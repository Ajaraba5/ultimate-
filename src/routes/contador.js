/**
 * 🛣️ CONTADOR ROUTES
 */

const express = require('express');
const router = express.Router();
const {
  getMisEstadisticas,
  getMisPersonas,
  marcarVoto,
  desmarcarVoto
} = require('../controllers/contadorController');
const { authenticateToken, requireContador } = require('../middlewares/auth');
const { votingLimiter, searchLimiter } = require('../middlewares/rateLimiter');

// Todas las rutas requieren autenticación y rol contador
router.use(authenticateToken);
router.use(requireContador);

// Dashboard del contador
router.get('/estadisticas', getMisEstadisticas);
router.get('/personas', searchLimiter, getMisPersonas);

// Marcar votos
router.post('/marcar-voto', votingLimiter, marcarVoto);
router.post('/desmarcar-voto', votingLimiter, desmarcarVoto);

module.exports = router;
