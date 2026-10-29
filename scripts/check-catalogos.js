const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const [eps, programas, departamentos, ciudadesCount, ciudadesSample] = await Promise.all([
    prisma.eps.findMany({ orderBy: { id_eps: "asc" } }),
    prisma.programas_academicos.findMany({ orderBy: { nombre: "asc" } }),
    prisma.departamentos.findMany({ orderBy: { nombre: "asc" } }),
    prisma.ciudades.count(),
    prisma.ciudades.findMany({ take: 8, orderBy: { nombre: "asc" }, select: { nombre: true } }),
  ]);

  console.log("=== EPS (" + eps.length + ") ===");
  eps.forEach((e) => console.log(`  ${e.id_eps}: ${JSON.stringify(e)}`));
  console.log("\n=== PROGRAMAS (" + programas.length + ") ===");
  programas.forEach((p) => console.log(`  ${p.id_programa_academico}: ${p.codigo} | ${p.nombre} | tipo=${p.tipo_poblacion ?? "null"}`));
  console.log("\n=== DEPARTAMENTOS (" + departamentos.length + ") ===");
  departamentos.forEach((d) => console.log(`  ${d.id_departamento}: ${d.nombre}`));
  console.log("\n=== CIUDADES (" + ciudadesCount + ") muestra ===");
  ciudadesSample.forEach((c) => console.log(`  ${c.nombre}`));
}

main().finally(() => prisma.$disconnect());
