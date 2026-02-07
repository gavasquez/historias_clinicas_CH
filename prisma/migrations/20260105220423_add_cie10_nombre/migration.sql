/*
  Warnings:

  - Added the required column `nombre` to the `cie10` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cie10" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "nombre" VARCHAR(255) NOT NULL,
ALTER COLUMN "descripcion" DROP NOT NULL;
