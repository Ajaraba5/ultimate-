const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { transaction, query, testConnection, closePool } = require('../config/database');

function normalizeText(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function getCellValue(row, columnIndex) {
  if (!columnIndex) return null;
  const value = row.getCell(columnIndex).value;
  if (value === null || value === undefined) return null;
  const text = value.toString().trim();
  return text === '' ? null : text;
}

function detectHeaders(worksheet) {
  const headers = {};
  const firstRow = worksheet.getRow(1);

  firstRow.eachCell((cell, colNumber) => {
    const headerNormalized = normalizeText(cell.value?.toString().trim());
    if (!headerNormalized) return;

    if (headerNormalized.includes('nombres y apellidos') || headerNormalized.includes('nombre')) {
      headers.nombre = colNumber;
    } else if (
      headerNormalized.includes('cedula de ciudadania') ||
      headerNormalized.includes('cedula') ||
      headerNormalized.includes('documento') ||
      headerNormalized === 'cc'
    ) {
      headers.documento = colNumber;
    } else if (headerNormalized.includes('telefono') || headerNormalized.includes('tel') || headerNormalized.includes('celular')) {
      headers.telefono = colNumber;
    } else if (headerNormalized.includes('direccion') || headerNormalized.includes('address')) {
      headers.direccion = colNumber;
    } else if (headerNormalized.includes('barrio') || headerNormalized.includes('zona') || headerNormalized.includes('sector')) {
      headers.zona = colNumber;
    } else if (headerNormalized.includes('lider') || headerNormalized.includes('leader')) {
      headers.lider = colNumber;
    } else if (headerNormalized.includes('puesto de votacion') || headerNormalized.includes('puesto') || headerNormalized.includes('lugar')) {
      headers.puestoVotacion = colNumber;
    } else if (headerNormalized.includes('mesa')) {
      headers.mesa = colNumber;
    }
  });

  return headers;
}

function isLikelyHeaderlessFormat(worksheet, headers) {
  if (headers.nombre || headers.documento) return false;
  const firstRow = worksheet.getRow(1);
  const col1 = getCellValue(firstRow, 1);
  const col5 = getCellValue(firstRow, 5);

  const looksLikeDocumento = !!col1 && /^\d{5,}$/.test(col1.replace(/\D/g, ''));
  const looksLikeLiderName = !!col5 && /[a-zA-Z]/.test(col5);
  return looksLikeDocumento && looksLikeLiderName;
}

function countValidDocuments(worksheet) {
  const headers = detectHeaders(worksheet);
  const headerlessFormat = isLikelyHeaderlessFormat(worksheet, headers);
  const startRow = headerlessFormat ? 1 : 2;
  const maxRowsToCheck = Math.min(worksheet.rowCount, startRow + 299);

  let validDocs = 0;
  for (let rowNumber = startRow; rowNumber <= maxRowsToCheck; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const documento = headerlessFormat
      ? getCellValue(row, 1)
      : getCellValue(row, headers.documento);

    if (documento && /^\d{5,}$/.test(documento.replace(/\D/g, ''))) {
      validDocs++;
    }
  }

  return validDocs;
}

function pickBestWorksheet(workbook) {
  if (!workbook.worksheets || workbook.worksheets.length === 0) return null;

  let selected = workbook.worksheets[0];
  let bestScore = countValidDocuments(selected);

  for (const worksheet of workbook.worksheets.slice(1)) {
    const score = countValidDocuments(worksheet);
    if (score > bestScore) {
      selected = worksheet;
      bestScore = score;
    }
  }

  return selected;
}

async function readPersonasFromExcel(filePath, partidoFijo) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = pickBestWorksheet(workbook);
  if (!worksheet) {
    throw new Error(`El archivo ${path.basename(filePath)} no contiene hojas`);
  }

  const headers = detectHeaders(worksheet);
  const headerlessFormat = isLikelyHeaderlessFormat(worksheet, headers);

  if (!headerlessFormat && !headers.documento) {
    throw new Error(
      `Faltan columnas obligatorias en ${path.basename(filePath)} (requiere Documento)`
    );
  }

  const personas = [];
  const startRow = headerlessFormat ? 1 : 2;
  for (let rowNumber = startRow; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);

    let nombre;
    let documento;
    let telefono;
    let direccion;
    let zona;
    let lider;
    let puestoVotacion;
    let mesa;

    if (headerlessFormat) {
      documento = getCellValue(row, 1);
      telefono = getCellValue(row, 2);
      direccion = getCellValue(row, 3);
      zona = getCellValue(row, 4);
      lider = getCellValue(row, 5);
      puestoVotacion = getCellValue(row, 6);
      mesa = getCellValue(row, 8);
      nombre = null;
    } else {
      nombre = getCellValue(row, headers.nombre);
      documento = getCellValue(row, headers.documento);
      telefono = getCellValue(row, headers.telefono);
      direccion = getCellValue(row, headers.direccion);
      zona = getCellValue(row, headers.zona);
      lider = getCellValue(row, headers.lider);
      puestoVotacion = getCellValue(row, headers.puestoVotacion);
      mesa = getCellValue(row, headers.mesa);
    }

    if (!documento) continue;
    const nombreFinal = nombre || `SIN NOMBRE ${documento}`;

    personas.push({
      nombre: nombreFinal,
      documento,
      telefono,
      direccion,
      zona,
      lider,
      puestoVotacion,
      mesa,
      partido: partidoFijo
    });
  }

  return personas;
}

