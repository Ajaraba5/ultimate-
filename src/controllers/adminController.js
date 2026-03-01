/**
 * 👨‍💼 ADMIN CONTROLLER
 * Panel de administración completo
 */

const { query, transaction } = require('../config/database');

/**
 * Obtener dashboard con estadísticas generales
 */
async function getDashboard(req, res) {
  try {
    // Estadísticas generales
    const statsResult = await query(`
      SELECT 
        COUNT(*)::INTEGER as total_personas,
        COUNT(*) FILTER (WHERE voto = true)::INTEGER as total_votados,
        COUNT(*) FILTER (WHERE voto = false)::INTEGER as total_pendientes,
        ROUND(
          CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE COUNT(*) FILTER (WHERE voto = true) * 100.0 / COUNT(*)
          END, 
          2
        ) as porcentaje_participacion,
        COUNT(*) FILTER (WHERE partido = 'ROJO')::INTEGER as total_partido_rojo,
        COUNT(*) FILTER (WHERE partido = 'VERDE')::INTEGER as total_partido_verde,
        COUNT(*) FILTER (WHERE partido = 'ROJO' AND voto = true)::INTEGER as votados_rojo,
        COUNT(*) FILTER (WHERE partido = 'VERDE' AND voto = true)::INTEGER as votados_verde
      FROM personas
    `);
    
    // Top 5 líderes con más participación
    const lideresResult = await query(`
      SELECT 
        l.id,
        l.nombre,
        l.partido,
        COUNT(p.id)::INTEGER as total_asignados,
        COUNT(p.id) FILTER (WHERE p.voto = true)::INTEGER as total_votados,
        ROUND(
          CASE 
            WHEN COUNT(p.id) = 0 THEN 0
            ELSE COUNT(p.id) FILTER (WHERE p.voto = true) * 100.0 / COUNT(p.id)
          END,
          2
        ) as porcentaje
      FROM lideres l
      LEFT JOIN personas p ON p.lider_id = l.id
      GROUP BY l.id, l.nombre, l.partido
      ORDER BY porcentaje DESC, total_votados DESC
      LIMIT 5
    `);
    
    // Estadísticas por zona
    const zonasResult = await query(`
      SELECT 
        z.id,
        z.nombre,
        COUNT(p.id)::INTEGER as total_personas,
        COUNT(p.id) FILTER (WHERE p.voto = true)::INTEGER as total_votados,
        ROUND(
          CASE 
            WHEN COUNT(p.id) = 0 THEN 0
            ELSE COUNT(p.id) FILTER (WHERE p.voto = true) * 100.0 / COUNT(p.id)
          END,
          2
        ) as porcentaje_participacion,
        z.latitud,
        z.longitud
      FROM zonas z
      LEFT JOIN personas p ON p.zona_id = z.id
      GROUP BY z.id, z.nombre, z.latitud, z.longitud
      ORDER BY porcentaje_participacion DESC
    `);
    
    res.json({
      success: true,
      data: {
        stats: statsResult.rows[0],
        topLideres: lideresResult.rows,
        contadores: [],
        zonas: zonasResult.rows
      }
    });
    
  } catch (error) {
    console.error('Error en getDashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo dashboard'
    });
  }
}

/**
 * Obtener todas las personas
 */
