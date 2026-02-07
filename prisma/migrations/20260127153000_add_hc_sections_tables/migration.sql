-- CreateTable
CREATE TABLE "hc_ssr_atencion" (
    "id_hc_ssr" SERIAL NOT NULL,
    "id_atencion" INTEGER NOT NULL,
    "contenido" TEXT,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hc_ssr_atencion_pkey" PRIMARY KEY ("id_hc_ssr")
);

-- CreateTable
CREATE TABLE "hc_tamizajes_atencion" (
    "id_hc_tamizaje" SERIAL NOT NULL,
    "id_atencion" INTEGER NOT NULL,
    "contenido" TEXT,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hc_tamizajes_atencion_pkey" PRIMARY KEY ("id_hc_tamizaje")
);

-- CreateTable
CREATE TABLE "hc_examen_fisico_atencion" (
    "id_hc_examen_fisico" SERIAL NOT NULL,
    "id_atencion" INTEGER NOT NULL,
    "contenido" TEXT,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hc_examen_fisico_atencion_pkey" PRIMARY KEY ("id_hc_examen_fisico")
);

-- CreateTable
CREATE TABLE "hc_valoracion_sistemas_atencion" (
    "id_hc_valoracion_sistemas" SERIAL NOT NULL,
    "id_atencion" INTEGER NOT NULL,
    "contenido" TEXT,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hc_valoracion_sistemas_atencion_pkey" PRIMARY KEY ("id_hc_valoracion_sistemas")
);

-- CreateIndex
CREATE UNIQUE INDEX "hc_ssr_atencion_id_atencion_key" ON "hc_ssr_atencion"("id_atencion");

-- CreateIndex
CREATE UNIQUE INDEX "hc_tamizajes_atencion_id_atencion_key" ON "hc_tamizajes_atencion"("id_atencion");

-- CreateIndex
CREATE UNIQUE INDEX "hc_examen_fisico_atencion_id_atencion_key" ON "hc_examen_fisico_atencion"("id_atencion");

-- CreateIndex
CREATE UNIQUE INDEX "hc_valoracion_sistemas_atencion_id_atencion_key" ON "hc_valoracion_sistemas_atencion"("id_atencion");

-- CreateIndex
CREATE INDEX "idx_hc_ssr_atencion" ON "hc_ssr_atencion"("id_atencion");

-- CreateIndex
CREATE INDEX "idx_hc_tamizajes_atencion" ON "hc_tamizajes_atencion"("id_atencion");

-- CreateIndex
CREATE INDEX "idx_hc_examen_fisico_atencion" ON "hc_examen_fisico_atencion"("id_atencion");

-- CreateIndex
CREATE INDEX "idx_hc_val_sistemas_atencion" ON "hc_valoracion_sistemas_atencion"("id_atencion");

-- AddForeignKey
ALTER TABLE "hc_ssr_atencion" ADD CONSTRAINT "hc_ssr_atencion_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hc_tamizajes_atencion" ADD CONSTRAINT "hc_tamizajes_atencion_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hc_examen_fisico_atencion" ADD CONSTRAINT "hc_examen_fisico_atencion_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hc_valoracion_sistemas_atencion" ADD CONSTRAINT "hc_valoracion_sistemas_atencion_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE CASCADE ON UPDATE NO ACTION;
