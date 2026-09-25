ALTER TABLE "citas" ADD COLUMN "id_usuario_agenda" INTEGER;

CREATE INDEX "idx_citas_usuario_agenda" ON "citas"("id_usuario_agenda");

ALTER TABLE "citas"
ADD CONSTRAINT "citas_id_usuario_agenda_fkey"
FOREIGN KEY ("id_usuario_agenda") REFERENCES "usuarios"("id_usuario")
ON DELETE NO ACTION ON UPDATE NO ACTION;
