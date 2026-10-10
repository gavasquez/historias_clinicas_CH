CREATE UNIQUE INDEX "uq_atenciones_salud_id_cita"
ON "atenciones_salud"("id_cita")
WHERE "id_cita" IS NOT NULL;
