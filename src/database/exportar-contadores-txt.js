const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { query, testConnection, closePool } = require('../config/database');

const CANDIDATE_PASSWORDS = [
  'Contador123!',
  'Admin123!'
];

async function detectPassword(passwordHash) {
  for (const password of CANDIDATE_PASSWORDS) {
    const ok = await bcrypt.compare(password, passwordHash);
    if (ok) return password;
  }
  return 'NO DISPONIBLE (hash no reversible)';
}

async function main() {
  console.log('🧾 Generando TXT de contadores...');

  const connected = await testConnection();
  if (!connected) {
    throw new Error('No hay conexión a la base de datos');
  }

  const result = await query(`
    SELECT
      u.username,
      u.nombre_completo,
      u.password_hash,
      u.is_active,
      u.mesa,
      lv.nombre AS lugar_votacion
    FROM users u
    LEFT JOIN lugares_votacion lv ON lv.id = u.lugar_votacion_id
    WHERE u.role = 'contador' AND u.is_active = true
    ORDER BY u.username
  `);

  const lines = [];
  lines.push('LISTADO DE CONTADORES POR SEDE - USUARIO Y CONTRASEÑA');
  lines.push(`Fecha: ${new Date().toISOString()}`);
  lines.push('');

  for (const user of result.rows) {
    const password = await detectPassword(user.password_hash);
    lines.push(`Usuario: ${user.username}`);
    lines.push(`Password: ${password}`);
    lines.push(`Nombre: ${user.nombre_completo || ''}`);
    lines.push(`Activo: ${user.is_active ? 'SI' : 'NO'}`);
    lines.push(`Lugar: ${user.lugar_votacion || ''}`);
    lines.push(`Mesa: ${user.mesa || 'TODAS'}`);
    lines.push('----------------------------------------');
  }

  const outputPath = path.join(__dirname, '../../CONTADORES-USUARIOS-CLAVES.txt');
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');

  console.log(`✅ Archivo generado: ${outputPath}`);
  console.log(`👥 Total contadores: ${result.rows.length}`);
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