async function getPersonas(req, res) {
  try {
    const { search, zona, partido, voto, limit = 100, offset = 0 } = req.query;
    
    let queryText = `
      SELECT 
        p.*,
        z.nombre as zona_nombre,
        l.nombre as lider_nombre,
        lv.nombre as lugar_votacion_nombre,
        u.nombre_completo as contador_nombre
      FROM personas p
      LEFT JOIN zonas z ON p.zona_id = z.id
      LEFT JOIN lideres l ON p.lider_id = l.id
      LEFT JOIN lugares_votacion lv ON p.lugar_votacion_id = lv.id
      LEFT JOIN users u ON p.contador_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND (p.nombre ILIKE $${paramIndex} OR p.documento ILIKE $${paramIndex})`;
      paramIndex++;
    }
    
    if (zona) {
      params.push(zona);
      queryText += ` AND p.zona_id = $${paramIndex}`;
      paramIndex++;
    }
    
    if (partido) {
      params.push(partido);
      queryText += ` AND p.partido = $${paramIndex}`;
      paramIndex++;
    }
    
    if (voto !== undefined) {
      params.push(voto === 'true');
      queryText += ` AND p.voto = $${paramIndex}`;
      paramIndex++;
    }
    
    queryText += ` ORDER BY p.nombre LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(queryText, params);
    
    // Total count
    const countResult = await query('SELECT COUNT(*)::INTEGER as total FROM personas');
    
    res.json({
      success: true,
      data: {
        personas: result.rows,
        total: countResult.rows[0].total
      }
    });
    
  } catch (error) {
    console.error('Error en getPersonas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo personas'
    });
  }
}

/**
 * Buscar líder y sus personas
 */
async function buscarLider(req, res) {
  try {
    const { nombre } = req.query;
    
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'Nombre del líder requerido'
      });
    }
    
    // Buscar líderes
    const lideresResult = await query(
      `SELECT 
        l.*,
        COUNT(p.id)::INTEGER as total_asignados,
        COUNT(p.id) FILTER (WHERE p.voto = true)::INTEGER as total_votados,
        ROUND(
          CASE 
            WHEN COUNT(p.id) = 0 THEN 0
            ELSE COUNT(p.id) FILTER (WHERE p.voto = true) * 100.0 / COUNT(p.id)
          END,
          2
        ) as porcentaje_participacion
       FROM lideres l
       LEFT JOIN personas p ON p.lider_id = l.id
       WHERE l.nombre ILIKE $1
       GROUP BY l.id
       ORDER BY l.nombre`,
      [`%${nombre}%`]
    );
    
    if (lideresResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          lideres: [],
          personas: []
        }
      });
    }
    
    // Si hay líderes, obtener sus personas
    const liderIds = lideresResult.rows.map(l => l.id);
    const personasResult = await query(
      `SELECT 
        p.*,
        z.nombre as zona_nombre,
        l.nombre as lider_nombre
       FROM personas p
       LEFT JOIN zonas z ON p.zona_id = z.id
       LEFT JOIN lideres l ON p.lider_id = l.id
       WHERE p.lider_id = ANY($1)
       ORDER BY l.nombre, p.nombre`,
      [liderIds]
    );
    
    res.json({
      success: true,
      data: {
        lideres: lideresResult.rows,
        personas: personasResult.rows
      }
    });
    
  } catch (error) {
    console.error('Error en buscarLider:', error);
    res.status(500).json({
      success: false,
      message: 'Error buscando líder'
    });
  }
}

/**
 * Obtener todos los contadores
 */
async function getContadores(req, res) {
  try {
    const result = await query(`
      SELECT 
        u.id,
        u.username,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.mesa,
        u.lugar_votacion_id,
        lv.nombre as lugar_votacion_nombre,
        u.is_active,
        u.ultimo_login
      FROM users u
      LEFT JOIN lugares_votacion lv ON lv.id = u.lugar_votacion_id
      WHERE u.role = 'contador' AND u.is_active = true
      ORDER BY u.nombre_completo
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error en getContadores:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuarios registradores'
    });
  }
}

/**
 * Crear nuevo contador
 */
