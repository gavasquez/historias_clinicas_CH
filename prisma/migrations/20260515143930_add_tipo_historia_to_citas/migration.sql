-- AlterTable
ALTER TABLE "citas" ADD COLUMN     "id_tipo_historia" INTEGER;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_id_tipo_historia_fkey" FOREIGN KEY ("id_tipo_historia") REFERENCES "tipos_historia_clinica"("id_tipo_historia") ON DELETE NO ACTION ON UPDATE NO ACTION;
