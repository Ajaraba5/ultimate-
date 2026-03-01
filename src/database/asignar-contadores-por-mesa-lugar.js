const bcrypt = require('bcryptjs');
const { query, testConnection, closePool, transaction } = require('../config/database');

function normalizeSegment(text) {
  if (!text) return 'na';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20) || 'na';
}

async function ensureColumns() {
  await query('ALTER TABLE personas ADD COLUMN IF NOT EXISTS mesa VARCHAR(20)');
  await query('CREATE INDEX IF NOT EXISTS idx_personas_mesa ON personas(mesa)');
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS lugar_votacion_id INTEGER REFERENCES lugares_votacion(id) ON DELETE SET NULL');
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS mesa VARCHAR(20)');
}

async function buildCounterUsers(defaultPassword) {
  const gruposResult = await query(`
    SELECT
      p.lugar_votacion_id,
      lv.nombre AS lugar_nombre,
      COUNT(*)::INTEGER AS total_personas
    FROM personas p
    JOIN lugares_votacion lv ON lv.id = p.lugar_votacion_id
    WHERE p.lugar_votacion_id IS NOT NULL
    GROUP BY p.lugar_votacion_id, lv.nombre
    ORDER BY lv.nombre
  `);

  const grupos = gruposResult.rows;
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  let created = 0;
  let reused = 0;
  let disabledOldMesaUsers = 0;

  for (const grupo of grupos) {
    const lugarId = grupo.lugar_votacion_id;

    const existingBySede = await query(
      `SELECT id, username FROM users
       WHERE role = 'contador'
         AND lugar_votacion_id = $1
         AND (mesa IS NULL OR TRIM(COALESCE(mesa, '')) = '')
       LIMIT 1`,
      [lugarId]
    );

    let selectedUserId;

    if (existingBySede.rows.length > 0) {
      selectedUserId = existingBySede.rows[0].id;
      reused++;
    } else {
      const baseUsername = `cnt_sede_${lugarId}_${normalizeSegment(grupo.lugar_nombre)}`.slice(0, 45);
      let username = baseUsername;
      let suffix = 1;

      while (true) {
        const exists = await query('SELECT 1 FROM users WHERE username = $1 LIMIT 1', [username]);
        if (exists.rows.length === 0) break;
        suffix++;
        const candidate = `${baseUsername}_${suffix}`;
        username = candidate.slice(0, 50);
      }

      const nombreCompleto = `Contador ${grupo.lugar_nombre}`.slice(0, 100);

      const insertResult = await query(
        `INSERT INTO users (
          username, password_hash, role, nombre_completo,
          is_active, lugar_votacion_id, mesa
        ) VALUES ($1, $2, 'contador', $3, true, $4, NULL)
        RETURNING id`,
        [username, passwordHash, nombreCompleto, lugarId]
      );

      selectedUserId = insertResult.rows[0].id;
      created++;
    }

    const disableResult = await query(
      `UPDATE users
       SET is_active = false, updated_at = NOW()
       WHERE role = 'contador'
         AND lugar_votacion_id = $1
         AND mesa IS NOT NULL
         AND id <> $2`,
      [lugarId, selectedUserId]
    );
    disabledOldMesaUsers += disableResult.rowCount;
  }

  return {
    grupos: grupos.length,
    usersCreated: created,
    usersReused: reused,
    oldMesaUsersDisabled: disabledOldMesaUsers
  };
}

async function assignPeopleToCounters() {
  const result = await query(`
    UPDATE personas p
    SET contador_id = u.id
    FROM users u
    WHERE u.role = 'contador'
      AND u.is_active = true
      AND u.lugar_votacion_id IS NOT NULL
      AND p.lugar_votacion_id = u.lugar_votacion_id
      AND (u.mesa IS NULL OR TRIM(COALESCE(u.mesa, '')) = '')
      AND p.lugar_votacion_id IS NOT NULL
  `);

  const pendientes = await query(`
    SELECT COUNT(*)::INTEGER AS total
    FROM personas
    WHERE lugar_votacion_id IS NOT NULL
      AND contador_id IS NULL
  `);

  return {
    personasAsignadas: result.rowCount,
    sinContador: pendientes.rows[0].total
  };
}

async function main() {
  console.log('👥 Asignación automática de contadores por Sede (Lugar de Votación)');

  const connected = await testConnection();
  if (!connected) {
    throw new Error('No fue posible conectar a PostgreSQL');
  }

  const defaultPassword = process.env.AUTO_CONTADOR_PASSWORD || 'Contador123!';

  const output = await transaction(async () => {
    await ensureColumns();
    const usersStats = await buildCounterUsers(defaultPassword);
    const assignStats = await assignPeopleToCounters();

    const resumen = await query(`
      SELECT
        COUNT(*) FILTER (WHERE role = 'contador')::INTEGER AS total_contadores,
        COUNT(*) FILTER (WHERE role = 'contador' AND lugar_votacion_id IS NOT NULL AND (mesa IS NULL OR TRIM(COALESCE(mesa,'')) = ''))::INTEGER AS contadores_auto_sede,
        (SELECT COUNT(*)::INTEGER FROM personas WHERE contador_id IS NOT NULL) AS personas_con_contador
      FROM users
    `);

    return {
      ...usersStats,
      ...assignStats,
      ...resumen.rows[0]
    };
  });

  console.log('✅ Proceso completado');
  console.log(output);
  console.log(`🔐 Password por defecto para nuevos contadores: ${defaultPassword}`);
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
