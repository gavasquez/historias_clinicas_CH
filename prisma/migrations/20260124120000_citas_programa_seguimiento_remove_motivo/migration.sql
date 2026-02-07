-- AlterTable
ALTER TABLE "citas" ADD COLUMN     "id_programa_salud" INTEGER;
ALTER TABLE "citas" ADD COLUMN     "seguimiento" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "citas" ADD COLUMN     "tipo_seguimiento" VARCHAR(30);

-- DropColumn
ALTER TABLE "citas" DROP COLUMN "motivo";

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_id_programa_salud_fkey" FOREIGN KEY ("id_programa_salud") REFERENCES "programas_salud"("id_programa_salud") ON DELETE SET NULL ON UPDATE CASCADE;
