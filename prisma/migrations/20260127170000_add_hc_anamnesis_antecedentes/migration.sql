-- CreateTable
CREATE TABLE "hc_anamnesis_atencion" (
    "id_hc_anamnesis" SERIAL NOT NULL,
    "id_atencion" INTEGER NOT NULL,
    "motivo_consulta" TEXT,
    "enfermedad_actual" TEXT,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hc_anamnesis_atencion_pkey" PRIMARY KEY ("id_hc_anamnesis")
);

-- CreateTable
CREATE TABLE "hc_antecedentes_atencion" (
    "id_hc_antecedente" SERIAL NOT NULL,
    "id_atencion" INTEGER NOT NULL,
    "diagnostico" VARCHAR(255),
    "tipo_antecedente" VARCHAR(50),
    "observacion" TEXT,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hc_antecedentes_atencion_pkey" PRIMARY KEY ("id_hc_antecedente")
);

-- CreateIndex
CREATE UNIQUE INDEX "hc_anamnesis_atencion_id_atencion_key" ON "hc_anamnesis_atencion"("id_atencion");

-- CreateIndex
CREATE INDEX "idx_hc_anamnesis_atencion" ON "hc_anamnesis_atencion"("id_atencion");

-- CreateIndex
CREATE INDEX "idx_hc_antecedentes_atencion" ON "hc_antecedentes_atencion"("id_atencion");

-- AddForeignKey
ALTER TABLE "hc_anamnesis_atencion" ADD CONSTRAINT "hc_anamnesis_atencion_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hc_antecedentes_atencion" ADD CONSTRAINT "hc_antecedentes_atencion_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE CASCADE ON UPDATE NO ACTION;
