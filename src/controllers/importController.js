/**
 * 📥 IMPORT CONTROLLER
 * Importación inteligente de datos desde Excel
 */

const ExcelJS = require('exceljs');
const { transaction, query } = require('../config/database');

/**
 * Helper para normalizar texto removiendo tildes y caracteres especiales
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover tildes
    .replace(/\s+/g, ' '); // Normalizar espacios múltiples
}

/**
 * Helper para obtener valor de celda de forma segura
 */
function getCellValue(row, columnIndex) {
  if (!columnIndex) return null;
  
  const cellValue = row.getCell(columnIndex).value;
  if (cellValue === null || cellValue === undefined) return null;
  
  const strValue = cellValue.toString().trim();
  return strValue === '' ? null : strValue;
}

/**
 * Importar personas desde Excel
 */
async function importarExcel(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Archivo Excel requerido'
      });
    }
    
    // Obtener partido del request
    const partidoAsignado = req.body.partido ? req.body.partido.toUpperCase() : null;
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    
    const worksheet = workbook.getWorksheet(1);
    
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: 'El archivo no contiene hojas'
      });
    }
    
    const personas = [];
    const lideresMap = new Map();
    const zonasMap = new Map();
    const puestosVotacionMap = new Map();
    
    // Leer encabezados dinámicamente de la primera fila
    const headers = {};
    const firstRow = worksheet.getRow(1);
    
    console.log('📋 Detectando encabezados del Excel...');
    firstRow.eachCell((cell, colNumber) => {
      const headerOriginal = cell.value?.toString().trim();
      const headerNormalized = normalizeText(headerOriginal);
      console.log(`  Columna ${colNumber}: "${headerOriginal}" → "${headerNormalized}"`);
      
      if (headerNormalized) {
        // Mapear columnas específicas del formato (usando texto normalizado sin tildes)
        if (headerNormalized.includes('nombres y apellidos') || headerNormalized.includes('nombre')) {
          headers.nombre = colNumber;
          console.log(`    ✅ Detectada como NOMBRE`);
        } else if (headerNormalized.includes('cedula de ciudadania') || headerNormalized.includes('cedula') || headerNormalized.includes('documento') || headerNormalized === 'cc') {
          headers.documento = colNumber;
          console.log(`    ✅ Detectada como DOCUMENTO`);
        } else if (headerNormalized.includes('telefono') || headerNormalized.includes('tel') || headerNormalized.includes('celular')) {
          headers.telefono = colNumber;
          console.log(`    ✅ Detectada como TELÉFONO`);
        } else if (headerNormalized.includes('direccion') || headerNormalized.includes('address')) {
          headers.direccion = colNumber;
          console.log(`    ✅ Detectada como DIRECCIÓN`);
        } else if (headerNormalized.includes('barrio') || headerNormalized.includes('zona') || headerNormalized.includes('sector')) {
          headers.zona = colNumber;
          console.log(`    ✅ Detectada como ZONA/BARRIO`);
        } else if (headerNormalized.includes('lider') || headerNormalized.includes('leader')) {
          headers.lider = colNumber;
          console.log(`    ✅ Detectada como LÍDER`);
        } else if (headerNormalized.includes('puesto de votacion') || headerNormalized.includes('puesto') || headerNormalized.includes('lugar')) {
          headers.puestoVotacion = colNumber;
          console.log(`    ✅ Detectada como PUESTO DE VOTACIÓN`);
        } else if (headerNormalized.includes('mesa')) {
          headers.mesa = colNumber;
          console.log(`    ✅ Detectada como MESA`);
        } else if (headerNormalized.includes('partido') || headerNormalized.includes('party')) {
          headers.partido = colNumber;
          console.log(`    ✅ Detectada como PARTIDO`);
        }
      }
    });
    
    console.log('\n📊 Resumen de columnas detectadas:', headers);
    
    // Validar que existan al menos nombre y documento
    if (!headers.nombre || !headers.documento) {
      return res.status(400).json({
        success: false,
        message: 'El archivo debe contener al menos las columnas "Nombre" y "Documento"',
        columnasDetectadas: headers
      });
    }
    
    // Leer filas dinámicamente
    console.log('\n📖 Leyendo filas del Excel...');
    const totalRows = worksheet.rowCount;
    console.log(`  Total de filas en el archivo: ${totalRows}`);
    console.log(`  Columnas configuradas: nombre=${headers.nombre}, documento=${headers.documento}`);
    
    for (let rowNumber = 2; rowNumber <= totalRows; rowNumber++) {
      try {
        const row = worksheet.getRow(rowNumber);
        
        // Obtener valores raw para debug
        const nombreRaw = headers.nombre ? row.getCell(headers.nombre).value : null;
        const documentoRaw = headers.documento ? row.getCell(headers.documento).value : null;
        
        console.log(`  Fila ${rowNumber} [RAW]: nombre="${nombreRaw}", documento="${documentoRaw}"`);
        
        // Convertir a string de forma segura
        let nombre = null;
        if (nombreRaw !== null && nombreRaw !== undefined) {
          nombre = nombreRaw.toString().trim();
        }
        
        let documento = null;
        if (documentoRaw !== null && documentoRaw !== undefined) {
          documento = documentoRaw.toString().trim();
        }
        
        console.log(`  Fila ${rowNumber} [PROCESADO]: nombre="${nombre}", documento="${documento}"`);
        
        // Solo procesar filas válidas (solo requiere nombre y documento)
        if (!nombre || !documento || nombre === '' || documento === '') {
          console.log(`  ⚠️ Fila ${rowNumber}: Saltada (nombre="${nombre}", documento="${documento}")`);
          continue;
        }
        
        // Obtener campos opcionales de forma segura
        const telefono = getCellValue(row, headers.telefono);
        const direccion = getCellValue(row, headers.direccion);
        const lider = getCellValue(row, headers.lider);
        const zona = getCellValue(row, headers.zona);
        const puestoVotacion = getCellValue(row, headers.puestoVotacion);
        const mesa = getCellValue(row, headers.mesa);
        const partidoExcelRaw = getCellValue(row, headers.partido);
        
        // Detectar partido del Excel o usar el asignado
        const partidoExcel = partidoExcelRaw ? partidoExcelRaw.toUpperCase() : null;
        const partido = partidoExcel || partidoAsignado;
        
        const persona = {
          nombre,
          documento,
          telefono,
          direccion,
          lider,
          partido,
          mesa,
          zona,
          puestoVotacion
        };
        
        personas.push(persona);
        console.log(`  ✅ Fila ${rowNumber}: ${nombre} - ${documento} (${persona.zona || 'Sin barrio'})`);
        
        // Contar líderes para detección automática
        if (persona.lider) {
          const count = lideresMap.get(persona.lider) || 0;
          lideresMap.set(persona.lider, count + 1);
        }
        
        // Registrar zonas (barrios)
        if (persona.zona) {
          zonasMap.set(persona.zona, true);
        }
        
        // Registrar puestos de votación
        if (puestoVotacion) {
          puestosVotacionMap.set(puestoVotacion, true);
        }
      } catch (error) {
        console.error(`  ❌ Fila ${rowNumber} error:`, error.message);
      }
    }
    
    console.log(`\n✅ Total personas leídas: ${personas.length}`);
    console.log(`   Líderes detectados: ${lideresMap.size}`);
    console.log(`   Zonas/Barrios detectados: ${zonasMap.size}`);
    console.log(`   Puestos de votación detectados: ${puestosVotacionMap.size}`);
    
    if (personas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se encontraron personas válidas en el archivo'
      });
    }

    await query('ALTER TABLE personas ADD COLUMN IF NOT EXISTS mesa VARCHAR(20)');
    await query('CREATE INDEX IF NOT EXISTS idx_personas_mesa ON personas(mesa)');
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS lugar_votacion_id INTEGER REFERENCES lugares_votacion(id) ON DELETE SET NULL');
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS mesa VARCHAR(20)');
    
    // Iniciar transacción
    console.log('\n💾 Iniciando transacción de base de datos...');
    const result = await transaction(async (client) => {
      const stats = {
        personasImportadas: 0,
        lideresCreados: 0,
        zonasCreadas: 0,
        puestosCreados: 0
      };
      
      // Crear zonas automáticamente
      console.log('\n🗺️ Procesando zonas...');
      const zonaIds = {};
      for (const zonaNombre of zonasMap.keys()) {
        // Buscar zona existente primero
        const existingZona = await client.query(
          'SELECT id FROM zonas WHERE nombre = $1',
          [zonaNombre]
        );
        
        if (existingZona.rows.length > 0) {
          zonaIds[zonaNombre] = existingZona.rows[0].id;
          console.log(`  ✅ Zona existente: ${zonaNombre} (ID: ${zonaIds[zonaNombre]})`);
        } else {
          // Crear nueva zona
          const zonaResult = await client.query(
            `INSERT INTO zonas (nombre, descripcion)
             VALUES ($1, $2)
             RETURNING id`,
            [zonaNombre, `Zona ${zonaNombre}`]
          );
          zonaIds[zonaNombre] = zonaResult.rows[0].id;
          stats.zonasCreadas++;
          console.log(`  🆕 Zona creada: ${zonaNombre} (ID: ${zonaIds[zonaNombre]})`);
        }
      }
      
      // Crear lugares de votación automáticamente
      console.log('\n📍 Procesando lugares de votación...');
      const puestoVotacionIds = {};
      for (const puestoNombre of puestosVotacionMap.keys()) {
        // Buscar lugar existente primero
        const existingPuesto = await client.query(
          'SELECT id FROM lugares_votacion WHERE nombre = $1',
          [puestoNombre]
        );
        
        if (existingPuesto.rows.length > 0) {
          puestoVotacionIds[puestoNombre] = existingPuesto.rows[0].id;
          console.log(`  ✅ Lugar existente: ${puestoNombre} (ID: ${puestoVotacionIds[puestoNombre]})`);
        } else {
          // Crear nuevo lugar de votación (sin zona por ahora)
          const puestoResult = await client.query(
            `INSERT INTO lugares_votacion (nombre, direccion)
             VALUES ($1, $2)
             RETURNING id`,
            [puestoNombre, puestoNombre]
          );
          puestoVotacionIds[puestoNombre] = puestoResult.rows[0].id;
          stats.puestosCreados++;
          console.log(`  🆕 Lugar creado: ${puestoNombre} (ID: ${puestoVotacionIds[puestoNombre]})`);
        }
      }
      
      // Crear líderes automáticamente
      console.log('\n👥 Procesando líderes...');
      const liderIds = {};
      for (const [liderNombre, count] of lideresMap.entries()) {
        // Buscar líder existente primero
        const existingLider = await client.query(
          'SELECT id FROM lideres WHERE nombre = $1',
          [liderNombre]
        );
        
        if (existingLider.rows.length > 0) {
          liderIds[liderNombre] = existingLider.rows[0].id;
          console.log(`  ✅ Líder existente: ${liderNombre} (ID: ${liderIds[liderNombre]})`);
        } else {
          // Detectar partido del líder (mayoría de sus personas)
          const personasDelLider = personas.filter(p => p.lider === liderNombre);
          const partidoCount = {};
          personasDelLider.forEach(p => {
            if (p.partido) {
              partidoCount[p.partido] = (partidoCount[p.partido] || 0) + 1;
            }
          });
          
          // Determinar el partido más común, o usar "INDEPENDIENTE" si no hay partido
          let partido = 'INDEPENDIENTE';
          const partidos = Object.keys(partidoCount);
          if (partidos.length > 0) {
            partido = partidos.reduce((a, b) => 
              partidoCount[a] > partidoCount[b] ? a : b
            );
          }
          
          // Crear nuevo líder
          const liderResult = await client.query(
            `INSERT INTO lideres (nombre, partido)
             VALUES ($1, $2)
             RETURNING id`,
            [liderNombre, partido]
          );
          liderIds[liderNombre] = liderResult.rows[0].id;
          stats.lideresCreados++;
          console.log(`  🆕 Líder creado: ${liderNombre} - ${partido} (ID: ${liderIds[liderNombre]})`);
        }
      }
      
      // Insertar personas
      console.log('\n👤 Importando personas a la base de datos...');
      let personasExitosas = 0;
      let personasActualizadas = 0;
      
      for (let i = 0; i < personas.length; i++) {
        const persona = personas[i];
        const zonaId = persona.zona ? zonaIds[persona.zona] : null;
        const liderId = persona.lider ? liderIds[persona.lider] : null;
        const lugarVotacionId = persona.puestoVotacion ? puestoVotacionIds[persona.puestoVotacion] : null;
        
        try {
          const result = await client.query(
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
            RETURNING id, (xmax = 0) AS inserted`,
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
          
          if (result.rows[0].inserted) {
            personasExitosas++;
            if ((personasExitosas % 10) === 0) {
              console.log(`  ✅ Insertadas: ${personasExitosas}/${personas.length}`);
            }
          } else {
            personasActualizadas++;
          }
          
          stats.personasImportadas++;
        } catch (error) {
          console.error(`  ❌ Error en persona ${persona.nombre} (${persona.documento}):`, error.message);
        }
      }
      
      console.log(`\n✅ Proceso completado:`);
      console.log(`   Personas nuevas: ${personasExitosas}`);
      console.log(`   Personas actualizadas: ${personasActualizadas}`);
      console.log(`   Total procesadas: ${stats.personasImportadas}`);
      
      return stats;
    });
    
    // Log de auditoría
    await query(
      `INSERT INTO audit_log (user_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.userId,
        'IMPORT_EXCEL',
        JSON.stringify(result),
        req.ip,
        req.headers['user-agent']
      ]
    );
    
    console.log('\n🎉 Importación completada exitosamente!');
    
    res.json({
      success: true,
      message: 'Importación completada exitosamente',
      data: result,
      detalles: {
        personasLeidas: personas.length,
        lideresDetectados: lideresMap.size,
        zonasDetectadas: zonasMap.size,
        puestosDetectados: puestosVotacionMap.size
      }
    });
    
  } catch (error) {
    console.error('Error en importarExcel:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error importando archivo Excel',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

module.exports = {
  importarExcel
};
