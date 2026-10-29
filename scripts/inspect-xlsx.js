const XLSX = require("xlsx");

const wb = XLSX.readFile("C:\\Users\\CORHUILA\\Desktop\\data_estudiantes_20262.xlsx");
console.log("Hojas:", wb.SheetNames.join(", "));
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
console.log("Filas totales:", rows.length);
console.log("Encabezados:", JSON.stringify(rows[0]));
console.log("\nMuestra (3 filas):");
rows.slice(1, 4).forEach((r, i) => console.log(`  fila${i + 2}:`, JSON.stringify(r)));

// columnas vacías
const headers = rows[0] || [];
const emptyCols = headers.map((h, i) => [i, h]).filter(([, h]) => !h);
if (emptyCols.length) console.log("\nColumnas sin encabezado en índices:", emptyCols.map(([i]) => i).join(","));
