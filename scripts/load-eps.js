/**
 * Carga el listado de EPS habilitadas en Colombia (referencia ADRES).
 * Idempotente: no duplica registros existentes (coincidencia por nombre).
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const EPS_LIST = [
  // Régimen contributivo y EPS grandes
  "Nueva EPS",
  "Sanitas EPS",
  "Sura EPS",
  "Compensar EPS",
  "Famisanar EPS",
  "Salud Mía EPS",
  "SOS EPS",
  "Coosalud EPS",
  "Mutual Ser EPS",
  "Asmet Salud EPS",
  "Emssanar EPS",
  "Capital Salud EPS",
  "Emdisalud EPS",
  "Ecoopsos EPS",
  "AIC EPS",
  "Coomeva EPS",
  // EPS familiares / cajas de compensación
  "Comfamiliar Huila EPS",
  "Comfenalco Valle EPS",
  "Comfenalco Tolima EPS",
  "Comfenalco Quindío EPS",
  "Comfacauca EPS",
  "Comfachocó EPS",
  "Comfaoriente EPS",
  "Comfasucre EPS",
  "Comfandi EPS",
  "Comfamiliar Cartagena EPS",
  "Cajacopi EPS",
  "Cosmitet EPS",
  "Ambuq EPS",
  "Capresoca EPS",
  "Sabia Salud EPS",
  // EPS indígenas / subsidiado
  "Anas Wayuu EPSI",
  "Mallamas EPSI",
  "Dusakawi EPSI",
  "Pijaos Salud EPSI",
  "Saludvida EPS",
  // Régimen especial / exceptuado
  "EPS Fuerzas Militares",
  "EPS Policía Nacional",
  "EPS Universitaria",
];

async function main() {
  let created = 0;
  let existing = 0;
  for (const nombre of EPS_LIST) {
    const found = await prisma.eps.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" } },
    });
    if (found) {
      existing++;
      continue;
    }
    await prisma.eps.create({ data: { nombre } });
    created++;
  }
  const total = await prisma.eps.count();
  console.log(`EPS creadas: ${created} | ya existían: ${existing} | total en BD: ${total}`);
}

main().finally(() => prisma.$disconnect());
