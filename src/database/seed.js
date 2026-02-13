/**
 * 🌱 SEED DATA - Datos de Ejemplo Realistas
 * Poblador de base de datos con información electoral de ejemplo
 */

const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');

// Nombres y apellidos colombianos realistas
const nombres = [
    'María', 'Carlos', 'Ana', 'José', 'Laura', 'Luis', 'Carmen', 'Pedro', 'Diana', 'Jorge',
    'Sandra', 'Miguel', 'Paula', 'Andrés', 'Carolina', 'Fernando', 'Claudia', 'Ricardo', 'Valentina', 'David',
    'Natalia', 'Javier', 'Adriana', 'Camilo', 'Juliana', 'Daniel', 'Paola', 'Alejandro', 'Mónica', 'Juan',
    'Marcela', 'Sebastián', 'Andrea', 'Felipe', 'Catalina', 'Roberto', 'Isabel', 'Mauricio', 'Beatriz', 'Óscar',
    'Gloria', 'Hernán', 'Lucía', 'Germán', 'Martha', 'Arturo', 'Patricia', 'Rodrigo', 'Cristina', 'Eduardo'
];

const apellidos = [
    'García', 'Rodríguez', 'Martínez', 'Hernández', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
    'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Gutiérrez', 'Ortiz', 'Chávez',
    'Ruiz', 'Jiménez', 'Moreno', 'Álvarez', 'Romero', 'Medina', 'Castro', 'Vargas', 'Ramos', 'Silva',
    'Vega', 'Mendoza', 'Aguilar', 'Salazar', 'León', 'Herrera', 'Contreras', 'Campos', 'Rojas', 'Delgado'
];

const nombresLideres = [
    'Lucía Fernández', 'Martín Ospina', 'Elena Vargas', 'Pablo Rincón', 'Rosa Moreno',
    'Héctor Suárez', 'Beatriz Castillo', 'Guillermo Parra', 'Teresa Valencia', 'Antonio Mejía',
    'Gabriela Ortega', 'Francisco Quintero', 'Silvia Arango', 'Ramiro Cárdenas', 'Lidia Navarro'
];

const lugaresVotacion = [
    'Escuela República de Colombia', 'Colegio San José', 'Instituto Técnico Central',
    'Universidad Nacional Sede Centro', 'Polideportivo Los Comuneros', 
    'Casa de la Cultura', 'Colegio Santa María', 'Centro Cívico Municipal',
    'Escuela Simón Bolívar', 'Instituto Pedagógico Nacional'
];

const direcciones = [
    'Calle 45 #23-15', 'Carrera 7 #18-42', 'Avenida 68 #32-08', 'Transversal 12 #45-67',
    'Diagonal 25 #14-33', 'Calle 72 #10-15', 'Carrera 15 #34-20', 'Avenida Boyacá #50-12'
];

const partidos = ['ROJO', 'VERDE'];

function generarCedula() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
}

function generarTelefono() {
    return '3' + Math.floor(100000000 + Math.random() * 900000000).toString();
}

function nombreAleatorio() {
    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    const apellido1 = apellidos[Math.floor(Math.random() * apellidos.length)];
    const apellido2 = apellidos[Math.floor(Math.random() * apellidos.length)];
    return `${nombre} ${apellido1} ${apellido2}`;
}

