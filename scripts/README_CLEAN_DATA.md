# Scripts de Limpieza de Datos de Prueba

Este directorio contiene scripts para limpiar registros de prueba de citas, atenciones e historias clínicas.

## Opciones Disponibles

### 1. Script SQL - Limpieza Selectiva (ID >= 10000)
**Archivo:** `clean_test_data.sql`

Elimina registros con ID >= 10000 (datos de prueba recientes).

**Ejecutar con:**
```bash
psql -h localhost -p 5433 -U tu_usuario -d historias_clinicas -f scripts/clean_test_data.sql
```

### 2. Script SQL - Limpieza Completa
**Archivo:** `clean_test_data_all.sql`

Elimina TODOS los registros de las tablas relacionadas.

⚠️ **ADVERTENCIA:** Usar solo en entorno de desarrollo/pruebas.

**Ejecutar con:**
```bash
psql -h localhost -p 5433 -U tu_usuario -d historias_clinicas -f scripts/clean_test_data_all.sql
```

### 3. Script TypeScript/Prisma - Limpieza Selectiva
**Archivo:** `cleanTestData.ts`

Elimina registros con ID >= 10000 usando Prisma.

**Ejecutar (modo test - por defecto):**
```bash
npx tsx scripts/cleanTestData.ts
```

**Ejecutar con ID mínimo personalizado:**
```bash
npx tsx scripts/cleanTestData.ts test 15000
```

### 4. Script TypeScript/Prisma - Limpieza Completa
**Archivo:** `cleanTestData.ts` (modo all)

Elimina TODOS los registros usando Prisma.

⚠️ **ADVERTENCIA:** Usar solo en entorno de desarrollo/pruebas.

**Ejecutar:**
```bash
npx tsx scripts/cleanTestData.ts all
```

## Orden de Eliminación

Los scripts eliminan los datos en el siguiente orden para respetar las restricciones de foreign keys:

1. `diagnosticos_atencion` - Diagnósticos de atenciones
2. `hc_antecedentes_atencion` - Antecedentes de atenciones
3. `hc_anamnesis_atencion` - Anamnesis de atenciones
4. `hc_atencion_cierre` - Cierres de atención
5. `atenciones_salud` - Atenciones de salud
6. `historias_clinicas` - Historias clínicas (solo las no vinculadas)
7. `citas` - Citas

## Tablas Afectadas

- `citas`
- `atenciones_salud`
- `historias_clinicas`
- `diagnosticos_atencion`
- `hc_antecedentes_atencion`
- `hc_anamnesis_atencion`
- `hc_atencion_cierre`

## Recomendaciones

- **Para pruebas de desarrollo:** Usar el script SQL selectivo o el script TypeScript en modo test
- **Para limpieza completa:** Usar solo en base de datos de desarrollo/pruebas, nunca en producción
- **Hacer backup:** Siempre hacer backup antes de ejecutar limpieza completa

## Verificación

Los scripts incluyen consultas de verificación al final para mostrar la cantidad de registros restantes en las tablas principales.
