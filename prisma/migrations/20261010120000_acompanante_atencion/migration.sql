-- Acompañante por atención (snapshot + referencia opcional al catálogo)
CREATE TABLE "acompanante_atencion" (
    "id_acompanante_atencion" SERIAL PRIMARY KEY,
    "id_atencion" INTEGER NOT NULL,
    "id_acompanante" INTEGER,
    "nombre" VARCHAR(150),
    "relacion_con_paciente" VARCHAR(100),
    "telefono" VARCHAR(50),
    "observacion" TEXT,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "acompanante_atencion_id_atencion_key" UNIQUE ("id_atencion"),
    CONSTRAINT "acompanante_atencion_id_atencion_fkey"
        FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion")
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "acompanante_atencion_id_acompanante_fkey"
        FOREIGN KEY ("id_acompanante") REFERENCES "acompanantes"("id_acompanante")
        ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE INDEX "idx_acompanante_atencion" ON "acompanante_atencion"("id_atencion");
CREATE INDEX "idx_acompanante_atencion_acomp" ON "acompanante_atencion"("id_acompanante");
