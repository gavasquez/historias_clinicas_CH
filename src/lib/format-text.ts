/**
 * Convierte texto a formato "Mayúscula Inicial" por palabra.
 * Solo transforma palabras completamente en mayúsculas, preservando
 * tokens mixtos como "CTel", "IoT" o "Virtual", y siglas conocidas.
 */
const ACRONYMS = new Set([
  "D.C.",
  "ORI",
  "SIG",
  "TIC",
  "CTIC",
  "DAVA",
  "EPS",
  "EPSI",
  "SOS",
  "AIC",
  "SISBEN",
  "RIPS",
  "CIE",
  "UPC",
  "ITS",
  "SSR",
  "ESE",
  "NIIF",
  "UCI",
  "UTI",
  "CTEL",
  "IOT",
]);

export function toTitleCase(value: string | null | undefined): string {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text
    .split(/\s+/)
    .map((word) => {
      const hasLower = /[a-záéíóúñü]/.test(word);
      if (hasLower) return word;
      const upper = word.toUpperCase();
      if (word.includes(".") || ACRONYMS.has(upper.replace(/[()-]/g, ""))) {
        return word;
      }
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
