const ExcelJS = require('exceljs');

async function inspeccionar() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('BASE DE DATOS FINAL.xlsx');
  
  const worksheet = workbook.worksheets[0];
  
  console.log('📊 INSPECCIÓN DEL ARCHIVO EXCEL\n');
  console.log(`Nombre de la hoja: ${worksheet.name}`);
  console.log(`Total de filas: ${worksheet.rowCount}\n`);
  
  // Obtener encabezados (primera fila)
  const headerRow = worksheet.getRow(1);
  console.log('📋 ENCABEZADOS DETECTADOS:');
  console.log('=====================================');
  
  headerRow.eachCell((cell, colNumber) => {
    const value = cell.value;
    console.log(`  Columna ${colNumber}: "${value}" (tipo: ${typeof value})`);
  });
  
  console.log('\n📝 PRIMERAS 3 FILAS DE DATOS:');
  console.log('=====================================');
  
  for (let i = 2; i <= Math.min(4, worksheet.rowCount); i++) {
    const row = worksheet.getRow(i);
    console.log(`\nFila ${i}:`);
    row.eachCell((cell, colNumber) => {
      const value = cell.value;
      const displayValue = value === null || value === undefined ? '(vacío)' : value;
      console.log(`  Col ${colNumber}: ${displayValue}`);
    });
  }
  
  console.log('\n✅ Inspección completada');
}

inspeccionar().catch(err => {
  console.error('❌ Error al inspeccionar:', err);
});
