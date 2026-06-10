-- =====================================================
-- SCRIPT DE LIMPIEZA SEGURA - PACIENTES
-- =====================================================
-- Base de datos: PostgreSQL con Prisma
-- Autor: Asistente IA
-- Fecha: 2026-06-10
-- Impacto: Tabla pacientes y dependencias
-- =====================================================

-- INSTRUCCIONES IMPORTANTES:
-- 1. Ejecutar en una ventana de transacción para poder rollback si es necesario
-- 2. Hacer backup completo de la base de datos antes de ejecutar
-- 3. Verificar que no haya procesos activos usando estas tablas
-- 4. Considerar ejecutar en horario de bajo uso

-- Iniciar transacción para seguridad
BEGIN;

-- Desactivar temporalmente las restricciones de foreign keys
SET session_replication_role = replica;

-- =====================================================
-- ANÁLISIS DE DEPENDENCIAS DE PACIENTES
-- =====================================================

-- Estructura de la tabla:
-- pacientes {
--   id_paciente           Int (PK, autoincrement)
--   id_tipo_documento     Int (FK -> tipos_documento)
--   numero_documento      String (unique)
--   nombres               String
--   apellidos             String
--   fecha_nacimiento      DateTime
--   telefono              String
--   email                 String?
--   id_ciudad             Int? (FK -> ciudades)
--   departamento          String?
--   ciudad                String?
--   id_genero             Int? (FK -> tipos_genero)
--   id_estado_civil       Int? (FK -> tipos_estado_civil)
--   direccion             String?
--   grupo_poblacional     String?
--   grupo_poblacional_otro String?
--   id_tipo_sangre        Int? (FK -> tipos_sangre)
--   id_sede               Int? (FK -> sedes)
--   id_programa_academico Int? (FK -> programas_academicos)
--   id_eps                Int? (FK -> eps)
--   condicion_particular  String?
--   id_tipo_usuario       Int? (FK -> tipos_usuario)
--   contacto_emergencia_nombre String?
--   contacto_emergencia_relacion String?
--   contacto_emergencia_telefono String?
--   contacto_emergencia_direccion String?
--   activo                Boolean (default: true)
--   created_at            DateTime
--   updated_at            DateTime
-- }

-- Relaciones que afectan:
-- 1. citas (onDelete: SetNull) - Las citas perderán referencia al paciente
-- 2. atenciones_salud (onDelete: Cascade) - Las atenciones se eliminarán
-- 3. historias_clinicas (onDelete: Cascade) - Las historias clínicas se eliminarán

-- =====================================================
-- FASE 1: VERIFICACIÓN DE DATOS ANTES DE LIMPIAR
-- =====================================================

-- Contar registros antes de eliminar (para reporte)
SELECT 'pacientes' as tabla, COUNT(*) as registros_antes 
FROM pacientes;

-- =====================================================
-- FASE 2: LIMPIEZA DE PACIENTES Y DEPENDENCIAS
-- =====================================================

-- 1. Eliminar atenciones asociadas a pacientes (CASCADE lo hará automáticamente, pero lo hacemos explícito)
DELETE FROM atenciones_salud;

-- 2. Eliminar historias clínicas asociadas a pacientes (CASCADE lo hará automáticamente, pero lo hacemos explícito)
DELETE FROM historias_clinicas;

-- 3. Establecer NULL en citas que referencian pacientes (onDelete: SetNull)
UPDATE citas 
SET id_paciente = NULL 
WHERE id_paciente IS NOT NULL;

-- 4. Eliminar todos los pacientes
DELETE FROM pacientes;

-- =====================================================
-- FASE 3: VERIFICACIÓN DESPUÉS DE LIMPIAR
-- =====================================================

-- Verificar que no queden pacientes
SELECT 'pacientes' as tabla, COUNT(*) as registros_despues 
FROM pacientes;

-- Verificar que no queden atenciones
SELECT 'atenciones_salud' as tabla, COUNT(*) as registros_despues 
FROM atenciones_salud;

-- Verificar que no queden historias clínicas
SELECT 'historias_clinicas' as tabla, COUNT(*) as registros_despues 
FROM historias_clinicas;

-- Verificar citas con pacientes NULL (esperado)
SELECT 'citas_con_paciente_null' as tabla, COUNT(*) as registros_despues 
FROM citas 
WHERE id_paciente IS NULL;

-- =====================================================
-- FASE 4: CONFIRMACIÓN
-- =====================================================

-- Si todo está correcto, confirmar la transacción
-- COMMIT;

-- Si hay algún problema, deshacer la transacción
-- ROLLBACK;

-- =====================================================
-- NOTA IMPORTANTE:
-- =====================================================
-- Por seguridad, este script NO ejecuta COMMIT automáticamente.
-- Debes verificar los resultados y ejecutar COMMIT manualmente
-- si estás satisfecho con los resultados.
-- 
-- Para confirmar los cambios, ejecuta:
-- COMMIT;
--
-- Para deshacer los cambios, ejecuta:
-- ROLLBACK;