async function seedDatabase(forceMode = false) {
    console.log('🌱 Iniciando poblado de datos de ejemplo...\n');

    try {
        // Verificar si ya hay datos
        const checkResult = await query('SELECT COUNT(*) as count FROM personas');
        const personasExistentes = parseInt(checkResult.rows[0].count);

        if (personasExistentes > 100 && !forceMode) {
            console.log(`⚠️  Ya existen ${personasExistentes} personas en la base de datos.`);
            console.log('¿Deseas eliminar los datos existentes y crear nuevos?');
            console.log('Para continuar con datos nuevos, ejecuta: node src/database/seed.js --force\n');
            return;
        }

        if (forceMode && personasExistentes > 0) {
            console.log('🔥 Modo FORCE activado - Limpiando datos existentes...\n');
            await query('TRUNCATE personas, lideres, lugares_votacion RESTART IDENTITY CASCADE');
            await query("DELETE FROM users WHERE role = 'contador' AND username != 'contador1'");
            console.log('✅ Datos limpiados\n');
        }

        // 1. Crear líderes (15)
        console.log('👥 Creando líderes...');
        const lideresIds = [];
        for (let i = 0; i < nombresLideres.length; i++) {
            const telefono = generarTelefono();
            const partido = partidos[Math.floor(Math.random() * partidos.length)];
            const zonaId = (i % 5) + 1; // Distribuir entre las 5 zonas

            const result = await query(
                `INSERT INTO lideres (nombre, telefono, partido, zona_id) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [nombresLideres[i], telefono, partido, zonaId]
            );
            lideresIds.push(result.rows[0].id);
        }
        console.log(`✅ ${lideresIds.length} líderes creados\n`);

        // 2. Crear lugares de votación (10)
        console.log('🏛️  Creando lugares de votación...');
        const lugaresIds = [];
        for (let i = 0; i < lugaresVotacion.length; i++) {
            const zonaId = (i % 5) + 1;
            const direccion = direcciones[i % direcciones.length];

            const result = await query(
                `INSERT INTO lugares_votacion (nombre, direccion, zona_id) 
                 VALUES ($1, $2, $3) RETURNING id`,
                [lugaresVotacion[i], direccion, zonaId]
            );
            lugaresIds.push(result.rows[0].id);
        }
        console.log(`✅ ${lugaresIds.length} lugares de votación creados\n`);

        // 3. Crear contadores adicionales (5)
        console.log('📝 Creando usuarios contadores...');
        const passwordHash = await bcrypt.hash('Contador123!', 12);
        for (let i = 2; i <= 6; i++) {
            await query(
                `INSERT INTO users (username, password_hash, role, nombre_completo, email, is_active) 
                 VALUES ($1, $2, 'contador', $3, $4, true) 
                 ON CONFLICT (username) DO NOTHING`,
                [
                    `contador${i}`,
                    passwordHash,
                    `Contador ${i}`,
                    `contador${i}@electoral.com`
                ]
            );
        }
        console.log('✅ 5 contadores adicionales creados (contador2-contador6)\n');

        // 4. Obtener IDs de contadores
        const contadoresResult = await query("SELECT id FROM users WHERE role = 'contador' ORDER BY id");
        const contadoresIds = contadoresResult.rows.map(r => r.id);

        // 5. Crear personas (800 personas)
        console.log('👤 Creando personas votantes...');
        const totalPersonas = 800;
        const batchSize = 100;
        let personasCreadas = 0;

        for (let batch = 0; batch < Math.ceil(totalPersonas / batchSize); batch++) {
            const personas = [];
            const personasInBatch = Math.min(batchSize, totalPersonas - personasCreadas);

            for (let i = 0; i < personasInBatch; i++) {
                const cedula = generarCedula();
                const nombre = nombreAleatorio();
                const telefono = generarTelefono();
                const partido = partidos[Math.floor(Math.random() * partidos.length)];
                const liderId = lideresIds[Math.floor(Math.random() * lideresIds.length)];
                const lugarId = lugaresIds[Math.floor(Math.random() * lugaresIds.length)];
                const contadorId = contadoresIds[Math.floor(Math.random() * contadoresIds.length)];
                
                // 30% ya votaron
                const voto = Math.random() < 0.3;

                personas.push({
                    cedula,
                    nombre,
                    telefono,
                    partido,
                    liderId,
                    lugarId,
                    contadorId,
                    voto
                });
            }

            // Insertar batch
            for (const persona of personas) {
                await query(
                    `INSERT INTO personas 
                     (documento, nombre, telefono, partido, lider_id, lugar_votacion_id, contador_id, voto) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        persona.cedula,
                        persona.nombre,
                        persona.telefono,
                        persona.partido,
                        persona.liderId,
                        persona.lugarId,
                        persona.contadorId,
                        persona.voto
                    ]
                );
            }

            personasCreadas += personasInBatch;
            console.log(`   ${personasCreadas}/${totalPersonas} personas creadas...`);
        }
        console.log(`✅ ${personasCreadas} personas creadas\n`);

        // 6. Mostrar resumen
        console.log('═══════════════════════════════════════════════════════');
        console.log('🎊 DATOS DE EJEMPLO CREADOS EXITOSAMENTE');
        console.log('═══════════════════════════════════════════════════════\n');

        const stats = await query(`
            SELECT 
                (SELECT COUNT(*) FROM personas) as total_personas,
                (SELECT COUNT(*) FROM personas WHERE voto = true) as total_votados,
                (SELECT COUNT(*) FROM lideres) as total_lideres,
                (SELECT COUNT(*) FROM lugares_votacion) as total_lugares,
                (SELECT COUNT(*) FROM users WHERE role = 'contador') as total_contadores,
                (SELECT COUNT(*) FROM personas WHERE partido = 'ROJO') as partido_rojo,
                (SELECT COUNT(*) FROM personas WHERE partido = 'VERDE') as partido_verde
        `);

        const s = stats.rows[0];
        const participacion = ((s.total_votados / s.total_personas) * 100).toFixed(2);

        console.log(`📊 ESTADÍSTICAS GENERALES:`);
        console.log(`   👥 Total Personas: ${s.total_personas}`);
        console.log(`   ✅ Votaron: ${s.total_votados} (${participacion}%)`);
        console.log(`   ⏳ Pendientes: ${s.total_personas - s.total_votados}`);
        console.log(`   🔴 Partido ROJO: ${s.partido_rojo}`);
        console.log(`   🟢 Partido VERDE: ${s.partido_verde}\n`);

        console.log(`👥 LÍDERES: ${s.total_lideres}`);
        console.log(`🏛️  LUGARES DE VOTACIÓN: ${s.total_lugares}`);
        console.log(`📝 CONTADORES: ${s.total_contadores}\n`);

        console.log('💡 CREDENCIALES DE ACCESO:');
        console.log('   Admin: admin / Admin123!');
        console.log('   Contadores: contador1-contador6 / Contador123!\n');

        console.log('🚀 El sistema está listo con datos de ejemplo');
        console.log('   Accede a http://localhost:3000 para verlo en acción\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error durante el seed:', error);
        console.error(error);
        process.exit(1);
    }
}

// Ejecutar seed
const force = process.argv.includes('--force');
seedDatabase(force);
