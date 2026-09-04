ALTER TABLE "archivos_adjuntos"
ADD COLUMN "tipo_documento" VARCHAR(80),
ADD COLUMN "extension" VARCHAR(10);

CREATE UNIQUE INDEX "uq_adjuntos_entidad_tipo"
ON "archivos_adjuntos"("entidad", "id_entidad", "tipo_documento");
