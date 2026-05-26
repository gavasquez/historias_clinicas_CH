-- =====================================================
-- SCRIPT PARA AGREGAR SEDE PRADO ALTO
-- =====================================================
-- Base de datos: PostgreSQL con Prisma
-- Autor: Asistente IA
-- Fecha: 2026-05-25
-- Impacto: Tabla sedes
-- =====================================================

-- Iniciar transacción
BEGIN;

-- Insertar sede Prado Alto solo si no existe
INSERT INTO sedes (nombre, ciudad, departamento)
SELECT 'Prado Alto', 'Neiva', 'Huila'
WHERE NOT EXISTS (
  SELECT 1 FROM sedes WHERE nombre = 'Prado Alto'
);

-- Confirmar transacción
COMMIT;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Verificar que la sede fue agregada
SELECT * FROM sedes WHERE nombre = 'Prado Alto';

-- Verificar todas las sedes
SELECT * FROM sedes ORDER BY nombre;
