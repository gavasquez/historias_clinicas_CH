const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const u = await prisma.usuarios.findFirst({
    where: { username: "medico1" },
    select: {
      id_usuario: true, username: true, nombre_completo: true,
      roles: { select: { nombre: true } },
      profesionales_salud: { select: { id_profesional: true } },
    },
  });
  console.log(JSON.stringify(u, null, 1));
}
main().finally(() => prisma.$disconnect());
