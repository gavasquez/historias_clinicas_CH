-- Create departamentos and ciudades catalogs and relate pacientes -> ciudades

-- 1) departamentos
CREATE TABLE IF NOT EXISTS "departamentos" (
  "id_departamento" SERIAL PRIMARY KEY,
  "nombre" VARCHAR(100) NOT NULL,
  "codigo_dane" VARCHAR(10)
);

CREATE UNIQUE INDEX IF NOT EXISTS "departamentos_nombre_key" ON "departamentos" ("nombre");
CREATE UNIQUE INDEX IF NOT EXISTS "departamentos_codigo_dane_key" ON "departamentos" ("codigo_dane");

-- 2) ciudades
CREATE TABLE IF NOT EXISTS "ciudades" (
  "id_ciudad" SERIAL PRIMARY KEY,
  "id_departamento" INTEGER NOT NULL,
  "nombre" VARCHAR(120) NOT NULL,
  "codigo_dane" VARCHAR(10)
);

ALTER TABLE "ciudades"
  ADD CONSTRAINT "ciudades_id_departamento_fkey"
  FOREIGN KEY ("id_departamento") REFERENCES "departamentos"("id_departamento")
  ON UPDATE NO ACTION ON DELETE NO ACTION;

CREATE UNIQUE INDEX IF NOT EXISTS "ciudades_codigo_dane_key" ON "ciudades" ("codigo_dane");
CREATE UNIQUE INDEX IF NOT EXISTS "ciudades_id_departamento_nombre_key" ON "ciudades" ("id_departamento", "nombre");
CREATE INDEX IF NOT EXISTS "idx_ciudades_departamento" ON "ciudades" ("id_departamento");

-- 3) pacientes -> ciudades
ALTER TABLE "pacientes"
  ADD COLUMN IF NOT EXISTS "id_ciudad" INTEGER;

ALTER TABLE "pacientes"
  ADD CONSTRAINT "pacientes_id_ciudad_fkey"
  FOREIGN KEY ("id_ciudad") REFERENCES "ciudades"("id_ciudad")
  ON UPDATE NO ACTION ON DELETE NO ACTION;

CREATE INDEX IF NOT EXISTS "idx_pacientes_id_ciudad" ON "pacientes" ("id_ciudad");
