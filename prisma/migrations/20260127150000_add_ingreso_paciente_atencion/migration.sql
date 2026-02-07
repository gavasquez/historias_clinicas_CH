-- Add ingreso del paciente fields to atenciones_salud
ALTER TABLE "atenciones_salud"
  ADD COLUMN "llega_por_sus_medios" BOOLEAN,
  ADD COLUMN "llega_por_sus_medios_cual" VARCHAR(120),
  ADD COLUMN "estado_a_la_llegada" VARCHAR(20),
  ADD COLUMN "caso_accidente_intoxicacion_violencia" BOOLEAN,
  ADD COLUMN "fecha_ocurrencia_evento" DATE,
  ADD COLUMN "lugar_ocurrencia_evento" VARCHAR(150),
  ADD COLUMN "notificacion_policia" BOOLEAN,
  ADD COLUMN "notificacion_cti" BOOLEAN,
  ADD COLUMN "notificacion_acudiente" BOOLEAN,
  ADD COLUMN "notificacion_otro" BOOLEAN,
  ADD COLUMN "notificacion_otro_cual" VARCHAR(120);
