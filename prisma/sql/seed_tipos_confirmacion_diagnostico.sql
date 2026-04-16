-- Inserta/actualiza los tipos de confirmación de diagnóstico.
-- Idempotente: si ya existen, solo actualiza la descripción.

INSERT INTO tipos_confirmacion_diagnostico (codigo, descripcion)
VALUES
  ('CN', 'Confirmado Nuevo'),
  ('CR', 'Confirmado Repetido'),
  ('ID', 'Impresión Diagnóstica')
ON CONFLICT (codigo)
DO UPDATE SET descripcion = EXCLUDED.descripcion;
