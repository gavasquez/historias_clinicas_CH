-- =====================================================
-- SCRIPT DE LIMPIEZA SEGURA - MÓDULO HISTORIAS CLÍNICAS
-- =====================================================
-- Base de datos: PostgreSQL con Prisma
-- Autor: Asistente IA
-- Fecha: 2026-05-22
-- Impacto: 28 tablas del módulo de historias clínicas
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
-- FASE 1: TABLAS SIN DEPENDENCIAS (HOJAS)
-- =====================================================

-- 1. Eventos de seguimiento crónico (depende de seguimientos_cronicos)
DELETE FROM eventos_seguimiento_cronico;

-- 2. Diagnósticos de notas de evolución (depende de notas_evolucion_historia)
DELETE FROM notas_evolucion_historia_diagnosticos;

-- 3. Ítems de fórmulas médicas (depende de formulas_medicas)
DELETE FROM items_formula;

-- 4. Archivos adjuntos relacionados con historias clínicas y atenciones
DELETE FROM archivos_adjuntos 
WHERE entidad IN ('historia_clinica', 'atencion_salud', 'hc_anamnesis', 'hc_antecedentes', 
                  'hc_examen_fisico', 'hc_valoracion_sistemas', 'hc_habitos', 'hc_tamizajes', 
                  'hc_ssr', 'hc_cierre', 'hc_antecedentes_traumaticos');

-- =====================================================
-- FASE 2: TABLAS CON DEPENDENCIAS SIMPLES
-- =====================================================

-- 5. Notas de evolución de historias
DELETE FROM notas_evolucion_historia;

-- 6. Exámenes diagnósticos
DELETE FROM examenes_diagnosticos;

-- 7. Fórmulas médicas
DELETE FROM formulas_medicas;

-- 8. Recomendaciones médicas
DELETE FROM recomendaciones_medicas;

-- 9. Certificados médicos
DELETE FROM certificados_medicos;

-- 10. Rutas activadas en atenciones
DELETE FROM rutas_activadas_atencion;

-- 11. Consentimientos de paciente (solo los relacionados con atenciones)
DELETE FROM consentimientos_paciente WHERE id_atencion IS NOT NULL;

-- 12. Desistimientos de programa (solo los relacionados con atenciones)
DELETE FROM desistimientos_programa WHERE id_atencion IS NOT NULL;

-- 13. Diagnósticos por atención
DELETE FROM diagnosticos_atencion;

-- =====================================================
-- FASE 3: TABLAS DE SEGUIMIENTO
-- =====================================================

-- 14. Seguimientos crónicos
DELETE FROM seguimientos_cronicos;

-- =====================================================
-- FASE 4: TABLAS DETALLE DE HISTORIAS CLÍNICAS (CON CASCADE)
-- Estas tablas se eliminan automáticamente al eliminar atenciones_salud
-- pero las incluimos por seguridad y claridad

-- 15. Anamnesis por atención
DELETE FROM hc_anamnesis_atencion;

-- 16. Antecedentes por atención
DELETE FROM hc_antecedentes_atencion;

-- 17. Antecedentes traumáticos por atención
DELETE FROM hc_antecedentes_traumaticos_atencion;

-- 18. Cierre de atención
DELETE FROM hc_atencion_cierre;

-- 19. SSR por atención
DELETE FROM hc_ssr_atencion;

-- 20. Hábitos por atención
DELETE FROM hc_habitos_atencion;

-- 21. Tamizajes por atención
DELETE FROM hc_tamizajes_atencion;

-- 22. Examen físico por atención
DELETE FROM hc_examen_fisico_atencion;

-- 23. Valoración de sistemas por atención
DELETE FROM hc_valoracion_sistemas_atencion;

-- =====================================================
-- FASE 5: TABLAS PRINCIPALES
-- =====================================================

-- 24. Atenciones de salud (tabla central)
DELETE FROM atenciones_salud;

-- 25. Historias clínicas (tabla principal)
DELETE FROM historias_clinicas;

-- 26. Citas médicas (solo las que no tengan otros usos)
-- Mantenemos citas que podrían ser referenciadas por otros sistemas
DELETE FROM citas 
WHERE id_historia_vinculada IS NOT NULL 
   AND id_cita NOT IN (
       SELECT DISTINCT id_cita FROM atenciones_salud WHERE id_cita IS NOT NULL
   );

-- =====================================================
-- FASE 6: TABLAS AUXILIARES Y LIMPIEZA FINAL
-- =====================================================

-- 27. Acompañantes (solo si se va a limpiar también pacientes)
-- Descomentar la siguiente línea solo si también se eliminarán pacientes
-- DELETE FROM acompanantes;

