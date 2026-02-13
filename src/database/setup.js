/**
 * 🔧 SETUP DE BASE DE DATOS
 * Inicialización automática del schema
 */

const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('../config/database');

async function setupDatabase() {
  console.log('🚀 Iniciando setup de base de datos...');
  
  try {
    // Test de conexión
    console.log('📡 Verificando conexión a PostgreSQL...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ No se pudo conectar a PostgreSQL. Verifica tu configuración en .env');
      process.exit(1);
    }
    
    // Leer schema SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Separar VACUUM del resto (VACUUM no puede ejecutarse en transacción)
    const sqlStatements = schemaSQL.split('VACUUM ANALYZE;');
    
    console.log('📄 Ejecutando schema SQL...');
    await pool.query(sqlStatements[0]);
    
    // Ejecutar VACUUM por separado (fuera de transacción)
    if (sqlStatements.length > 1) {
      console.log('🧹 Optimizando base de datos...');
      await pool.query('VACUUM ANALYZE');
    }
    
    console.log('✅ Base de datos inicializada correctamente');
    console.log('✅ Tablas creadas');
    console.log('✅ Índices optimizados');
    console.log('✅ Triggers activos');
    console.log('✅ Datos iniciales insertados');
    console.log('');
    console.log('🎊 Sistema listo para usar!');
    console.log('');
    console.log('📌 Credenciales de acceso:');
    console.log('   Admin - Usuario: admin, Password: Admin123!');
    console.log('   Contador - Usuario: contador1, Password: Contador123!');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia estas contraseñas en producción');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante el setup:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar setup
setupDatabase();
