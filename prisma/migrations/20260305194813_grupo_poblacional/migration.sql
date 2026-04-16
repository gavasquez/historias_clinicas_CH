/*
  Warnings:

  - You are about to drop the column `motivo_atencion` on the `atenciones_salud` table. All the data in the column will be lost.
  - You are about to drop the column `nota_atencion` on the `atenciones_salud` table. All the data in the column will be lost.
  - You are about to drop the column `observacion_analisis` on the `atenciones_salud` table. All the data in the column will be lost.
  - You are about to drop the column `plan_manejo` on the `atenciones_salud` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "atenciones_salud" DROP COLUMN "motivo_atencion",
DROP COLUMN "nota_atencion",
DROP COLUMN "observacion_analisis",
DROP COLUMN "plan_manejo";

-- AlterTable
ALTER TABLE "pacientes" ADD COLUMN     "grupo_poblacional" VARCHAR(50),
ADD COLUMN     "grupo_poblacional_otro" VARCHAR(150);

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "telefono" DROP DEFAULT;
