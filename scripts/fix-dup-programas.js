const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Verificar uso de los genéricos del seed/legado
  const genericos = await prisma.programas_academicos.findMany({
    where: { codigo: { in: ["PROG_ADM_EMP", "PROG_ING_SIST", "PROG_ING_IND", "PROG_PSICO", "AREA_ADMISIONES", "AREA_BIENESTAR", "AREA_TALENTO_HUMANO", "EXT_EXTERNO"] } },
    include: { _count: { select: { pacientes: true } } },
  });
  console.log("=== GENÉRICOS ===");
  genericos.forEach((p) =>
    console.log(`  id=${p.id_programa_academico} codigo=${p.codigo} nombre="${p.nombre}" pacientes=${p._count.pacientes}`),
  );

  // Eliminar solo los duplicados sin pacientes
  const aEliminar = genericos.filter(
    (p) => p._count.pacientes === 0 && ["PROG_ING_SIST", "PROG_ING_IND"].includes(p.codigo),
  );
  for (const p of aEliminar) {
    const refs = await prisma.pacientes.count({ where: { id_programa_academico: p.id_programa_academico } });
    if (refs > 0) {
      console.log(`  OMITIDO id=${p.id_programa_academico}: tiene ${refs} pacientes`);
      continue;
    }
    await prisma.programas_academicos.delete({ where: { id_programa_academico: p.id_programa_academico } });
    console.log(`  ELIMINADO id=${p.id_programa_academico} ${p.codigo} "${p.nombre}"`);
  }
}

main().finally(() => prisma.$disconnect());
