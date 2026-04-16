-- CreateTable
CREATE TABLE "hc_habitos_atencion" (
    "id_hc_habitos" SERIAL NOT NULL,
    "id_atencion" INTEGER NOT NULL,
    "tabaco_cigarrillo" VARCHAR(255),
    "alcohol" VARCHAR(255),
    "sustancias_psicoactivas" VARCHAR(255),
    "otros" VARCHAR(255),
    "actividad_fisica" VARCHAR(255),
    "alimentacion" VARCHAR(255),
    "otras_actividades" VARCHAR(255),
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hc_habitos_atencion_pkey" PRIMARY KEY ("id_hc_habitos")
);

-- CreateIndex
CREATE UNIQUE INDEX "hc_habitos_atencion_id_atencion_key" ON "hc_habitos_atencion"("id_atencion");

-- CreateIndex
CREATE INDEX "idx_hc_habitos_atencion" ON "hc_habitos_atencion"("id_atencion");

-- AddForeignKey
ALTER TABLE "hc_habitos_atencion" ADD CONSTRAINT "hc_habitos_atencion_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE CASCADE ON UPDATE NO ACTION;
