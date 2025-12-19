-- AlterTable
ALTER TABLE "disponibilidades_profesional" ADD COLUMN     "id_sede" INTEGER;

-- CreateIndex
CREATE INDEX "idx_disp_prof_sede_dia" ON "disponibilidades_profesional"("id_profesional", "id_sede", "dia_semana");

-- AddForeignKey
ALTER TABLE "disponibilidades_profesional" ADD CONSTRAINT "disponibilidades_profesional_id_sede_fkey" FOREIGN KEY ("id_sede") REFERENCES "sedes"("id_sede") ON DELETE NO ACTION ON UPDATE NO ACTION;
