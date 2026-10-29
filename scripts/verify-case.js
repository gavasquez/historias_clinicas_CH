const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const deps = await prisma.departamentos.findMany({ orderBy: { nombre: "asc" }, take: 8, select: { nombre: true } });
  const bogota = await prisma.departamentos.findFirst({ where: { nombre: { contains: "Bogot" } } });
  console.log("DEPARTAMENTOS:", deps.map((d) => d.nombre).join(" | "));
  console.log("Bogotá:", bogota?.nombre);

  const ciudades = await prisma.ciudades.findMany({
    where: { OR: [{ nombre: { contains: "Jos" } }, { nombre: { contains: "Andr" } }] },
    take: 6,
    select: { nombre: true },
  });
  console.log("CIUDADES:", ciudades.map((c) => c.nombre).join(" | "));

  const programas = await prisma.programas_academicos.findMany({
    where: { nombre: { contains: "CTel" } },
    select: { nombre: true },
  });
  const programas2 = await prisma.programas_academicos.findMany({
    where: { nombre: { contains: "Dava" } },
    select: { nombre: true },
  });
  const progSample = await prisma.programas_academicos.findMany({ take: 5, select: { nombre: true } });
  console.log("PROGRAMAS CTel/DAVA:", JSON.stringify([...programas, ...programas2]));
  console.log("PROGRAMAS muestra:", progSample.map((p) => p.nombre).join(" | "));
}

main().finally(() => prisma.$disconnect());
