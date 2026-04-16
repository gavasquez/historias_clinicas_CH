-- Remove telefono_contacto from profesionales_salud.

ALTER TABLE "profesionales_salud"
DROP COLUMN IF EXISTS "telefono_contacto";
