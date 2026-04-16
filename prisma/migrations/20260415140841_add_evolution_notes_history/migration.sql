-- AlterTable
ALTER TABLE "citas" ADD COLUMN     "tipos_atencionId_tipo_atencion" INTEGER;

-- CreateTable
CREATE TABLE "notas_evolucion_historia" (
    "id_nota_evolucion" SERIAL NOT NULL,
    "id_historia" INTEGER NOT NULL,
    "fecha_hora" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_tipo_atencion" INTEGER,
    "id_modalidad_atencion" INTEGER,
    "nota_atencion" TEXT,
    "analisis" TEXT,
    "plan_manejo" TEXT,

    CONSTRAINT "notas_evolucion_historia_pkey" PRIMARY KEY ("id_nota_evolucion")
);

-- CreateTable
CREATE TABLE "notas_evolucion_historia_diagnosticos" (
    "id_nota_dx" SERIAL NOT NULL,
    "id_nota_evolucion" INTEGER NOT NULL,
    "codigo_cie10" TEXT NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notas_evolucion_historia_diagnosticos_pkey" PRIMARY KEY ("id_nota_dx")
);

-- CreateIndex
CREATE INDEX "idx_notas_evolucion_historia" ON "notas_evolucion_historia"("id_historia");

-- CreateIndex
CREATE INDEX "idx_nota_evolucion_dx" ON "notas_evolucion_historia_diagnosticos"("id_nota_evolucion");

-- CreateIndex
CREATE INDEX "idx_nota_evolucion_dx_cie10" ON "notas_evolucion_historia_diagnosticos"("codigo_cie10");

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_tipos_atencionId_tipo_atencion_fkey" FOREIGN KEY ("tipos_atencionId_tipo_atencion") REFERENCES "tipos_atencion"("id_tipo_atencion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_evolucion_historia" ADD CONSTRAINT "notas_evolucion_historia_id_historia_fkey" FOREIGN KEY ("id_historia") REFERENCES "historias_clinicas"("id_historia") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notas_evolucion_historia" ADD CONSTRAINT "notas_evolucion_historia_id_tipo_atencion_fkey" FOREIGN KEY ("id_tipo_atencion") REFERENCES "tipos_atencion"("id_tipo_atencion") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notas_evolucion_historia" ADD CONSTRAINT "notas_evolucion_historia_id_modalidad_atencion_fkey" FOREIGN KEY ("id_modalidad_atencion") REFERENCES "modalidades_atencion"("id_modalidad_atencion") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notas_evolucion_historia_diagnosticos" ADD CONSTRAINT "notas_evolucion_historia_diagnosticos_id_nota_evolucion_fkey" FOREIGN KEY ("id_nota_evolucion") REFERENCES "notas_evolucion_historia"("id_nota_evolucion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notas_evolucion_historia_diagnosticos" ADD CONSTRAINT "notas_evolucion_historia_diagnosticos_codigo_cie10_fkey" FOREIGN KEY ("codigo_cie10") REFERENCES "cie10"("codigo") ON DELETE NO ACTION ON UPDATE NO ACTION;
