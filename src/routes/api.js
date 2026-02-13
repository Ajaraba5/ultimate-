/**
 * 🛣️ API ROUTES (Import/Export)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { importarExcel } = require('../controllers/importController');
const { exportarCompleto } = require('../controllers/exportController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const { importLimiter, exportLimiter } = require('../middlewares/rateLimiter');

// Configurar multer para uploads en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Solo archivos Excel (.xlsx, .xls) permitidos'));
    }
  }
});

// Todas las rutas requieren autenticación y rol admin
router.use(authenticateToken);
router.use(requireAdmin);

// Import/Export (sin límites de rate para importaciones)
router.post('/import', upload.single('file'), importarExcel);
router.get('/export', exportarCompleto);

module.exports = router;
