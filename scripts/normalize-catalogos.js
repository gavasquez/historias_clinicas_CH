/**
 * Normaliza a "Mayúscula Inicial" los catálogos en la base de datos:
 * departamentos, ciudades, programas_academicos, eps y sedes.
 * Idempotente: solo actualiza filas cuyo valor cambia.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ACRONYMS = new Set([
  "D.C.", "ORI", "SIG", "TIC", "CTIC", "DAVA", "EPS", "EPSI", "SOS",
  "AIC", "SISBEN", "RIPS", "CIE", "UPC", "ITS", "SSR", "ESE", "NIIF",
  "UCI", "UTI", "CTEL", "IOT",
]);

function toTitleCase(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text
    .split(/\s+/)
    .map((word) => {
      if (/[a-záéíóúñü]/.test(word)) return word;
      const upper = word.toUpperCase();
      if (word.includes(".") || ACRONYMS.has(upper.replace(/[()-]/g, ""))) return word;
      return word
        .toLowerCase()
        .split(/([-/()])/)
        .map((part) =>
          /^[a-záéíóúñü0-9]/i.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part,
        )
        .join("");
    })
    .join(" ");
}

async function normalize(model, pkField) {
  const rows = await prisma[model].findMany();
  let updated = 0;
  for (const row of rows) {
    const normalized = toTitleCase(row.nombre);
    if (normalized && normalized !== row.nombre) {
      await prisma[model].update({
        where: { [pkField]: row[pkField] },
        data: { nombre: normalized },
      });
      updated++;
    }
  }
  console.log(`${model}: ${updated} actualizados de ${rows.length}`);
}

async function main() {
  await normalize("departamentos", "id_departamento");
  await normalize("ciudades", "id_ciudad");
  await normalize("programas_academicos", "id_programa_academico");
  await normalize("eps", "id_eps");
  await normalize("sedes", "id_sede");
}

main().finally(() => prisma.$disconnect());