async function createContador(req, res) {
  try {
    const { username, password, nombreCompleto, email, telefono } = req.body;
    
    if (!username || !password || !nombreCompleto) {
      return res.status(400).json({
        success: false,
        message: 'Username, password y nombre completo requeridos'
      });
    }
    
    // Verificar si username ya existe
    const existsResult = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (existsResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El username ya existe'
      });
    }
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Crear contador
    const result = await query(
      `INSERT INTO users (username, password_hash, role, nombre_completo, email, telefono)
       VALUES ($1, $2, 'contador', $3, $4, $5)
       RETURNING id, username, nombre_completo, email, telefono`,
      [username, passwordHash, nombreCompleto, email, telefono]
    );
    
    // Log de auditoría
    await query(
      `INSERT INTO audit_log (user_id, action, table_name, record_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user.userId,
        'CREATE_CONTADOR',
        'users',
        result.rows[0].id,
        JSON.stringify({ username, nombreCompleto }),
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      ]
    );
    
    res.json({
      success: true,
      message: 'Usuario registrador creado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error en createContador:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando usuario registrador'
    });
  }
}

/**
 * Asignar personas a contador
 */
async function asignarPersonasContador(req, res) {
  try {
    const {
      contadorId,
      personaIds,
      autoByMesaLugar,
      autoBySede,
      passwordDefecto
    } = req.body;

    if (autoByMesaLugar || autoBySede) {
      const bcrypt = require('bcryptjs');

      const normalizeSegment = (text) => {
        if (!text) return 'na';
        return text
          .toString()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 20) || 'na';
      };

      const finalPassword = passwordDefecto || process.env.AUTO_CONTADOR_PASSWORD || 'Contador123!';

      const stats = await transaction(async (client) => {
        await client.query('ALTER TABLE personas ADD COLUMN IF NOT EXISTS mesa VARCHAR(20)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_personas_mesa ON personas(mesa)');
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS lugar_votacion_id INTEGER REFERENCES lugares_votacion(id) ON DELETE SET NULL');
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS mesa VARCHAR(20)');

        const gruposResult = await client.query(`
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

        const groups = gruposResult.rows;
        const passwordHash = await bcrypt.hash(finalPassword, 12);
        let usersCreated = 0;
        let usersReused = 0;
        let oldMesaUsersDisabled = 0;

        for (const group of groups) {
          const existingBySede = await client.query(
            `SELECT id FROM users
             WHERE role = 'contador'
               AND lugar_votacion_id = $1
               AND (mesa IS NULL OR TRIM(COALESCE(mesa, '')) = '')
             LIMIT 1`,
            [group.lugar_votacion_id]
          );

          let selectedUserId;

          if (existingBySede.rows.length > 0) {
            selectedUserId = existingBySede.rows[0].id;
            usersReused++;
          } else {
            const baseUsername = `cnt_sede_${group.lugar_votacion_id}_${normalizeSegment(group.lugar_nombre)}`.slice(0, 45);
            let username = baseUsername;
            let suffix = 1;

            while (true) {
              const usernameExists = await client.query(
                'SELECT 1 FROM users WHERE username = $1 LIMIT 1',
                [username]
              );
              if (usernameExists.rows.length === 0) break;
              suffix++;
              username = `${baseUsername}_${suffix}`.slice(0, 50);
            }

            const nombreCompleto = `Contador ${group.lugar_nombre}`.slice(0, 100);

            const inserted = await client.query(
              `INSERT INTO users (
                username, password_hash, role, nombre_completo,
                is_active, lugar_votacion_id, mesa
              ) VALUES ($1, $2, 'contador', $3, true, $4, NULL)
              RETURNING id`,
              [username, passwordHash, nombreCompleto, group.lugar_votacion_id]
            );

            selectedUserId = inserted.rows[0].id;
            usersCreated++;
          }

          const disableResult = await client.query(
            `UPDATE users
             SET is_active = false, updated_at = NOW()
             WHERE role = 'contador'
               AND lugar_votacion_id = $1
               AND mesa IS NOT NULL
               AND id <> $2`,
            [group.lugar_votacion_id, selectedUserId]
          );
          oldMesaUsersDisabled += disableResult.rowCount;
        }

        const asignacionResult = await client.query(`
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

        const pendingResult = await client.query(`
          SELECT COUNT(*)::INTEGER AS total
          FROM personas
          WHERE lugar_votacion_id IS NOT NULL
            AND contador_id IS NULL
        `);

        return {
          sedesDetectadas: groups.length,
          contadoresCreados: usersCreated,
          contadoresExistentes: usersReused,
          contadoresMesaDesactivados: oldMesaUsersDisabled,
          personasAsignadas: asignacionResult.rowCount,
          personasSinContador: pendingResult.rows[0].total,
          passwordDefecto: finalPassword
        };
      });

      await query(
        `INSERT INTO audit_log (user_id, action, details, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.userId,
          'AUTO_ASSIGN_CONTADORES_SEDE',
          JSON.stringify(stats),
          req.ip,
          req.headers['user-agent']
        ]
      );

      return res.json({
        success: true,
        message: 'Contadores creados/asignados automáticamente por sede',
        data: stats
      });
    }
    
    if (!contadorId || !personaIds || !Array.isArray(personaIds)) {
      return res.status(400).json({
        success: false,
        message: 'Contador ID y array de persona IDs  requeridos'
      });
    }
    
    // Verificar que el contador existe
    const contadorResult = await query(
      'SELECT id FROM users WHERE id = $1 AND role = \'contador\'',
      [contadorId]
    );
    
    if (contadorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario registrador no encontrado'
      });
    }
    
    // Asignar personas
    await query(
      'UPDATE personas SET contador_id = $1 WHERE id = ANY($2)',
      [contadorId, personaIds]
    );
    
    // Log de auditoría
    await query(
      `INSERT INTO audit_log (user_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.userId,
        'ASSIGN_PERSONAS_CONTADOR',
        JSON.stringify({ contadorId, personasCount: personaIds.length }),
        req.ip,
        req.headers['user-agent']
      ]
    );
    
    res.json({
      success: true,
      message: `${personaIds.length} personas asignadas exitosamente`
    });
    
  } catch (error) {
    console.error('Error en asignarPersonasContador:', error);
    res.status(500).json({
      success: false,
      message: 'Error asignando personas'
    });
  }
}

/**
 * Obtener mapa electoral
 */
async function getMapaElectoral(req, res) {
  try {
    const zonasResult = await query(`
      SELECT 
        z.id,
        z.nombre,
        z.descripcion,
        z.latitud,
        z.longitud,
        COUNT(p.id)::INTEGER as total_personas,
        COUNT(p.id) FILTER (WHERE p.voto = true)::INTEGER as total_votados,
        ROUND(
          CASE 
            WHEN COUNT(p.id) = 0 THEN 0
            ELSE COUNT(p.id) FILTER (WHERE p.voto = true) * 100.0 / COUNT(p.id)
          END,
          2
        ) as porcentaje_participacion
      FROM zonas z
      LEFT JOIN personas p ON p.zona_id = z.id
      GROUP BY z.id
    `);
    
    const lugaresResult = await query(`
      SELECT 
        lv.id,
        lv.nombre,
        lv.direccion,
        lv.latitud,
        lv.longitud,
        lv.capacidad,
        z.nombre as zona_nombre,
        COUNT(p.id)::INTEGER as personas_asignadas
      FROM lugares_votacion lv
      LEFT JOIN zonas z ON lv.zona_id = z.id
      LEFT JOIN personas p ON p.lugar_votacion_id = lv.id
      GROUP BY lv.id, z.nombre
    `);
    
    res.json({
      success: true,
      data: {
        zonas: zonasResult.rows,
        lugares: lugaresResult.rows
      }
    });
    
  } catch (error) {
    console.error('Error en getMapaElectoral:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo mapa electoral'
    });
  }
}

/**
 * Reset completo de base de datos
 */
async function resetDatabase(req, res) {
  try {
    const { confirmacion } = req.body;
    
    if (confirmacion !== 'RESET_COMPLETE_SYSTEM') {
      return res.status(400).json({
        success: false,
        message: 'Confirmación incorrecta'
      });
    }
    
    await transaction(async (client) => {
      // Eliminar datos pero mantener estructura
      await client.query('TRUNCATE TABLE personas CASCADE');
      await client.query('TRUNCATE TABLE lideres CASCADE');
      await client.query('DELETE FROM users WHERE role = \'contador\'');
      await client.query('DELETE FROM sessions');
      await client.query('DELETE FROM audit_log');
      
      // Reset secuencias
      await client.query('ALTER SEQUENCE personas_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE lideres_id_seq RESTART WITH 1');
    });
    
    // Log de auditoría
    await query(
      `INSERT INTO audit_log (user_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.userId,
        'DATABASE_RESET',
        JSON.stringify({ timestamp: new Date().toISOString() }),
        req.ip,
        req.headers['user-agent']
      ]
    );
    
    res.json({
      success: true,
      message: 'Base de datos reseteada exitosamente'
    });
    
  } catch (error) {
    console.error('Error en resetDatabase:', error);
    res.status(500).json({
      success: false,
      message: 'Error reseteando base de datos'
    });
  }
}

