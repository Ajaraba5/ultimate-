/**
 * 🔧 SETUP SEGURO DE BASE DE DATOS
 * Inicializa schema solo si la BD está vacía (ideal para deploy automático)
 */

const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('../config/database');

async function main() {
  console.log('🚀 Iniciando setup seguro de base de datos...');

  try {
    console.log('📡 Verificando conexión a PostgreSQL...');
    const connected = await testConnection();

    if (!connected) {
      console.error('❌ No se pudo conectar a PostgreSQL. Verifica DATABASE_URL o variables DB_*');
      process.exit(1);
    }

    const existsResult = await pool.query("SELECT to_regclass('public.users') AS users_table");
    const usersTableExists = Boolean(existsResult.rows[0]?.users_table);

    if (usersTableExists) {
      console.log('✅ Esquema detectado (tabla users existe). No se ejecuta setup destructivo.');
      process.exit(0);
    }

    console.log('ℹ️ Esquema no detectado. Ejecutando setup inicial...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    const sqlStatements = schemaSQL.split('VACUUM ANALYZE;');

    await pool.query(sqlStatements[0]);

    if (sqlStatements.length > 1) {
      await pool.query('VACUUM ANALYZE');
    }

    console.log('✅ Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante setup seguro:', error.message);
    process.exit(1);
  }
}

main();
