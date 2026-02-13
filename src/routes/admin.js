/**
 * 🛣️ ADMIN ROUTES
 */

const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getPersonas,
  updatePersona,
  buscarLider,
  getAllLideres,
  getPersonasByLider,
  getContadores,
  createContador,
  deleteContador,
  asignarPersonasContador,
  getMapaElectoral,
  resetDatabase
} = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const { searchLimiter } = require('../middlewares/rateLimiter');

// Todas las rutas requieren autenticación y rol admin
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard y estadísticas
router.get('/dashboard', getDashboard);
router.get('/mapa', getMapaElectoral);

// Gestión de personas
router.get('/personas', searchLimiter, getPersonas);
router.put('/personas/:id', updatePersona);
router.get('/buscar-lider', searchLimiter, buscarLider);

// Gestión de líderes
router.get('/lideres', getAllLideres);
router.get('/lideres/:id/personas', getPersonasByLider);

// Gestión de contadores
router.get('/contadores', getContadores);
router.post('/contadores', createContador);
router.delete('/contadores/:id', deleteContador);
router.post('/asignar-personas', asignarPersonasContador);

// Operaciones críticas
router.post('/reset-database', resetDatabase);

module.exports = router;
