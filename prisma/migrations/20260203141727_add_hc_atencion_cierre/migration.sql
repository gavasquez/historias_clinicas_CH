-- CreateTable
CREATE TABLE "hc_atencion_cierre" (
    "id_hc_atencion_cierre" SERIAL NOT NULL,
    "id_atencion" INTEGER NOT NULL,
    "recomendaciones" TEXT,
    "certificado_opcion" VARCHAR(50),
    "certificado_restricciones" TEXT,
    "certificado_recomendaciones" TEXT,
    "seguimiento_opcion" VARCHAR(50),
    "seguimiento_fecha" DATE,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hc_atencion_cierre_pkey" PRIMARY KEY ("id_hc_atencion_cierre")
);

-- CreateIndex
CREATE UNIQUE INDEX "hc_atencion_cierre_id_atencion_key" ON "hc_atencion_cierre"("id_atencion");

-- CreateIndex
CREATE INDEX "idx_hc_atencion_cierre" ON "hc_atencion_cierre"("id_atencion");

-- AddForeignKey
ALTER TABLE "hc_atencion_cierre" ADD CONSTRAINT "hc_atencion_cierre_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE CASCADE ON UPDATE NO ACTION;
