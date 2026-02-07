-- DropForeignKey
ALTER TABLE "citas" DROP CONSTRAINT "citas_id_estado_cita_fkey";

-- DropForeignKey
ALTER TABLE "citas" DROP CONSTRAINT "citas_id_paciente_fkey";

-- DropForeignKey
ALTER TABLE "citas" DROP CONSTRAINT "citas_id_profesional_fkey";

-- DropForeignKey
ALTER TABLE "citas" DROP CONSTRAINT "citas_id_sede_fkey";

-- DropForeignKey
ALTER TABLE "citas" DROP CONSTRAINT "citas_id_tipo_cita_fkey";

-- AlterTable
ALTER TABLE "citas" ADD COLUMN     "id_modalidad_atencion" INTEGER;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_id_estado_cita_fkey" FOREIGN KEY ("id_estado_cita") REFERENCES "estados_cita"("id_estado_cita") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_id_paciente_fkey" FOREIGN KEY ("id_paciente") REFERENCES "pacientes"("id_paciente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_id_profesional_fkey" FOREIGN KEY ("id_profesional") REFERENCES "profesionales_salud"("id_profesional") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_id_sede_fkey" FOREIGN KEY ("id_sede") REFERENCES "sedes"("id_sede") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_id_tipo_cita_fkey" FOREIGN KEY ("id_tipo_cita") REFERENCES "tipos_cita"("id_tipo_cita") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_id_modalidad_atencion_fkey" FOREIGN KEY ("id_modalidad_atencion") REFERENCES "modalidades_atencion"("id_modalidad_atencion") ON DELETE SET NULL ON UPDATE CASCADE;
