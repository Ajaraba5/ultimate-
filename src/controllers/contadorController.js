/**
 * 📊 CONTADOR CONTROLLER
 * Panel para contadores - marcar votos
 */

const { query } = require('../config/database');

/**
 * Obtener mis personas asignadas
 */
async function getMisPersonas(req, res) {
  try {
    const { search, voto, limit = 500, offset = 0 } = req.query;
    const trimmedSearch = String(search || '').trim();
    const parsedLimit = Number.parseInt(limit, 10);
    const parsedOffset = Number.parseInt(offset, 10);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 1000) : 500;
    const safeOffset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0;
    
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
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (trimmedSearch) {
      // If input looks like a cedula, force exact match (ignoring punctuation).
      const normalizedCedula = trimmedSearch.replace(/\D/g, '');
      if (normalizedCedula.length > 0) {
        params.push(normalizedCedula);
        queryText += ` AND regexp_replace(COALESCE(p.documento, ''), '[^0-9]', '', 'g') = $${paramIndex}`;
      } else {
        params.push(`%${trimmedSearch}%`);
        queryText += ` AND (p.nombre ILIKE $${paramIndex} OR p.documento ILIKE $${paramIndex})`;
      }
      paramIndex++;
    }

    // In contador panel default to pending voters to avoid accidental confusion.
    if (voto !== undefined) {
      params.push(voto === 'true');
      queryText += ` AND p.voto = $${paramIndex}`;
      paramIndex++;
    } else {
      queryText += ` AND p.voto = false`;
    }
    
    queryText += ` ORDER BY p.voto ASC, p.nombre ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(safeLimit, safeOffset);
    
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
    
    // Verificar que la persona existe
    const checkResult = await query(
      'SELECT id, voto, nombre FROM personas WHERE id = $1',
      [personaId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Persona no encontrada'
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
    
    // Verificar que la persona existe
    const checkResult = await query(
      'SELECT id, voto, nombre FROM personas WHERE id = $1',
      [personaId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Persona no encontrada'
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
  getMisPersonas,
  marcarVoto,
  desmarcarVoto
};
