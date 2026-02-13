/**
 * 🗄️ CONFIGURACIÓN DE BASE DE DATOS POSTGRESQL
 * Sistema de Votación Electoral Enterprise v3.0.0
 * Configuración optimizada con pooling y reconexión automática
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Configuración de conexión con soporte para DATABASE_URL (cloud platforms)
const poolConfig = process.env.DATABASE_URL 
  ? {
      // Configuración para servicios cloud (Heroku, Railway, Render, etc.)
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false // Necesario para muchos servicios cloud
      } : false,
    }
  : {
      // Configuración tradicional con variables individuales
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'electoral_system',
      user: process.env.DB_USER || 'postgres',
      password: String(process.env.DB_PASSWORD || ''),
    };

// Pool de conexiones con configuración enterprise
const pool = new Pool({
  ...poolConfig,
  
  // Configuración de pool optimizada
  max: 20,                    // 20 conexiones máximas paralelas
  min: 5,                     // 5 conexiones mínimas siempre activas
  idleTimeoutMillis: 30000,   // Cerrar conexiones inactivas después de 30s
  connectionTimeoutMillis: 5000, // Timeout de conexión 5s
  
  // Configuración de statement timeout para prevenir queries lentas
  statement_timeout: 30000,   // 30 segundos máximo por query
  
  // Configuración de keep-alive para conexiones persistentes
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Event listeners para monitoreo
pool.on('connect', (client) => {
  console.log('✅ Nueva conexión a PostgreSQL establecida');
});

pool.on('error', (err, client) => {
  console.error('❌ Error inesperado en cliente PostgreSQL:', err);
  process.exit(-1);
});

pool.on('remove', () => {
  console.log('⚠️ Conexión removida del pool');
});

// Health check de la base de datos
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL exitosa:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    return false;
  }
}

// Query helper con logging
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log solo si la query tarda más de 100ms
    if (duration > 100) {
      console.log('⚠️ Query lenta ejecutada:', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
}

// Transaction helper
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Graceful shutdown
async function closePool() {
  try {
    await pool.end();
    console.log('✅ Pool de PostgreSQL cerrado correctamente');
  } catch (error) {
    console.error('❌ Error cerrando pool:', error);
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  closePool
};
