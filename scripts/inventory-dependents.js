const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Tablas que referencian pacientes, historias_clinicas, atenciones_salud o citas
  const refs = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT kcu.table_name AS child, ccu.table_name AS parent, kcu.column_name AS col
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name IN ('pacientes','historias_clinicas','atenciones_salud','citas','notas_evolucion_historia','acompanantes','diagnosticos_atencion')
    ORDER BY parent, child
  `);
  const childTables = [...new Set(refs.map((r) => r.child))].filter(
    (t) => !["pacientes","historias_clinicas","atenciones_salud","citas"].includes(t),
  );
  console.log("FKs encontrados:");
  refs.forEach((r) => console.log(`  ${r.parent} <- ${r.child} (${r.col})`));

  console.log("\nConteos:");
  const counts = {};
  for (const t of ["pacientes","historias_clinicas","atenciones_salud","citas",...childTables,"archivos_adjuntos","documentos_exportados"]) {
    try {
      const c = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "${t}"`);
      counts[t] = c[0].n;
    } catch { counts[t] = "err"; }
  }
  Object.entries(counts).forEach(([t, n]) => console.log(`  ${t}: ${n}`));
}

main().finally(() => prisma.$disconnect());
