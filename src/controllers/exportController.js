/**
 * 📤 EXPORT CONTROLLER
 * Exportación completa a Excel con 9 hojas
 */

const ExcelJS = require('exceljs');
const { query } = require('../config/database');

/**
 * Exportar todo a Excel (9 hojas)
 */
async function exportarCompleto(req, res) {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // HOJA 1: Base de datos general
    await createGeneralSheet(workbook);
    
    // HOJA 2: Estadísticas generales
    await createEstadisticasGeneralesSheet(workbook);
    
    // HOJA 3: Estadísticas por partido
    await createEstadisticasPartidoSheet(workbook);
    
    // HOJA 4: Datos partido ROJO
    await createPartidoSheet(workbook, 'ROJO');
    
    // HOJA 5: Datos partido VERDE
    await createPartidoSheet(workbook, 'VERDE');
    
    // HOJA 6: Análisis de líderes
    await createLideresSheet(workbook);
    
    // HOJA 7: Rendimiento de contadores
    await createContadoresSheet(workbook);
    
    // HOJA 8: Estadísticas de zonas
    await createZonasSheet(workbook);
    
    // HOJA 9: Resumen ejecutivo
    await createResumenEjecutivoSheet(workbook);
    
    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Log de auditoría
    await query(
      `INSERT INTO audit_log (user_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.userId,
        'EXPORT_EXCEL',
        JSON.stringify({ sheets: 9 }),
        req.ip,
        req.headers['user-agent']
      ]
    );
    
    // Enviar archivo
    const filename = `Reporte_Electoral_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
    
  } catch (error) {
    console.error('Error en exportarCompleto:', error);
    res.status(500).json({
      success: false,
      message: 'Error exportando datos',
      error: error.message
    });
  }
}

// === Helper functions para crear cada hoja ===

async function createGeneralSheet(workbook) {
  const worksheet = workbook.addWorksheet('Base de Datos General');
  
  const result = await query(`
    SELECT 
      p.id,
      p.nombre,
      p.documento,
      p.telefono,
      p.direccion,
      p.partido,
      p.voto,
      p.fecha_voto,
      z.nombre as zona,
      l.nombre as lider,
      lv.nombre as lugar_votacion,
      u.nombre_completo as contador
    FROM personas p
    LEFT JOIN zonas z ON p.zona_id = z.id
    LEFT JOIN lideres l ON p.lider_id = l.id
    LEFT JOIN lugares_votacion lv ON p.lugar_votacion_id = lv.id
    LEFT JOIN users u ON p.contador_id = u.id
    ORDER BY p.nombre
  `);
  
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Nombre', key: 'nombre', width: 30 },
    { header: 'Documento', key: 'documento', width: 15 },
    { header: 'Teléfono', key: 'telefono', width: 15 },
    { header: 'Dirección', key: 'direccion', width: 40 },
    { header: 'Partido', key: 'partido', width: 10 },
    { header: 'Votó', key: 'voto', width: 10 },
    { header: 'Fecha Voto', key: 'fecha_voto', width: 20 },
    { header: 'Zona', key: 'zona', width: 20 },
    { header: 'Líder', key: 'lider', width: 30 },
    { header: 'Lugar Votación', key: 'lugar_votacion', width: 30 },
    { header: 'Contador', key: 'contador', width: 30 }
  ];
  
  worksheet.addRows(result.rows.map(row => ({
    ...row,
    voto: row.voto ? 'SÍ' : 'NO'
  })));
  
  // Estilo header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
}

async function createEstadisticasGeneralesSheet(workbook) {
  const worksheet = workbook.addWorksheet('Estadísticas Generales');
  
  const result = await query(`
    SELECT 
      COUNT(*)::INTEGER as total_personas,
      COUNT(*) FILTER (WHERE voto = true)::INTEGER as total_votados,
      COUNT(*) FILTER (WHERE voto = false)::INTEGER as total_pendientes,
      ROUND(COUNT(*) FILTER (WHERE voto = true) * 100.0 / NULLIF(COUNT(*), 0), 2) as porcentaje_participacion,
      COUNT(*) FILTER (WHERE partido = 'ROJO')::INTEGER as total_rojo,
      COUNT(*) FILTER (WHERE partido = 'VERDE')::INTEGER as total_verde,
      COUNT(*) FILTER (WHERE partido = 'ROJO' AND voto = true)::INTEGER as votados_rojo,
      COUNT(*) FILTER (WHERE partido = 'VERDE' AND voto = true)::INTEGER as votados_verde
    FROM personas
  `);
  
  const stats = result.rows[0];
  
  worksheet.columns = [
    { header: 'Métrica', key: 'metrica', width: 40 },
    { header: 'Valor', key: 'valor', width: 20 }
  ];
  
  worksheet.addRows([
    { metrica: 'Total de Personas Registradas', valor: stats.total_personas },
    { metrica: 'Total Votados', valor: stats.total_votados },
    { metrica: 'Total Pendientes', valor: stats.total_pendientes },
    { metrica: 'Porcentaje de Participación', valor: `${stats.porcentaje_participacion}%` },
    { metrica: '', valor: '' },
    { metrica: 'Total Partido ROJO', valor: stats.total_rojo },
    { metrica: 'Votados Partido ROJO', valor: stats.votados_rojo },
    { metrica: '', valor: '' },
    { metrica: 'Total Partido VERDE', valor: stats.total_verde },
    { metrica: 'Votados Partido VERDE', valor: stats.votados_verde }
  ]);
  
  worksheet.getRow(1).font = { bold: true };
}

