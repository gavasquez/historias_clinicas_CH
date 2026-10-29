// Convierte el xlsx a CSV compatible: fechas YYYY-MM-DD, UTF-8, separador ;
const XLSX = require("xlsx");
const fs = require("fs");

const wb = XLSX.readFile("C:\\Users\\CORHUILA\\Desktop\\data_estudiantes_20262.xlsx");
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true });

function excelDate(n) {
  if (typeof n !== "number" || !isFinite(n)) return null;
  // serial Excel -> UTC
  const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

const out = ["tipo_documento;numero_documento;nombres;apellidos;fecha_nacimiento;telefono;email;tipo_usuario;sede;programa_academico"];
let bad = 0;
for (const r of rows.slice(1)) {
  if (!r[1]) continue;
  const [tipo, doc, nom, ape, f, tel, email, tusu, sede, prog] = r;
  const fecha = f instanceof Date && !isNaN(f)
    ? f.toISOString().slice(0, 10)
    : excelDate(typeof f === "number" ? f : Number(f)) || String(f).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) bad++;
  const esc = (v) => String(v ?? "").trim().replace(/;/g, ",");
  out.push([tipo, doc, nom, ape, fecha, tel, email, tusu, sede, prog].map(esc).join(";"));
}

fs.writeFileSync("C:\\Users\\CORHUILA\\Downloads\\cargue_estudiantes_fixed.csv", "﻿" + out.join("\r\n"), "utf8");
console.log(`Filas escritas: ${out.length - 1} | fechas no convertidas: ${bad}`);
console.log(out[1]);
console.log(out[2]);
