-- =====================================================
-- SISTEMA DE VOTACIÓN ELECTORAL ENTERPRISE v3.0.0
-- Schema de Base de Datos PostgreSQL 13+
-- =====================================================

-- Eliminar tablas si existen (para setup limpio)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS personas CASCADE;
DROP TABLE IF EXISTS lideres CASCADE;
DROP TABLE IF EXISTS zonas CASCADE;
DROP TABLE IF EXISTS lugares_votacion CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;

-- =====================================================
-- TABLA: users (Administradores y Contadores)
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'contador')),
    nombre_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    lugar_votacion_id INTEGER,
    mesa VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    ultimo_login TIMESTAMP,
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- =====================================================
-- TABLA: zonas (Zonas Electorales)
-- =====================================================
CREATE TABLE zonas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zonas_nombre ON zonas(nombre);

-- =====================================================
-- TABLA: lugares_votacion (Puntos de Votación)
-- =====================================================
CREATE TABLE lugares_votacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    zona_id INTEGER REFERENCES zonas(id) ON DELETE SET NULL,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    capacidad INTEGER DEFAULT 500,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lugares_zona ON lugares_votacion(zona_id);

-- FK diferida: users -> lugares_votacion (la tabla ya existe en este punto)
ALTER TABLE users
ADD CONSTRAINT users_lugar_votacion_id_fkey
FOREIGN KEY (lugar_votacion_id)
REFERENCES lugares_votacion(id)
ON DELETE SET NULL;

