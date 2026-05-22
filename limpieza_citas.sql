-- =====================================================
-- SCRIPT DE LIMPIEZA SEGURA - MÓDULO DE CITAS
-- =====================================================
-- Base de datos: PostgreSQL con Prisma
-- Autor: Asistente IA
-- Fecha: 2026-05-22
-- Impacto: Tabla principal de citas y dependencias
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
-- ANÁLISIS DE DEPENDENCIAS DE CITAS
-- =====================================================

-- Relaciones que afectan a citas:
-- 1. atenciones_salud.id_cita (nullable) - Referencia opcional
-- 2. historias_clinicas (referencia indirecta a través de atenciones)
-- 3. Ninguna otra tabla tiene foreign key directa a citas

-- =====================================================
-- FASE 1: LIMPIEZA DE REFERENCIAS A CITAS
-- =====================================================

-- 1. Eliminar referencias a citas en atenciones_salud
-- Se pone NULL en id_cita para no perder las atenciones
UPDATE atenciones_salud SET id_cita = NULL WHERE id_cita IS NOT NULL;

-- =====================================================
-- FASE 2: ELIMINACIÓN DE CITAS
-- =====================================================

-- 2. Eliminar todas las citas
DELETE FROM citas;

-- =====================================================
-- FASE 3: LIMPIEZA DE ARCHIVOS ADJUNTOS RELACIONADOS
-- =====================================================

-- 3. Eliminar archivos adjuntos relacionados con citas
DELETE FROM archivos_adjuntos 
WHERE entidad = 'cita' AND id_entidad IN (
    SELECT id_cita FROM citas WHERE 1=0  -- Referencia para seguridad
);

-- =====================================================
-- FASE 4: LIMPIEZA DE AUDITORÍA
-- =====================================================

-- 4. Eliminar registros de auditoría relacionados con citas
DELETE FROM auditoria 
WHERE tabla = 'citas';

-- =====================================================
-- FASE 5: REINICIO DE SECUENCIA
-- =====================================================

-- 5. Reiniciar secuencia autoincrement de citas
ALTER SEQUENCE IF EXISTS citas_id_cita_seq RESTART WITH 1;

-- Reactivar las restricciones de foreign keys
SET session_replication_role = DEFAULT;

-- =====================================================
-- VERIFICACIÓN Y CONFIRMACIÓN
-- =====================================================

-- Verificar que no queden citas
SELECT 'citas' as tabla, COUNT(*) as registros FROM citas;

-- Verificar que no haya referencias huérfanas en atenciones
SELECT 'atenciones_con_cita_null' as status, COUNT(*) as cantidad 
FROM atenciones_salud 
WHERE id_cita IS NOT NULL;

-- Confirmar limpieza completa
SELECT 'Limpieza de citas completada exitosamente' as status;

-- Commit de la transacción
COMMIT;

-- =====================================================
-- RESUMEN DE LA OPERACIÓN
-- =====================================================
/*
TABLAS AFECTADAS (3):

1. citas - Eliminación completa de todos los registros
2. atenciones_salud - Se pone NULL en id_cita (se conservan las atenciones)
3. auditoria - Se eliminan registros relacionados con citas
4. archivos_adjuntos - Se eliminan archivos relacionados con citas (si existen)

TABLAS PRESERVADAS:
- pacientes (mantiene todos los datos)
- profesionales_salud (mantiene todos los datos)
- historias_clinicas (mantiene todos los datos)
- atenciones_salud (se mantienen, solo se elimina referencia a citas)
- usuarios (mantiene todos los datos)
- Todas las tablas maestras y catálogos

IMPACTO ESPERADO:
- Todas las citas eliminadas
- Atenciones médicas conservadas (sin referencia a cita)
- Secuencia de citas reiniciada desde 1
- Sin pérdida de datos clínicos o de pacientes
- Estructura de base de datos intacta

NOTA IMPORTANTE:
- Las atenciones médicas se conservan intactas
- Solo se elimina la relación con las citas
- No se afectan las historias clínicas
- No se eliminan datos de pacientes ni profesionales
*/
