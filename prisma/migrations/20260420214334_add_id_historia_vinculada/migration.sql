-- AlterTable
ALTER TABLE "citas" ADD COLUMN     "id_historia_vinculada" INTEGER;

-- AlterTable
ALTER TABLE "historias_clinicas" ADD COLUMN     "id_historia_vinculada" INTEGER,
ALTER COLUMN "estado" SET DEFAULT 'Finalizado';

-- CreateIndex
CREATE INDEX "idx_citas_historia_vinculada" ON "citas"("id_historia_vinculada");

-- CreateIndex
CREATE INDEX "idx_historia_vinculada" ON "historias_clinicas"("id_historia_vinculada");

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_id_historia_vinculada_fkey" FOREIGN KEY ("id_historia_vinculada") REFERENCES "historias_clinicas"("id_historia") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historias_clinicas" ADD CONSTRAINT "historias_clinicas_id_historia_vinculada_fkey" FOREIGN KEY ("id_historia_vinculada") REFERENCES "historias_clinicas"("id_historia") ON DELETE NO ACTION ON UPDATE NO ACTION;
