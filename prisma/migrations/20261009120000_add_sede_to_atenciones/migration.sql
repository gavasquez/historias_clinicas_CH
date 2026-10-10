ALTER TABLE "atenciones_salud" ADD COLUMN "id_sede" INTEGER;

UPDATE "atenciones_salud" AS a
SET "id_sede" = c."id_sede"
FROM "citas" AS c
WHERE a."id_cita" = c."id_cita"
  AND a."id_sede" IS NULL;

ALTER TABLE "atenciones_salud"
ADD CONSTRAINT "atenciones_salud_id_sede_fkey"
FOREIGN KEY ("id_sede") REFERENCES "sedes"("id_sede")
ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE INDEX "idx_atenciones_salud_sede" ON "atenciones_salud"("id_sede");