async function getOrCreateZona(client, zonaNombre) {
  const existing = await client.query('SELECT id FROM zonas WHERE nombre = $1 LIMIT 1', [zonaNombre]);
  if (existing.rows.length) return existing.rows[0].id;

  const created = await client.query(
    `INSERT INTO zonas (nombre, descripcion)
     VALUES ($1, $2)
     RETURNING id`,
    [zonaNombre, `Zona ${zonaNombre}`]
  );
  return created.rows[0].id;
}

async function getOrCreateLugar(client, nombreLugar) {
  const existing = await client.query('SELECT id FROM lugares_votacion WHERE nombre = $1 LIMIT 1', [nombreLugar]);
  if (existing.rows.length) return existing.rows[0].id;

  const created = await client.query(
    `INSERT INTO lugares_votacion (nombre, direccion)
     VALUES ($1, $2)
     RETURNING id`,
    [nombreLugar, nombreLugar]
  );
  return created.rows[0].id;
}

async function getOrCreateLider(client, liderNombre, partido) {
  const existing = await client.query('SELECT id FROM lideres WHERE nombre = $1 LIMIT 1', [liderNombre]);
  if (existing.rows.length) return existing.rows[0].id;

  const created = await client.query(
    `INSERT INTO lideres (nombre, partido)
     VALUES ($1, $2)
     RETURNING id`,
    [liderNombre, partido]
  );
  return created.rows[0].id;
}

async function importPersonas(personas) {
  return transaction(async (client) => {
    const zonasCache = new Map();
    const lugaresCache = new Map();
    const lideresCache = new Map();

    let insertadas = 0;
    let actualizadas = 0;

    for (const persona of personas) {
      let zonaId = null;
      let lugarVotacionId = null;
      let liderId = null;

      if (persona.zona) {
        if (!zonasCache.has(persona.zona)) {
          zonasCache.set(persona.zona, await getOrCreateZona(client, persona.zona));
        }
        zonaId = zonasCache.get(persona.zona);
      }

      if (persona.puestoVotacion) {
        if (!lugaresCache.has(persona.puestoVotacion)) {
          lugaresCache.set(persona.puestoVotacion, await getOrCreateLugar(client, persona.puestoVotacion));
        }
        lugarVotacionId = lugaresCache.get(persona.puestoVotacion);
      }

      if (persona.lider) {
        const liderKey = `${persona.lider}__${persona.partido}`;
        if (!lideresCache.has(liderKey)) {
          lideresCache.set(liderKey, await getOrCreateLider(client, persona.lider, persona.partido));
        }
        liderId = lideresCache.get(liderKey);
      }

      const upsert = await client.query(
        `INSERT INTO personas (
          nombre, documento, telefono, direccion,
          zona_id, lider_id, partido, lugar_votacion_id, mesa, voto
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
        ON CONFLICT (documento) DO UPDATE SET
          nombre = EXCLUDED.nombre,
          telefono = EXCLUDED.telefono,
          direccion = EXCLUDED.direccion,
          zona_id = EXCLUDED.zona_id,
          lider_id = EXCLUDED.lider_id,
          partido = EXCLUDED.partido,
          lugar_votacion_id = EXCLUDED.lugar_votacion_id,
          mesa = EXCLUDED.mesa
        RETURNING (xmax = 0) AS inserted`,
        [
          persona.nombre,
          persona.documento,
          persona.telefono,
          persona.direccion,
          zonaId,
          liderId,
          persona.partido,
          lugarVotacionId,
          persona.mesa
        ]
      );

      if (upsert.rows[0].inserted) {
        insertadas++;
      } else {
        actualizadas++;
      }
    }

    return {
      total: personas.length,
      insertadas,
      actualizadas
    };
  });
}

