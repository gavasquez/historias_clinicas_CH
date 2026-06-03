/*
  Warnings:

  - A unique constraint covering the columns `[numero_documento]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "id_tipo_documento" INTEGER,
ADD COLUMN     "numero_documento" VARCHAR(50),
ADD COLUMN     "password_reset_required" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_numero_documento_key" ON "usuarios"("numero_documento");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_id_tipo_documento_fkey" FOREIGN KEY ("id_tipo_documento") REFERENCES "tipos_documento"("id_tipo_documento") ON DELETE NO ACTION ON UPDATE NO ACTION;