async function createEstadisticasPartidoSheet(workbook) {
  const worksheet = workbook.addWorksheet('Stats por Partido');
  
  const result = await query(`
    SELECT 
      partido,
      COUNT(*)::INTEGER as total,
      COUNT(*) FILTER (WHERE voto = true)::INTEGER as votados,
      COUNT(*) FILTER (WHERE voto = false)::INTEGER as pendientes,
      ROUND(COUNT(*) FILTER (WHERE voto = true) * 100.0 / NULLIF(COUNT(*), 0), 2) as porcentaje
    FROM personas
    GROUP BY partido
    ORDER BY partido
  `);
  
  worksheet.columns = [
    { header: 'Partido', key: 'partido', width: 15 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Votados', key: 'votados', width: 15 },
    { header: 'Pendientes', key: 'pendientes', width: 15 },
    { header: 'Porcentaje', key: 'porcentaje', width: 15 }
  ];
  
  worksheet.addRows(result.rows.map(row => ({
    ...row,
    porcentaje: `${row.porcentaje}%`
  })));
  
  worksheet.getRow(1).font = { bold: true };
}

async function createPartidoSheet(workbook, partido) {
  const worksheet = workbook.addWorksheet(`Partido ${partido}`);
  
  const result = await query(`
    SELECT 
      p.nombre,
      p.documento,
      p.telefono,
      p.voto,
      l.nombre as lider,
      z.nombre as zona,
      u.nombre_completo as contador
    FROM personas p
    LEFT JOIN lideres l ON p.lider_id = l.id
    LEFT JOIN zonas z ON p.zona_id = z.id
    LEFT JOIN users u ON p.contador_id = u.id
    WHERE p.partido = $1
    ORDER BY p.voto DESC, p.nombre
  `, [partido]);
  
  worksheet.columns = [
    { header: 'Nombre', key: 'nombre', width: 30 },
    { header: 'Documento', key: 'documento', width: 15 },
    { header: 'Teléfono', key: 'telefono', width: 15 },
    { header: 'Votó', key: 'voto', width: 10 },
    { header: 'Líder', key: 'lider', width: 30 },
    { header: 'Zona', key: 'zona', width: 20 },
    { header: 'Contador', key: 'contador', width: 30 }
  ];
  
  worksheet.addRows(result.rows.map(row => ({
    ...row,
    voto: row.voto ? 'SÍ' : 'NO'
  })));
  
  worksheet.getRow(1).font = { bold: true };
}

async function createLideresSheet(workbook) {
  const worksheet = workbook.addWorksheet('Análisis de Líderes');
  
  const result = await query(`
    SELECT 
      l.nombre,
      l.partido,
      COUNT(p.id)::INTEGER as total_asignados,
      COUNT(p.id) FILTER (WHERE p.voto = true)::INTEGER as total_votados,
      COUNT(p.id) FILTER (WHERE p.voto = false)::INTEGER as pendientes,
      ROUND(COUNT(p.id) FILTER (WHERE p.voto = true) * 100.0 / NULLIF(COUNT(p.id), 0), 2) as porcentaje
    FROM lideres l
    LEFT JOIN personas p ON p.lider_id = l.id
    GROUP BY l.id, l.nombre, l.partido
    ORDER BY porcentaje DESC, total_votados DESC
  `);
  
  worksheet.columns = [
    { header: 'Líder', key: 'nombre', width: 30 },
    { header: 'Partido', key: 'partido', width: 15 },
    { header: 'Total Asignados', key: 'total_asignados', width: 15 },
    { header: 'Votados', key: 'total_votados', width: 15 },
    { header: 'Pendientes', key: 'pendientes', width: 15 },
    { header: 'Porcentaje', key: 'porcentaje', width: 15 }
  ];
  
  worksheet.addRows(result.rows.map(row => ({
    ...row,
    porcentaje: `${row.porcentaje}%`
  })));
  
  worksheet.getRow(1).font = { bold: true };
}

async function createContadoresSheet(workbook) {
  const worksheet = workbook.addWorksheet('Rendimiento Contadores');
  
  const result = await query(`
    SELECT 
      u.nombre_completo,
      COUNT(p.id)::INTEGER as total_asignados,
      COUNT(p.id) FILTER (WHERE p.voto = true)::INTEGER as total_votados,
      COUNT(p.id) FILTER (WHERE p.voto = false)::INTEGER as pendientes,
      ROUND(COUNT(p.id) FILTER (WHERE p.voto = true) * 100.0 / NULLIF(COUNT(p.id), 0), 2) as porcentaje,
      u.ultimo_login
    FROM users u
    LEFT JOIN personas p ON p.contador_id = u.id
    WHERE u.role = 'contador'
    GROUP BY u.id
    ORDER BY porcentaje DESC
  `);
  
  worksheet.columns = [
    { header: 'Contador', key: 'nombre_completo', width: 30 },
    { header: 'Total Asignados', key: 'total_asignados', width: 15 },
    { header: 'Votados', key: 'total_votados', width: 15 },
    { header: 'Pendientes', key: 'pendientes', width: 15 },
    { header: 'Porcentaje', key: 'porcentaje', width: 15 },
    { header: 'Último Login', key: 'ultimo_login', width: 20 }
  ];
  
  worksheet.addRows(result.rows.map(row => ({
    ...row,
    porcentaje: `${row.porcentaje}%`
  })));
  
  worksheet.getRow(1).font = { bold: true };
}

async function createZonasSheet(workbook) {
  const worksheet = workbook.addWorksheet('Estadísticas de Zonas');
  
  const result = await query(`
    SELECT 
      z.nombre,
      COUNT(p.id)::INTEGER as total_personas,
      COUNT(p.id) FILTER (WHERE p.voto = true)::INTEGER as total_votados,
      COUNT(p.id) FILTER (WHERE p.voto = false)::INTEGER as pendientes,
      ROUND(COUNT(p.id) FILTER (WHERE p.voto = true) * 100.0 / NULLIF(COUNT(p.id), 0), 2) as porcentaje
    FROM zonas z
    LEFT JOIN personas p ON p.zona_id = z.id
    GROUP BY z.id
    ORDER BY porcentaje DESC
  `);
  
  worksheet.columns = [
    { header: 'Zona', key: 'nombre', width: 30 },
    { header: 'Total Personas', key: 'total_personas', width: 15 },
    { header: 'Votados', key: 'total_votados', width: 15 },
    { header: 'Pendientes', key: 'pendientes', width: 15 },
    { header: 'Porcentaje', key: 'porcentaje', width: 15 }
  ];
  
  worksheet.addRows(result.rows.map(row => ({
    ...row,
    porcentaje: `${row.porcentaje}%`
  })));
  
  worksheet.getRow(1).font = { bold: true };
}

async function createResumenEjecutivoSheet(workbook) {
  const worksheet = workbook.addWorksheet('Resumen Ejecutivo');
  
  // Info en formato de reporte ejecutivo
  worksheet.mergeCells('A1:B1');
  worksheet.getCell('A1').value = 'RESUMEN EJECUTIVO - ELECCIÓN 2026';
  worksheet.getCell('A1').font = { bold: true, size: 16 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  worksheet.getCell('A3').value = `Fecha de generación: ${new Date().toLocaleString()}`;
  worksheet.getCell('A3').font = { italic: true };
  
  // Estadísticas clave
  const stats = await query('SELECT * FROM get_general_stats()');
  const data = stats.rows[0];
  
  worksheet.getCell('A5').value = 'PARTICIPACIÓN ELECTORAL';
  worksheet.getCell('A5').font = { bold: true, size: 14 };
  
  worksheet.getCell('A7').value = 'Total de Personas:';
  worksheet.getCell('B7').value = data.total_personas;
  
  worksheet.getCell('A8').value = 'Total Votaron:';
  worksheet.getCell('B8').value = data.total_votados;
  
  worksheet.getCell('A9').value = 'Total Pendientes:';
  worksheet.getCell('B9').value = data.total_pendientes;
  
  worksheet.getCell('A10').value = 'Participación:';
  worksheet.getCell('B10').value = `${data.porcentaje_participacion}%`;
  worksheet.getCell('B10').font = { bold: true, color: { argb: 'FF008000' } };
  
  worksheet.columns = [
    { width: 40 },
    { width: 20 }
  ];
}

module.exports = {
  exportarCompleto
};
