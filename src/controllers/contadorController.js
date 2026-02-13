/**
 * 📊 CONTADOR CONTROLLER
 * Panel para contadores - marcar votos
 */

const { query } = require('../config/database');

/**
 * Obtener mis estadísticas como contador
 */
async function getMisEstadisticas(req, res) {
  try {
    const contadorId = req.user.userId;
    
    const result = await query(`
      SELECT 
        COUNT(*)::INTEGER as total_asignados,
        COUNT(*) FILTER (WHERE voto = true)::INTEGER as total_votados,
        COUNT(*) FILTER (WHERE voto = false)::INTEGER as total_pendientes,
        ROUND(
          CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE COUNT(*) FILTER (WHERE voto = true) * 100.0 / COUNT(*)
          END,
          2
        ) as porcentaje_participacion
      FROM personas
      WHERE contador_id = $1
    `, [contadorId]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error en getMisEstadisticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas'
    });
  }
}

/**
 * Obtener mis personas asignadas
 */
async function getMisPersonas(req, res) {
  try {
    const contadorId = req.user.userId;
    const { search, voto, limit = 100, offset = 0 } = req.query;
    
    let queryText = `
      SELECT 
        p.*,
        z.nombre as zona_nombre,
        l.nombre as lider_nombre,
        lv.nombre as lugar_votacion_nombre
      FROM personas p
      LEFT JOIN zonas z ON p.zona_id = z.id
      LEFT JOIN lideres l ON p.lider_id = l.id
      LEFT JOIN lugares_votacion lv ON p.lugar_votacion_id = lv.id
      WHERE p.contador_id = $1
    `;
    
    const params = [contadorId];
    let paramIndex = 2;
    
    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND (p.nombre ILIKE $${paramIndex} OR p.documento ILIKE $${paramIndex})`;
      paramIndex++;
    }
    
    if (voto !== undefined) {
      params.push(voto === 'true');
      queryText += ` AND p.voto = $${paramIndex}`;
      paramIndex++;
    }
    
    queryText += ` ORDER BY p.voto ASC, p.nombre ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(queryText, params);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error en getMisPersonas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo personas'
    });
  }
}

/**
 * Marcar voto de una persona
 */
async function marcarVoto(req, res) {
  try {
    const contadorId = req.user.userId;
    const { personaId } = req.body;
    
    if (!personaId) {
      return res.status(400).json({
        success: false,
        message: 'ID de persona requerido'
      });
    }
    
    // Verificar que la persona está asignada a este contador
    const checkResult = await query(
      'SELECT id, voto, nombre FROM personas WHERE id = $1 AND contador_id = $2',
      [personaId, contadorId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para marcar esta persona'
      });
    }
    
    const persona = checkResult.rows[0];
    
    if (persona.voto) {
      return res.status(400).json({
        success: false,
        message: 'Esta persona ya votó'
      });
    }
    
    // Marcar voto
    await query(
      'UPDATE personas SET voto = true, fecha_voto = NOW() WHERE id = $1',
      [personaId]
    );
    
    // Log de auditoría
    await query(
      `INSERT INTO audit_log (user_id, action, table_name, record_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        contadorId,
        'MARCAR_VOTO',
        'personas',
        personaId,
        JSON.stringify({ nombre: persona.nombre }),
        req.ip,
        req.headers['user-agent']
      ]
    );
    
    res.json({
      success: true,
      message: 'Voto marcado exitosamente'
    });
    
  } catch (error) {
    console.error('Error en marcarVoto:', error);
    res.status(500).json({
      success: false,
      message: 'Error marcando voto'
    });
  }
}

/**
 * Desmarcar voto (solo en caso de error)
 */
async function desmarcarVoto(req, res) {
  try {
    const contadorId = req.user.userId;
    const { personaId } = req.body;
    
    if (!personaId) {
      return res.status(400).json({
        success: false,
        message: 'ID de persona requerido'
      });
    }
    
    // Verificar que la persona está asignada a este contador
    const checkResult = await query(
      'SELECT id, voto, nombre FROM personas WHERE id = $1 AND contador_id = $2',
      [personaId, contadorId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar esta persona'
      });
    }
    
    const persona = checkResult.rows[0];
    
    if (!persona.voto) {
      return res.status(400).json({
        success: false,
        message: 'Esta persona no ha votado'
      });
    }
    
    // Desmarcar voto
    await query(
      'UPDATE personas SET voto = false, fecha_voto = NULL WHERE id = $1',
      [personaId]
    );
    
    // Log de auditoría
    await query(
      `INSERT INTO audit_log (user_id, action, table_name, record_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        contadorId,
        'DESMARCAR_VOTO',
        'personas',
        personaId,
        JSON.stringify({ nombre: persona.nombre }),
        req.ip,
        req.headers['user-agent']
      ]
    );
    
    res.json({
      success: true,
      message: 'Voto desmarcado exitosamente'
    });
    
  } catch (error) {
    console.error('Error en desmarcarVoto:', error);
    res.status(500).json({
      success: false,
      message: 'Error desmarcando voto'
    });
  }
}

module.exports = {
  getMisEstadisticas,
  getMisPersonas,
  marcarVoto,
  desmarcarVoto
};
