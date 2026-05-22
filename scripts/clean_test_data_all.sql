-- Script para limpiar TODOS los registros de citas, atenciones e historias clínicas
-- ADVERTENCIA: Este script elimina TODOS los datos, no solo de prueba
-- Usar solo en entorno de desarrollo/pruebas

BEGIN;

-- 1. Eliminar todos los diagnósticos de atenciones
DELETE FROM diagnosticos_atencion;

-- 2. Eliminar todos los antecedentes de atenciones
DELETE FROM hc_antecedentes_atencion;

-- 3. Eliminar todos los anamnesis de atenciones
DELETE FROM hc_anamnesis_atencion;

-- 4. Eliminar todos los cierres de atención
DELETE FROM hc_atencion_cierre;

-- 5. Eliminar todas las atenciones de salud
DELETE FROM atenciones_salud;

-- 6. Eliminar todas las historias clínicas
DELETE FROM historias_clinicas;

-- 7. Eliminar todas las citas
DELETE FROM citas;

COMMIT;

-- Verificación: mostrar cantidad de registros después de limpieza
SELECT 'LIMPIEZA COMPLETA REALIZADA' AS mensaje;
SELECT COUNT(*) AS citas_restantes FROM citas;
SELECT COUNT(*) AS atenciones_restantes FROM atenciones_salud;
SELECT COUNT(*) AS historias_restantes FROM historias_clinicas;
