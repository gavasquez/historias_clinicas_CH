-- CreateTable
CREATE TABLE "documentos_exportados" (
    "id_exportacion" SERIAL NOT NULL,
    "id_historia_clinica" INTEGER NOT NULL,
    "id_atencion" INTEGER,
    "id_usuario_exporto" INTEGER NOT NULL,
    "tipo_documento" VARCHAR(80) NOT NULL,
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "ruta" VARCHAR(500),
    "tamano_bytes" BIGINT,
    "fecha_exportacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_exportados_pkey" PRIMARY KEY ("id_exportacion")
);

-- AddForeignKey
ALTER TABLE "documentos_exportados" ADD CONSTRAINT "documentos_exportados_id_historia_clinica_fkey" FOREIGN KEY ("id_historia_clinica") REFERENCES "historias_clinicas"("id_historia") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "documentos_exportados" ADD CONSTRAINT "documentos_exportados_id_usuario_exporto_fkey" FOREIGN KEY ("id_usuario_exporto") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- CreateIndex
CREATE INDEX "idx_documentos_exportados_historia" ON "documentos_exportados"("id_historia_clinica");

-- CreateIndex
CREATE INDEX "idx_documentos_exportados_usuario" ON "documentos_exportados"("id_usuario_exporto");
