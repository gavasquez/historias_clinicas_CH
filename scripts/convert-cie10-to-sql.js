const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../prisma/sql/cie10_data.csv');
const sqlPath = path.join(__dirname, '../prisma/sql/load_cie10.sql');

// Leer el archivo CSV
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

// Extraer encabezado
const header = lines[0].split(';');
const dataLines = lines.slice(1);

// Generar SQL
let sql = `-- =====================================================
-- SCRIPT PARA CARGAR DATOS CIE-10 CON INSERTs EN LOTES
-- =====================================================
-- Base de datos: PostgreSQL con Prisma
-- Autor: Asistente IA
-- Fecha: 2026-05-25
-- Impacto: Tabla cie10
-- =====================================================
-- NOTA: Este script funciona con Prisma:
-- Comando: npx prisma db execute --file prisma/sql/load_cie10.sql
-- =====================================================

-- Iniciar transacción
BEGIN;

-- Limpiar datos existentes antes de cargar nuevos datos
TRUNCATE TABLE cie10 RESTART IDENTITY CASCADE;

`;

// Procesar en lotes de 500 registros
const batchSize = 500;
for (let i = 0; i < dataLines.length; i += batchSize) {
  const batch = dataLines.slice(i, i + batchSize);
  
  sql += `-- Lote ${Math.floor(i / batchSize) + 1} (registros ${i + 1}-${Math.min(i + batchSize, dataLines.length)})\n`;
  sql += `INSERT INTO cie10 (codigo, nombre, descripcion, activo) VALUES\n`;
  
  const values = batch.map(line => {
    const cols = line.split(';');
    const codigo = cols[0].replace(/'/g, "''");
    const nombre = cols[1].replace(/'/g, "''");
    const descripcion = cols[2].replace(/'/g, "''");
    const activo = cols[3].trim() === 'true';
    return `('${codigo}', '${nombre}', '${descripcion}', ${activo})`;
  });
  
  sql += values.join(',\n');
  sql += ';\n\n';
}

sql += `-- Confirmar transacción
COMMIT;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Contar registros cargados
SELECT COUNT(*) as total_registros FROM cie10;

-- Mostrar primeros 10 registros
SELECT * FROM cie10 ORDER BY codigo LIMIT 10;

-- Verificar si hay códigos duplicados
SELECT codigo, COUNT(*) as conteo
FROM cie10
GROUP BY codigo
HAVING COUNT(*) > 1;
`;

// Escribir el archivo SQL
fs.writeFileSync(sqlPath, sql, 'utf-8');

console.log(`✅ Script SQL generado exitosamente`);
console.log(`📊 Total de registros procesados: ${dataLines.length}`);
console.log(`📁 Archivo SQL guardado en: ${sqlPath}`);