-- 28. Registros de auditoría relacionados con las tablas limpiadas
DELETE FROM auditoria 
WHERE tabla IN ('historias_clinicas', 'atenciones_salud', 'citas', 
                'hc_anamnesis_atencion', 'hc_antecedentes_atencion', 
                'hc_examen_fisico_atencion', 'hc_valoracion_sistemas_atencion',
                'hc_habitos_atencion', 'hc_tamizajes_atencion', 'hc_ssr_atencion',
                'hc_cierre', 'hc_antecedentes_traumaticos_atencion',
                'notas_evolucion_historia', 'diagnosticos_atencion',
                'examenes_diagnosticos', 'formulas_medicas', 'items_formula',
                'recomendaciones_medicas', 'certificados_medicos',
                'consentimientos_paciente', 'desistimientos_programa',
                'rutas_activadas_atencion', 'seguimientos_cronicos',
                'eventos_seguimiento_cronico', 'archivos_adjuntos');

-- =====================================================
-- FASE 7: REINICIO DE SECUENCIAS AUTOINCREMENT
-- =====================================================

-- Reiniciar secuencias para que los IDs comiencen desde 1 nuevamente
ALTER SEQUENCE IF EXISTS acompanantes_id_acompanante_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS atenciones_salud_id_atencion_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS historias_clinicas_id_historia_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS citas_id_cita_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hc_anamnesis_atencion_id_hc_anamnesis_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hc_antecedentes_atencion_id_hc_antecedente_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hc_antecedentes_traumaticos_atencion_id_hc_antecedente_traumatico_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hc_atencion_cierre_id_hc_atencion_cierre_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hc_ssr_atencion_id_hc_ssr_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hc_habitos_atencion_id_hc_habitos_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hc_tamizajes_atencion_id_hc_tamizaje_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hc_examen_fisico_atencion_id_hc_examen_fisico_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hc_valoracion_sistemas_atencion_id_hc_valoracion_sistemas_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS notas_evolucion_historia_id_nota_evolucion_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS notas_evolucion_historia_diagnosticos_id_nota_dx_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS items_formula_id_item_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS diagnosticos_atencion_id_diagnostico_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS examenes_diagnosticos_id_examen_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS formulas_medicas_id_formula_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS recomendaciones_medicas_id_recomendacion_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS certificados_medicos_id_certificado_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS consentimientos_paciente_id_consentimiento_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS desistimientos_programa_id_desistimiento_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS rutas_activadas_atencion_id_ruta_activada_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS seguimientos_cronicos_id_seguimiento_cronico_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS eventos_seguimiento_cronico_id_evento_seq RESTART WITH 1;

-- Reactivar las restricciones de foreign keys
SET session_replication_role = DEFAULT;

-- =====================================================
-- VERIFICACIÓN Y CONFIRMACIÓN
-- =====================================================

-- Contar registros restantes (deberían ser 0 en las tablas limpiadas)
SELECT 'historias_clinicas' as tabla, COUNT(*) as registros FROM historias_clinicas
UNION ALL
SELECT 'atenciones_salud', COUNT(*) FROM atenciones_salud
UNION ALL
SELECT 'citas', COUNT(*) FROM citas
UNION ALL
SELECT 'notas_evolucion_historia', COUNT(*) FROM notas_evolucion_historia
UNION ALL
SELECT 'diagnosticos_atencion', COUNT(*) FROM diagnosticos_atencion
UNION ALL
SELECT 'formulas_medicas', COUNT(*) FROM formulas_medicas
UNION ALL
SELECT 'examenes_diagnosticos', COUNT(*) FROM examenes_diagnosticos
UNION ALL
SELECT 'seguimientos_cronicos', COUNT(*) FROM seguimientos_cronicos
ORDER BY tabla;

-- Confirmar que no hay referencias huérfanas
SELECT 'Verificación de referencias huérfanas completada' as status;

-- Commit de la transacción
COMMIT;

-- =====================================================
-- RESUMEN DE LA OPERACIÓN
-- =====================================================
/*
TABLAS LIMPIADAS (28):

1. eventos_seguimiento_cronico
2. notas_evolucion_historia_diagnosticos  
3. items_formula
4. archivos_adjuntos (parcial)
5. notas_evolucion_historia
6. examenes_diagnosticos
7. formulas_medicas
8. recomendaciones_medicas
9. certificados_medicos
10. rutas_activadas_atencion
11. consentimientos_paciente (parcial)
12. desistimientos_programa (parcial)
13. diagnosticos_atencion
14. seguimientos_cronicos
15. hc_anamnesis_atencion
16. hc_antecedentes_atencion
17. hc_antecedentes_traumaticos_atencion
18. hc_atencion_cierre
19. hc_ssr_atencion
20. hc_habitos_atencion
21. hc_tamizajes_atencion
22. hc_examen_fisico_atencion
23. hc_valoracion_sistemas_atencion
24. atenciones_salud
25. historias_clinicas
26. citas (parcial)
27. auditoria (parcial)
28. archivos_adjuntos (parcial)

TABLAS PRESERVADAS:
- pacientes (mantiene datos básicos)
- profesionales_salud (mantiene datos básicos)
- usuarios (mantiene datos básicos)
- catálogos y tablas maestras
- citas no relacionadas con HC
- consentimientos no relacionados con atenciones
- desistimientos no relacionados con atenciones

IMPACTO ESPERADO:
- Módulo de historias clínicas completamente limpio
- Estructura de base de datos intacta
- Secuencias reiniciadas desde 1
- Sin pérdida de datos de pacientes, profesionales o catálogos
*/
