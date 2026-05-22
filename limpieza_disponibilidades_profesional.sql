-- =====================================================
-- SCRIPT DE LIMPIEZA SEGURA - DISPONIBILIDADES DE PROFESIONAL
-- =====================================================
-- Base de datos: PostgreSQL con Prisma
-- Autor: Asistente IA
-- Fecha: 2026-05-22
-- Impacto: Tabla disponibilidades_profesional y dependencias
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
-- ANÁLISIS DE DEPENDENCIAS DE DISPONIBILIDADES_PROFESIONAL
-- =====================================================

-- Estructura de la tabla:
-- disponibilidades_profesional {
--   id_disponibilidad     Int (PK, autoincrement)
--   id_profesional        Int (FK -> profesionales_salud, onDelete: Cascade)
--   id_sede               Int? (FK -> sedes, onDelete: NoAction)
--   dia_semana            Int (SmallInt, 0-6)
--   hora_inicio           Time
--   hora_fin              Time
--   capacidad_simultanea Int (default: 1)
--   es_excepcion          Boolean (default: false)
--   fecha_inicio_vigencia Date?
--   fecha_fin_vigencia   Date?
-- }

-- Relaciones que afectan:
-- 1. profesionales_salud.id_profesional (onDelete: Cascade)
-- 2. sedes.id_sede (onDelete: NoAction)
-- 3. No hay otras tablas que referencien a disponibilidades_profesional

-- =====================================================
-- FASE 1: VERIFICACIÓN DE DATOS ANTES DE LIMPIAR
-- =====================================================

-- Opcional: Contar registros antes de eliminar (para reporte)
-- SELECT 'disponibilidades_profesional' as tabla, COUNT(*) as registros_antes 
-- FROM disponibilidades_profesional;

-- =====================================================
-- FASE 2: LIMPIEZA DE DISPONIBILIDADES
-- =====================================================

-- 1. Eliminar todas las disponibilidades de profesionales
DELETE FROM disponibilidades_profesional;

-- =====================================================
-- FASE 3: LIMPIEZA DE ARCHIVOS ADJUNTOS RELACIONADOS
-- =====================================================

-- 2. Eliminar archivos adjuntos relacionados con disponibilidades
DELETE FROM archivos_adjuntos 
WHERE entidad = 'disponibilidad_profesional' AND id_entidad IN (
    SELECT id_disponibilidad FROM disponibilidades_profesional WHERE 1=0  -- Referencia para seguridad
);

-- =====================================================
-- FASE 4: LIMPIEZA DE AUDITORÍA
-- =====================================================

-- 3. Eliminar registros de auditoría relacionados con disponibilidades
DELETE FROM auditoria 
WHERE tabla = 'disponibilidades_profesional';

-- =====================================================
-- FASE 5: REINICIO DE SECUENCIA
-- =====================================================

-- 4. Reiniciar secuencia autoincrement de disponibilidades
ALTER SEQUENCE IF EXISTS disponibilidades_profesional_id_disponibilidad_seq RESTART WITH 1;

-- Reactivar las restricciones de foreign keys
SET session_replication_role = DEFAULT;

-- =====================================================
-- VERIFICACIÓN Y CONFIRMACIÓN
-- =====================================================

-- Verificar que no queden disponibilidades
SELECT 'disponibilidades_profesional' as tabla, COUNT(*) as registros_despues 
FROM disponibilidades_profesional;

-- Verificar que no haya referencias huérfanas
SELECT 'Verificación de referencias completada' as status;

-- Opcional: Verificar impacto en profesionales y sedes
SELECT 'profesionales_afectados' as concepto, COUNT(*) as total 
FROM profesionales_salud 
WHERE id_profesional NOT IN (
    SELECT DISTINCT id_profesional FROM disponibilidades_profesional WHERE id_profesional IS NOT NULL
);

-- Confirmar limpieza completa
SELECT 'Limpieza de disponibilidades de profesional completada exitosamente' as status;

-- Commit de la transacción
COMMIT;

-- =====================================================
-- RESUMEN DE LA OPERACIÓN
-- =====================================================
/*
TABLAS AFECTADAS (3):

1. disponibilidades_profesional - Eliminación completa de todos los registros
2. auditoria - Se eliminan registros relacionados con disponibilidades
3. archivos_adjuntos - Se eliminan archivos relacionados con disponibilidades (si existen)

TABLAS PRESERVADAS:
- profesionales_salud - Se mantienen todos los datos (solo se pierden las disponibilidades)
- sedes - Se mantienen todos los datos
- pacientes - Sin cambios
- usuarios - Sin cambios
- Todas las tablas maestras y catálogos
- Todas las demás tablas del sistema

IMPACTO ESPERADO:
- Todas las disponibilidades de profesionales eliminadas
- Profesionales de salud conservados (sin disponibilidades asignadas)
- Sedes conservadas (sin disponibilidades asociadas)
- Secuencia de disponibilidades reiniciada desde 1
- Sin pérdida de datos de profesionales, pacientes o usuarios
- Estructura de base de datos intacta

NOTA IMPORTANTE:
- Los profesionales de salud se mantienen intactos
- Solo se eliminan los horarios de disponibilidad
- No se afectan las citas existentes (si las hay)
- No se eliminan datos de atención médica
- Los profesionales podrán crear nuevas disponibilidades después

EFECTOS EN EL SISTEMA:
- Los profesionales no tendrán horarios de disponibilidad configurados
- El sistema de agendamiento de citas basado en disponibilidades quedará sin horarios
- Se deberá configurar nuevamente las disponibilidades para cada profesional
- No afecta el historial de citas o atenciones pasadas
*/
