const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const historias = await prisma.historias_clinicas.findMany({
    where: { id_paciente: 11928 },
    orderBy: { id_historia: "asc" },
    include: {
      tipos_historia_clinica: { select: { codigo: true } },
      atenciones_salud: {
        orderBy: { fecha_hora: "desc" },
        include: {
          hc_atencion_cierre: true,
          diagnosticos_atencion: {
            orderBy: { es_principal: "desc" },
            include: {
              cie10: { select: { codigo: true, nombre: true } },
              tipos_confirmacion_diagnostico: { select: { codigo: true } },
            },
          },
        },
      },
    },
  });

  for (const h of historias) {
    console.log(`\nHistoria ${h.id_historia} | ${h.tipos_historia_clinica.codigo} | estado=${h.estado} | vinculada=${h.id_historia_vinculada}`);
    for (const a of h.atenciones_salud) {
      const c = a.hc_atencion_cierre;
      console.log(`  Atencion ${a.id_atencion} | cita=${a.id_cita} | seg_opcion=${c?.seguimiento_opcion} | cierre_seg=${c?.cierre_seguimiento}`);
      for (const d of a.diagnosticos_atencion) {
        console.log(`    Dx ${d.cie10.codigo} | principal=${d.es_principal} | conf=${d.tipos_confirmacion_diagnostico?.codigo ?? "null"}`);
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
