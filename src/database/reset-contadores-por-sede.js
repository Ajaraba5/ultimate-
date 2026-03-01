const bcrypt = require('bcryptjs');
const { query, transaction, testConnection, closePool } = require('../config/database');

function normalizeSegment(text) {
  if (!text) return 'sede';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20) || 'sede';
}

async function main() {
  console.log('♻️ Reset total de contadores por sede');

  const connected = await testConnection();
  if (!connected) {
    throw new Error('No hay conexión a PostgreSQL');
  }

  const defaultPassword = process.env.AUTO_CONTADOR_PASSWORD || 'Contador123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const result = await transaction(async (client) => {
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS lugar_votacion_id INTEGER REFERENCES lugares_votacion(id) ON DELETE SET NULL');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS mesa VARCHAR(20)');

    await client.query('UPDATE personas SET contador_id = NULL');
    const deleted = await client.query("DELETE FROM users WHERE role = 'contador'");

    const sedesResult = await client.query(`
      SELECT
        p.lugar_votacion_id,
        lv.nombre AS sede,
        COUNT(*)::INTEGER AS total_personas
      FROM personas p
      JOIN lugares_votacion lv ON lv.id = p.lugar_votacion_id
      WHERE p.lugar_votacion_id IS NOT NULL
      GROUP BY p.lugar_votacion_id, lv.nombre
      ORDER BY lv.nombre
    `);

    let created = 0;

    for (const sede of sedesResult.rows) {
      const baseUsername = `cnt_sede_${sede.lugar_votacion_id}_${normalizeSegment(sede.sede)}`.slice(0, 45);
      let username = baseUsername;
      let suffix = 1;

      while (true) {
        const exists = await client.query('SELECT 1 FROM users WHERE username = $1 LIMIT 1', [username]);
        if (exists.rows.length === 0) break;
        suffix++;
        username = `${baseUsername}_${suffix}`.slice(0, 50);
      }

      const nombreCompleto = `Contador ${sede.sede}`.slice(0, 100);

      await client.query(
        `INSERT INTO users (
          username, password_hash, role, nombre_completo,
          is_active, lugar_votacion_id, mesa
        ) VALUES ($1, $2, 'contador', $3, true, $4, NULL)`,
        [username, passwordHash, nombreCompleto, sede.lugar_votacion_id]
      );

      created++;
    }

    const asignados = await client.query(`
      UPDATE personas p
      SET contador_id = u.id
      FROM users u
      WHERE u.role = 'contador'
        AND u.is_active = true
        AND u.lugar_votacion_id IS NOT NULL
        AND p.lugar_votacion_id = u.lugar_votacion_id
    `);

    const pendientes = await client.query(`
      SELECT COUNT(*)::INTEGER AS total
      FROM personas
      WHERE lugar_votacion_id IS NOT NULL
        AND contador_id IS NULL
    `);

    return {
      contadoresEliminados: deleted.rowCount,
      sedesDetectadas: sedesResult.rows.length,
      contadoresCreados: created,
      personasAsignadas: asignados.rowCount,
      personasSinContadorConSede: pendientes.rows[0].total,
      passwordDefecto: defaultPassword
    };
  });

  console.log('✅ Proceso completado');
  console.log(result);
}

main()
  .then(async () => {
    await closePool();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('❌ Error:', error.message);
    await closePool();
    process.exit(1);
  });
