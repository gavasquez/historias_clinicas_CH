const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const programas = await prisma.programas_academicos.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { pacientes: true } } },
  });

  const byNorm = new Map();
  for (const p of programas) {
    const key = `${p.tipo_poblacion}|${norm(p.nombre).replace(/-? *(PITALITO|VIRTUAL|HIBRIDA|PRESENCIAL).*$/i, "")}`;
    if (!byNorm.has(key)) byNorm.set(key, []);
    byNorm.get(key).push(p);
  }

  console.log("=== POSIBLES DUPLICADOS ===");
  for (const [key, list] of byNorm) {
    if (list.length > 1) {
      console.log(`\n${key}`);
      list.forEach((p) =>
        console.log(`   id=${p.id_programa_academico} codigo=${p.codigo} nombre="${p.nombre}" pacientes=${p._count.pacientes}`),
      );
    }
  }
}

main().finally(() => prisma.$disconnect());
