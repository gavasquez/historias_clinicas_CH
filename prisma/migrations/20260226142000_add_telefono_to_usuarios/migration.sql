-- Add required column telefono to usuarios.
-- Default '' is used to avoid failing existing rows when adding a NOT NULL column.

ALTER TABLE "usuarios"
ADD COLUMN "telefono" VARCHAR(50) NOT NULL DEFAULT '';
