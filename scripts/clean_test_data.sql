-- Script para limpiar registros de prueba de citas, atenciones e historias clínicas
-- Ejecutar en orden para respetar las restricciones de foreign keys
-- Base de datos: historias_clinicas
-- NOTA: Ejecutar cada sentencia individualmente para identificar errores

-- 1. Eliminar diagnósticos de atenciones (hijos de atenciones_salud)
DELETE FROM diagnosticos_atencion
WHERE id_atencion IN (
    SELECT id_atencion FROM atenciones_salud
    WHERE id_cita IN (
        SELECT id_cita FROM citas WHERE id_cita >= 10000
    )
);

-- 2. Eliminar antecedentes de atenciones (hijos de atenciones_salud)
DELETE FROM hc_antecedentes_atencion
WHERE id_atencion IN (
    SELECT id_atencion FROM atenciones_salud
    WHERE id_cita IN (
        SELECT id_cita FROM citas WHERE id_cita >= 10000
    )
);

-- 3. Eliminar anamnesis de atenciones (hijos de atenciones_salud)
DELETE FROM hc_anamnesis_atencion
WHERE id_atencion IN (
    SELECT id_atencion FROM atenciones_salud
    WHERE id_cita IN (
        SELECT id_cita FROM citas WHERE id_cita >= 10000
    )
);

-- 4. Eliminar cierre de atención (hijos de atenciones_salud)
DELETE FROM hc_atencion_cierre
WHERE id_atencion IN (
    SELECT id_atencion FROM atenciones_salud
    WHERE id_cita IN (
        SELECT id_cita FROM citas WHERE id_cita >= 10000
    )
);

-- 5. Eliminar atenciones de salud (hijos de citas)
DELETE FROM atenciones_salud
WHERE id_cita IN (
    SELECT id_cita FROM citas WHERE id_cita >= 10000
);

-- 6. Eliminar historias clínicas creadas desde citas (opcional, si quieres limpiar también)
-- NOTA: Solo eliminar historias que no estén vinculadas a otras historias en seguimiento
DELETE FROM historias_clinicas
WHERE id_historia IN (
    SELECT id_historia FROM historias_clinicas
    WHERE id_historia >= 10000
    AND id_historia NOT IN (
        SELECT DISTINCT id_historia_vinculada
        FROM historias_clinicas
        WHERE id_historia_vinculada IS NOT NULL
    )
);

-- 7. Eliminar citas (tabla principal)
DELETE FROM citas
WHERE id_cita >= 10000;

-- Verificación: mostrar cantidad de registros eliminados
SELECT 'Registros eliminados exitosamente' AS mensaje;
SELECT COUNT(*) AS citas_restantes FROM citas;
SELECT COUNT(*) AS atenciones_restantes FROM atenciones_salud;
SELECT COUNT(*) AS historias_restantes FROM historias_clinicas;
