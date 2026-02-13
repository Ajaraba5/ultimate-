const ExcelJS = require('exceljs');

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

async function testImport() {
  console.log('🧪 PRUEBA DE IMPORTACIÓN');
  console.log('=========================\n');
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('BASE DE DATOS FINAL.xlsx');
  
  const worksheet = workbook.worksheets[0];
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
  
  console.log('\n📊 Resumen de columnas detectadas:');
  console.log(JSON.stringify(headers, null, 2));
  
  if (!headers.nombre || !headers.documento) {
    console.log('\n❌ ERROR: Faltan columnas obligatorias');
    console.log(`  - Nombre: ${headers.nombre ? '✅' : '❌'}`);
    console.log(`  - Documento: ${headers.documento ? '✅' : '❌'}`);
    return;
  }
  
  console.log('\n✅ Columnas obligatorias detectadas correctamente');
  
  // Contar filas válidas
  let validRows = 0;
  let invalidRows = 0;
  
  console.log('\n📖 Analizando primeras 10 filas...');
  for (let rowNumber = 2; rowNumber <= Math.min(11, worksheet.rowCount); rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    
    const nombreRaw = headers.nombre ? row.getCell(headers.nombre).value : null;
    const documentoRaw = headers.documento ? row.getCell(headers.documento).value : null;
    
    let nombre = null;
    if (nombreRaw !== null && nombreRaw !== undefined) {
      nombre = nombreRaw.toString().trim();
    }
    
    let documento = null;
    if (documentoRaw !== null && documentoRaw !== undefined) {
      documento = documentoRaw.toString().trim();
    }
    
    if (nombre && documento && nombre !== '' && documento !== '') {
      validRows++;
      console.log(`  ✅ Fila ${rowNumber}: "${nombre}" - ${documento}`);
    } else {
      invalidRows++;
      console.log(`  ❌ Fila ${rowNumber}: nombre="${nombre || '(vacío)'}", documento="${documento || '(vacío)'}"`);
    }
  }
  
  console.log(`\n📈 Resumen:`);
  console.log(`  Total de filas: ${worksheet.rowCount - 1}`);
  console.log(`  Filas válidas (primeras 10): ${validRows}`);
  console.log(`  Filas inválidas (primeras 10): ${invalidRows}`);
}

testImport().catch(err => {
  console.error('❌ Error:', err);
});
