/**
 * Script para crear un Excel de ejemplo para importar
 */

const ExcelJS = require('exceljs');
const path = require('path');

async function crearExcelEjemplo() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Personas');

  // Definir columnas
  worksheet.columns = [
    { header: 'NOMBRES Y APELLIDOS', key: 'nombre', width: 35 },
    { header: 'CEDULA DE CIUDADANIA', key: 'documento', width: 20 },
    { header: 'TELEFONO', key: 'telefono', width: 15 },
    { header: 'DIRECCION', key: 'direccion', width: 40 },
    { header: 'BARRIO', key: 'barrio', width: 20 },
    { header: 'LIDER', key: 'lider', width: 30 },
    { header: 'PUESTO DE VOTACION', key: 'puesto', width: 35 },
    { header: 'MESA', key: 'mesa', width: 10 }
  ];

  // Estilo del encabezado
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Agregar datos de ejemplo
  const ejemplos = [
    {
      nombre: 'Juan Pérez García',
      documento: '1234567890',
      telefono: '3001234567',
      direccion: 'Calle 123 #45-67',
      barrio: 'Centro',
      lider: 'María González',
      puesto: 'Escuela República de Colombia',
      mesa: '001'
    },
    {
      nombre: 'Ana Martínez López',
      documento: '9876543210',
      telefono: '3107654321',
      direccion: 'Carrera 45 #12-34',
      barrio: 'Norte',
      lider: 'María González',
      puesto: 'Colegio San José',
      mesa: '002'
    },
    {
      nombre: 'Carlos Rodríguez Sánchez',
      documento: '5555555555',
      telefono: '3205555555',
      direccion: 'Avenida 78 #90-12',
      barrio: 'Sur',
      lider: 'Pedro Sánchez',
      puesto: 'Instituto Técnico Central',
      mesa: '003'
    },
    {
      nombre: 'Laura Gómez Ramírez',
      documento: '1111111111',
      telefono: '3151111111',
      direccion: 'Diagonal 23 #45-67',
      barrio: 'Oriente',
      lider: 'Pedro Sánchez',
      puesto: 'Polideportivo Los Comuneros',
      mesa: '004'
    }
  ];

  ejemplos.forEach(ejemplo => {
    worksheet.addRow(ejemplo);
  });

  // Guardar archivo
  const filename = path.join(__dirname, 'ejemplo_importacion.xlsx');
  await workbook.xlsx.writeFile(filename);
  
  console.log('✅ Archivo creado exitosamente:', filename);
  console.log('\nColumnas incluidas:');
  console.log('  - NOMBRES Y APELLIDOS (obligatorio)');
  console.log('  - CEDULA DE CIUDADANIA (obligatorio)');
  console.log('  - TELEFONO (opcional)');
  console.log('  - DIRECCION (opcional)');
  console.log('  - BARRIO (opcional)');
  console.log('  - LIDER (opcional)');
  console.log('  - PUESTO DE VOTACION (opcional)');
  console.log('  - MESA (informativo)');
  console.log('\n⚠️  El PARTIDO se asigna automáticamente al importar (botón ROJO o VERDE)');
  console.log('\nPersonas de ejemplo: 4');
  console.log('Líderes: María González, Pedro Sánchez');
  console.log('Barrios: Centro, Norte, Sur, Oriente');
}

crearExcelEjemplo().catch(console.error);
