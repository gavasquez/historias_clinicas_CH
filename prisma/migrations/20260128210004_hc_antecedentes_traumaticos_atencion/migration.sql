-- CreateTable
CREATE TABLE "hc_antecedentes_traumaticos_atencion" (
    "id_hc_antecedente_traumatico" SERIAL NOT NULL,
    "id_atencion" INTEGER NOT NULL,
    "naturaleza_lesion" VARCHAR(255),
    "fecha_ocurrencia" DATE,
    "secuelas" TEXT,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hc_antecedentes_traumaticos_atencion_pkey" PRIMARY KEY ("id_hc_antecedente_traumatico")
);

-- CreateIndex
CREATE UNIQUE INDEX "hc_antecedentes_traumaticos_atencion_id_atencion_key" ON "hc_antecedentes_traumaticos_atencion"("id_atencion");

-- CreateIndex
CREATE INDEX "idx_hc_antecedentes_traumaticos_atencion" ON "hc_antecedentes_traumaticos_atencion"("id_atencion");

-- AddForeignKey
ALTER TABLE "hc_antecedentes_traumaticos_atencion" ADD CONSTRAINT "hc_antecedentes_traumaticos_atencion_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE CASCADE ON UPDATE NO ACTION;
