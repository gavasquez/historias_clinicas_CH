import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestData(minId: number = 10000) {
  console.log('🧹 Iniciando limpieza de datos de prueba...');
  console.log(`📍 Eliminando registros con ID >= ${minId}`);

  try {
    // 1. Obtener IDs de atenciones a eliminar
    const atencionesAEliminar = await prisma.atenciones_salud.findMany({
      where: {
        citas: {
          id_cita: { gte: minId }
        }
      },
      select: { id_atencion: true }
    });

    const atencionIds = atencionesAEliminar.map(a => a.id_atencion);

    // 2. Eliminar diagnósticos de atenciones
    const deletedDiagnostics = await prisma.diagnosticos_atencion.deleteMany({
      where: {
        id_atencion: { in: atencionIds }
      }
    });
    console.log(`✅ Diagnosticos eliminados: ${deletedDiagnostics.count}`);

    // 3. Eliminar antecedentes de atenciones
    const deletedAntecedents = await prisma.hc_antecedentes_atencion.deleteMany({
      where: {
        id_atencion: { in: atencionIds }
      }
    });
    console.log(`✅ Antecedentes eliminados: ${deletedAntecedents.count}`);

    // 4. Eliminar anamnesis de atenciones
    const deletedAnamnesis = await prisma.hc_anamnesis_atencion.deleteMany({
      where: {
        id_atencion: { in: atencionIds }
      }
    });
    console.log(`✅ Anamnesis eliminados: ${deletedAnamnesis.count}`);

    // 5. Eliminar cierres de atención
    const deletedCierre = await prisma.hc_atencion_cierre.deleteMany({
      where: {
        id_atencion: { in: atencionIds }
      }
    });
    console.log(`✅ Cierres de atención eliminados: ${deletedCierre.count}`);

    // 6. Eliminar atenciones de salud
    const deletedAttentions = await prisma.atenciones_salud.deleteMany({
      where: {
        citas: {
          id_cita: { gte: minId }
        }
      }
    });
    console.log(`✅ Atenciones eliminadas: ${deletedAttentions.count}`);

    // 7. Eliminar historias clínicas (solo las que no están vinculadas a otras en seguimiento)
    const deletedHistories = await prisma.historias_clinicas.deleteMany({
      where: {
        id_historia: { gte: minId },
        id_historia_vinculada: null
      }
    });
    console.log(`✅ Historias clínicas eliminadas: ${deletedHistories.count}`);

    // 8. Eliminar citas
    const deletedAppointments = await prisma.citas.deleteMany({
      where: {
        id_cita: { gte: minId }
      }
    });
    console.log(`✅ Citas eliminadas: ${deletedAppointments.count}`);

    console.log('✨ Limpieza completada exitosamente');

    // Verificación
    const citasCount = await prisma.citas.count();
    const atencionesCount = await prisma.atenciones_salud.count();
    const historiasCount = await prisma.historias_clinicas.count();

    console.log('\n📊 Registros restantes:');
    console.log(`   - Citas: ${citasCount}`);
    console.log(`   - Atenciones: ${atencionesCount}`);
    console.log(`   - Historias clínicas: ${historiasCount}`);

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Limpieza completa (todos los registros)
async function cleanAllData() {
  console.log('🧹 Iniciando limpieza COMPLETA de datos...');
  console.log('⚠️  ADVERTENCIA: Se eliminarán TODOS los registros');

  try {
    // Eliminar en orden inverso a las dependencias
    await prisma.diagnosticos_atencion.deleteMany({});
    console.log('✅ Todos los diagnósticos eliminados');

    await prisma.hc_antecedentes_atencion.deleteMany({});
    console.log('✅ Todos los antecedentes eliminados');

    await prisma.hc_anamnesis_atencion.deleteMany({});
    console.log('✅ Todos los anamnesis eliminados');

    await prisma.hc_atencion_cierre.deleteMany({});
    console.log('✅ Todos los cierres de atención eliminados');

    await prisma.atenciones_salud.deleteMany({});
    console.log('✅ Todas las atenciones eliminadas');

    await prisma.historias_clinicas.deleteMany({});
    console.log('✅ Todas las historias clínicas eliminadas');

    await prisma.citas.deleteMany({});
    console.log('✅ Todas las citas eliminadas');

    console.log('✨ Limpieza COMPLETA realizada');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar según el argumento de línea de comandos
const args = process.argv.slice(2);
const mode = args[0] || 'test'; // 'test' (por defecto) o 'all'

if (mode === 'all') {
  cleanAllData();
} else {
  const minId = args[1] ? parseInt(args[1]) : 10000;
  cleanTestData(minId);
}
