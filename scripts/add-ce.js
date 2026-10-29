const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const existe = await prisma.tipos_documento.findFirst({ where: { codigo: "CE" } });
  if (existe) {
    console.log("CE ya existe:", JSON.stringify(existe));
    return;
  }
  const created = await prisma.tipos_documento.create({
    data: { codigo: "CE", descripcion: "Cédula de extranjería" },
  });
  console.log("CE creado:", JSON.stringify(created));
}
main().finally(() => prisma.$disconnect());
