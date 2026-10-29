const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.tipos_usuario.findMany({ select: { codigo: true, descripcion: true } });
  console.log(JSON.stringify(t));
  const docs = await prisma.tipos_documento.findMany({ select: { codigo: true } });
  console.log(JSON.stringify(docs));
}
main().finally(() => prisma.$disconnect());
