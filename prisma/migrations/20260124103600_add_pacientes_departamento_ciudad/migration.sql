-- Add departamento and ciudad to pacientes
ALTER TABLE "pacientes"
  ADD COLUMN IF NOT EXISTS "departamento" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "ciudad" VARCHAR(100);