/**
 * Actualizar persona (principalmente para reasignar contador)
 */
async function updatePersona(req, res) {
  try {
    const { id } = req.params;
    const { contador_id, lider_id, partido, zona_id } = req.body;
    
    // Construir query dinámicamente con solo los campos proporcionados
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (contador_id !== undefined) {
      updates.push(`contador_id = $${paramCount}`);
      values.push(contador_id);
      paramCount++;
    }
    
    if (lider_id !== undefined) {
      updates.push(`lider_id = $${paramCount}`);
      values.push(lider_id);
      paramCount++;
    }
    
    if (partido !== undefined) {
      updates.push(`partido = $${paramCount}`);
      values.push(partido);
      paramCount++;
    }
    
    if (zona_id !== undefined) {
      updates.push(`zona_id = $${paramCount}`);
      values.push(zona_id);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar'
      });
    }
    
    // Agregar updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Agregar el ID al final
    values.push(id);
    
    const result = await query(
      `UPDATE personas 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Persona no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Persona actualizada exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error en updatePersona:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando persona'
    });
  }
}

/**
 * Obtener todos los líderes con su información
 */
async function getAllLideres(req, res) {
  try {
    const lideresResult = await query(`
      SELECT 
        l.id,
        l.nombre,
        l.partido,
        COUNT(p.id)::INTEGER as total_asignados,
        COUNT(p.id) FILTER (WHERE p.voto = true)::INTEGER as total_votados,
        COUNT(p.id) FILTER (WHERE p.voto = false)::INTEGER as total_pendientes,
        ROUND(
          CASE 
            WHEN COUNT(p.id) = 0 THEN 0
            ELSE COUNT(p.id) FILTER (WHERE p.voto = true) * 100.0 / COUNT(p.id)
          END,
          2
        ) as porcentaje_participacion
      FROM lideres l
      LEFT JOIN personas p ON p.lider_id = l.id
      GROUP BY l.id, l.nombre, l.partido
      ORDER BY l.nombre ASC
    `);

    res.json({
      success: true,
      data: {
        lideres: lideresResult.rows,
        total: lideresResult.rows.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo líderes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo líderes'
    });
  }
}

/**
 * Obtener personas de un líder específico
 */
async function getPersonasByLider(req, res) {
  try {
    const { id } = req.params;

    // Obtener información del líder
    const liderResult = await query(
      `SELECT 
        l.id,
        l.nombre,
        l.partido,
        COUNT(p.id)::INTEGER as total_asignados,
        COUNT(p.id) FILTER (WHERE p.voto = true)::INTEGER as total_votados,
        COUNT(p.id) FILTER (WHERE p.voto = false)::INTEGER as total_pendientes
      FROM lideres l
      LEFT JOIN personas p ON p.lider_id = l.id
      WHERE l.id = $1
      GROUP BY l.id, l.nombre, l.partido`,
      [id]
    );

    if (liderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Líder no encontrado'
      });
    }

    const lider = liderResult.rows[0];

    // Obtener personas del líder
    const personasResult = await query(
      `SELECT 
        p.id,
        p.nombre,
        p.documento,
        p.telefono,
        p.direccion,
        p.voto,
        z.nombre as zona_nombre,
        lv.nombre as lugar_votacion_nombre,
        u.nombre_completo as contador_nombre
      FROM personas p
      LEFT JOIN zonas z ON p.zona_id = z.id
      LEFT JOIN lugares_votacion lv ON p.lugar_votacion_id = lv.id
      LEFT JOIN users u ON p.contador_id = u.id
      WHERE p.lider_id = $1
      ORDER BY p.voto ASC, p.nombre ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        lider: lider,
        personas: personasResult.rows,
        total: personasResult.rows.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo personas del líder:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo personas del líder'
    });
  }
}