async function main() {
  const root = path.join(__dirname, '../../');
  const archivos = [
    {
      file: path.join(root, 'BASE NUEVA DE NELLO ZABARAIN 2026.xlsx'),
      partido: 'VERDE'
    },
    {
      file: path.join(root, 'NUEVA BASE OSCAR GALAN 10-02-2026 -2.xlsx'),
      partido: 'ROJO'
    }
  ];

  console.log('📥 Importación automática de excels montados');
  console.log('🟢 Nello Zabarain => VERDE');
  console.log('🔴 Oscar Galán => ROJO\n');

  const connected = await testConnection();
  if (!connected) {
    throw new Error('No fue posible conectar a PostgreSQL. Revisa tu archivo .env');
  }

  await query('ALTER TABLE personas ADD COLUMN IF NOT EXISTS mesa VARCHAR(20)');
  await query('CREATE INDEX IF NOT EXISTS idx_personas_mesa ON personas(mesa)');
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS lugar_votacion_id INTEGER REFERENCES lugares_votacion(id) ON DELETE SET NULL');
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS mesa VARCHAR(20)');

  for (const item of archivos) {
    if (!fs.existsSync(item.file)) {
      throw new Error(`No se encontró el archivo: ${path.basename(item.file)}`);
    }
  }

  const resumen = [];
  for (const item of archivos) {
    const fileName = path.basename(item.file);
    console.log(`\n📄 Procesando ${fileName} (${item.partido})...`);

    const personas = await readPersonasFromExcel(item.file, item.partido);
    console.log(`   Personas válidas detectadas: ${personas.length}`);

    const stats = await importPersonas(personas);
    resumen.push({
      archivo: fileName,
      partido: item.partido,
      ...stats
    });

    console.log(`   ✅ Importadas: ${stats.total} (nuevas: ${stats.insertadas}, actualizadas: ${stats.actualizadas})`);
  }

  const conteoGlobal = await query(`
    SELECT partido, COUNT(*)::int AS total
    FROM personas
    WHERE partido IN ('ROJO', 'VERDE')
    GROUP BY partido
    ORDER BY partido
  `);

  console.log('\n══════════════════════════════════════════');
  console.log('✅ IMPORTACIÓN COMPLETADA');
  console.log('══════════════════════════════════════════');
  resumen.forEach((r) => {
    console.log(`- ${r.archivo}`);
    console.log(`  Partido: ${r.partido}`);
    console.log(`  Total: ${r.total} | Nuevas: ${r.insertadas} | Actualizadas: ${r.actualizadas}`);
  });

  console.log('\n📊 Totales actuales por partido en BD:');
  conteoGlobal.rows.forEach((row) => {
    console.log(`  ${row.partido}: ${row.total}`);
  });
}

main()
  .then(async () => {
    await closePool();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('\n❌ Error en importación:', error.message);
    await closePool();
    process.exit(1);
  });