-- =====================================================
-- TABLA: lideres (Líderes Políticos)
-- =====================================================
CREATE TABLE lideres (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    partido VARCHAR(50) NOT NULL CHECK (partido IN ('ROJO', 'VERDE')),
    telefono VARCHAR(20),
    zona_id INTEGER REFERENCES zonas(id) ON DELETE SET NULL,
    total_asignados INTEGER DEFAULT 0,
    total_votados INTEGER DEFAULT 0,
    porcentaje_participacion DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lideres_nombre ON lideres(nombre);
CREATE INDEX idx_lideres_partido ON lideres(partido);
CREATE INDEX idx_lideres_zona ON lideres(zona_id);

-- =====================================================
-- TABLA: personas (Votantes)
-- =====================================================
CREATE TABLE personas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    documento VARCHAR(50) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    direccion TEXT,
    mesa VARCHAR(20),
    
    -- Relaciones
    zona_id INTEGER REFERENCES zonas(id) ON DELETE SET NULL,
    lugar_votacion_id INTEGER REFERENCES lugares_votacion(id) ON DELETE SET NULL,
    lider_id INTEGER REFERENCES lideres(id) ON DELETE SET NULL,
    contador_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Estado de votación
    voto BOOLEAN DEFAULT false,
    fecha_voto TIMESTAMP,
    
    -- Partido político
    partido VARCHAR(50) CHECK (partido IN ('ROJO', 'VERDE')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices críticos para personas (optimización de queries)
CREATE INDEX idx_personas_nombre ON personas(nombre);
CREATE INDEX idx_personas_documento ON personas(documento);
CREATE INDEX idx_personas_voto ON personas(voto);
CREATE INDEX idx_personas_zona ON personas(zona_id);
CREATE INDEX idx_personas_lider ON personas(lider_id);
CREATE INDEX idx_personas_contador ON personas(contador_id);
CREATE INDEX idx_personas_partido ON personas(partido);
CREATE INDEX idx_personas_lugar ON personas(lugar_votacion_id);
CREATE INDEX idx_personas_mesa ON personas(mesa);

-- =====================================================
-- TABLA: sessions (Sesiones Activas)
-- =====================================================
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- =====================================================
-- TABLA: audit_log (Auditoría Completa)
-- =====================================================
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_table ON audit_log(table_name);
CREATE INDEX idx_audit_created ON audit_log(created_at);
CREATE INDEX idx_audit_success ON audit_log(success);

-- =====================================================
-- TABLA: system_config (Configuración del Sistema)
-- =====================================================
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuraciones iniciales
INSERT INTO system_config (config_key, config_value, description) VALUES
('sistema_version', '3.0.0', 'Versión del sistema'),
('ultimo_backup', NULL, 'Timestamp del último backup automático'),
('total_votantes', '0', 'Total de personas registradas'),
('eleccion_activa', 'true', 'Si la elección está activa'),
('nombre_eleccion', 'Elección Municipal 2026', 'Nombre de la elección actual');

-- =====================================================
-- DATOS INICIALES - USUARIOS
-- =====================================================

-- Admin principal (password: Admin123!)
-- Hash bcrypt de "Admin123!" con 12 rondas
INSERT INTO users (username, password_hash, role, nombre_completo, email, is_active) VALUES
('admin', '$2a$12$mJhl8fsQGT9oFCmw.v//iO2uxyjc68EuxzAbIzdJnxtSayZkgnFiS', 'admin', 'Administrador Principal', 'admin@electoral.com', true);

-- Contador de prueba (password: Contador123!)
-- Hash bcrypt de "Contador123!" con 12 rondas
INSERT INTO users (username, password_hash, role, nombre_completo, email, is_active) VALUES
('contador1', '$2a$12$Nty46lnPdAxQsHFzN6FWk.uVyG9MwklLw/NDGfUK/laMYewC0tena', 'contador', 'Contador de Prueba', 'contador1@electoral.com', true);

-- =====================================================
-- ZONAS DE EJEMPLO
-- =====================================================
INSERT INTO zonas (nombre, descripcion, latitud, longitud) VALUES
('Centro', 'Zona central de la ciudad', 4.7110, -74.0721),
('Norte', 'Zona norte', 4.7510, -74.0321),
('Sur', 'Zona sur', 4.6710, -74.1121),
('Este', 'Zona este', 4.7110, -74.0321),
('Oeste', 'Zona oeste', 4.7110, -74.1121);

-- =====================================================
-- LUGARES DE VOTACIÓN DE EJEMPLO
-- =====================================================
INSERT INTO lugares_votacion (nombre, direccion, zona_id, latitud, longitud) VALUES
('Escuela Central', 'Calle 10 #15-20', 1, 4.7110, -74.0721),
('Colegio Norte', 'Carrera 30 #50-10', 2, 4.7510, -74.0321),
('Polideportivo Sur', 'Avenida Sur #5-30', 3, 4.6710, -74.1121),
('Centro Comunitario Este', 'Calle 25 #80-50', 4, 4.7110, -74.0321),
('Salón Comunal Oeste', 'Carrera 10 #20-15', 5, 4.7110, -74.1121);

-- =====================================================
-- TRIGGERS DE ACTUALIZACIÓN
-- =====================================================

-- Trigger para actualizar updated_at en users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lideres_updated_at BEFORE UPDATE ON lideres
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar estadísticas de líder cuando cambia el voto
CREATE OR REPLACE FUNCTION update_lider_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.voto != OLD.voto AND NEW.lider_id IS NOT NULL THEN
        UPDATE lideres
        SET 
            total_votados = (
                SELECT COUNT(*) FROM personas 
                WHERE lider_id = NEW.lider_id AND voto = true
            ),
            porcentaje_participacion = (
                SELECT 
                    CASE 
                        WHEN COUNT(*) = 0 THEN 0
                        ELSE (COUNT(*) FILTER (WHERE voto = true) * 100.0 / COUNT(*))
                    END
                FROM personas 
                WHERE lider_id = NEW.lider_id
            )
        WHERE id = NEW.lider_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_lider_stats AFTER UPDATE ON personas
    FOR EACH ROW EXECUTE FUNCTION update_lider_stats();

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas generales
CREATE OR REPLACE FUNCTION get_general_stats()
RETURNS TABLE (
    total_personas INTEGER,
    total_votados INTEGER,
    total_pendientes INTEGER,
    porcentaje_participacion DECIMAL,
    total_partido_rojo INTEGER,
    total_partido_verde INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_personas,
        COUNT(*) FILTER (WHERE voto = true)::INTEGER as total_votados,
        COUNT(*) FILTER (WHERE voto = false)::INTEGER as total_pendientes,
        CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND(COUNT(*) FILTER (WHERE voto = true) * 100.0 / COUNT(*), 2)
        END as porcentaje_participacion,
        COUNT(*) FILTER (WHERE partido = 'ROJO')::INTEGER as total_partido_rojo,
        COUNT(*) FILTER (WHERE partido = 'VERDE')::INTEGER as total_partido_verde
    FROM personas;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERMISOS Y SEGURIDAD
-- =====================================================

-- Revocar permisos públicos
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Comentarios de documentación
COMMENT ON TABLE users IS 'Usuarios del sistema (Admin y Contadores)';
COMMENT ON TABLE personas IS 'Votantes registrados en el sistema';
COMMENT ON TABLE lideres IS 'Líderes políticos de ambos partidos';
COMMENT ON TABLE zonas IS 'Zonas electorales geográficas';
COMMENT ON TABLE lugares_votacion IS 'Lugares físicos de votación';
COMMENT ON TABLE sessions IS 'Sesiones activas de usuarios';
COMMENT ON TABLE audit_log IS 'Registro de auditoría de todas las acciones';
COMMENT ON TABLE system_config IS 'Configuración del sistema';

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

-- Vacunar base de datos
VACUUM ANALYZE;

-- Mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '✅ Base de datos inicializada correctamente';
    RAISE NOTICE '✅ Schema versión 3.0.0';
    RAISE NOTICE '✅ 8 tablas creadas';
    RAISE NOTICE '✅ 15+ índices optimizados';
    RAISE NOTICE '✅ Triggers activos';
    RAISE NOTICE '✅ Usuario admin creado';
    RAISE NOTICE '✅ Datos de ejemplo insertados';
    RAISE NOTICE '🎊 Sistema listo para producción';
END $$;