/**
 * Eliminar contador
 */
async function deleteContador(req, res) {
  try {
    const { id } = req.params;

    // Verificar que el contador existe
    const contadorResult = await query(
      'SELECT id, username, nombre_completo FROM users WHERE id = $1 AND role = \'contador\'',
      [id]
    );

    if (contadorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contador no encontrado'
      });
    }

    const contador = contadorResult.rows[0];

    // Verificar si tiene personas asignadas
    const personasResult = await query(
      'SELECT COUNT(*)::INTEGER as total FROM personas WHERE contador_id = $1',
      [id]
    );

    const totalPersonas = personasResult.rows[0].total;

    // Si tiene personas asignadas, desasignarlas primero
    if (totalPersonas > 0) {
      await query(
        'UPDATE personas SET contador_id = NULL WHERE contador_id = $1',
        [id]
      );
    }

    // Desactivar el contador (soft delete)
    await query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id]
    );

    // Log de auditoría
    await query(
      `INSERT INTO audit_log (user_id, action, table_name, record_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user.userId,
        'DELETE_CONTADOR',
        'users',
        id,
        JSON.stringify({ username: contador.username, nombre_completo: contador.nombre_completo, personas_desasignadas: totalPersonas }),
        req.ip,
        req.headers['user-agent']
      ]
    );

    res.json({
      success: true,
      message: `Usuario registrador ${contador.nombre_completo} eliminado. ${totalPersonas} personas desasignadas.`,
      data: {
        personas_desasignadas: totalPersonas
      }
    });

  } catch (error) {
    console.error('Error eliminando contador:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando usuario registrador'
    });
  }
}

module.exports = {
  getDashboard,
  getPersonas,
  updatePersona,
  buscarLider,
  getAllLideres,
  getPersonasByLider,
  getContadores,
  createContador,
  deleteContador,
  asignarPersonasContador,
  getMapaElectoral,
  resetDatabase
};
