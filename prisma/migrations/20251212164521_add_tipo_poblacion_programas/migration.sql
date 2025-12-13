-- CreateTable
CREATE TABLE "acompanantes" (
    "id_acompanante" SERIAL NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "direccion" VARCHAR(200),
    "telefono" VARCHAR(50),
    "relacion_con_paciente" VARCHAR(100),

    CONSTRAINT "acompanantes_pkey" PRIMARY KEY ("id_acompanante")
);

-- CreateTable
CREATE TABLE "archivos_adjuntos" (
    "id_archivo" SERIAL NOT NULL,
    "entidad" VARCHAR(50) NOT NULL,
    "id_entidad" INTEGER NOT NULL,
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "ruta" VARCHAR(500) NOT NULL,
    "tipo_mime" VARCHAR(100),
    "tamano_bytes" BIGINT,
    "id_usuario_subio" INTEGER,
    "fecha_subida" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archivos_adjuntos_pkey" PRIMARY KEY ("id_archivo")
);

-- CreateTable
CREATE TABLE "atenciones_salud" (
    "id_atencion" SERIAL NOT NULL,
    "id_historia" INTEGER NOT NULL,
    "id_profesional" INTEGER,
    "id_tipo_atencion" INTEGER,
    "id_modalidad_atencion" INTEGER,
    "id_cita" INTEGER,
    "fecha_hora" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo_atencion" TEXT,
    "nota_atencion" TEXT,
    "observacion_analisis" TEXT,
    "plan_manejo" TEXT,

    CONSTRAINT "atenciones_salud_pkey" PRIMARY KEY ("id_atencion")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id_auditoria" SERIAL NOT NULL,
    "id_usuario" INTEGER,
    "tabla" VARCHAR(100) NOT NULL,
    "id_registro" VARCHAR(100) NOT NULL,
    "accion" VARCHAR(20) NOT NULL,
    "fecha_hora" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detalle" TEXT,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id_auditoria")
);

-- CreateTable
CREATE TABLE "catalogo_examenes" (
    "id_examen_catalogo" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "id_tipo_examen" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "catalogo_examenes_pkey" PRIMARY KEY ("id_examen_catalogo")
);

-- CreateTable
CREATE TABLE "catalogo_medicamentos" (
    "id_medicamento" SERIAL NOT NULL,
    "nombre_generico" VARCHAR(150) NOT NULL,
    "nombre_comercial" VARCHAR(150),
    "presentacion" VARCHAR(100),
    "registro_invima" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "catalogo_medicamentos_pkey" PRIMARY KEY ("id_medicamento")
);

-- CreateTable
CREATE TABLE "certificados_medicos" (
    "id_certificado" SERIAL NOT NULL,
    "id_atencion" INTEGER NOT NULL,
    "id_tipo_certificado" INTEGER NOT NULL,
    "restricciones" TEXT,
    "recomendaciones" TEXT,
    "fecha_emision" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codigo_verificacion" VARCHAR(100),
    "firma_digital" TEXT,
    "id_usuario_emisor" INTEGER,

    CONSTRAINT "certificados_medicos_pkey" PRIMARY KEY ("id_certificado")
);

-- CreateTable
CREATE TABLE "cie10" (
    "codigo" VARCHAR(10) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,

    CONSTRAINT "cie10_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "citas" (
    "id_cita" SERIAL NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "id_profesional" INTEGER NOT NULL,
    "id_sede" INTEGER,
    "id_tipo_cita" INTEGER,
    "id_estado_cita" INTEGER,
    "fecha_hora_inicio" TIMESTAMP(6) NOT NULL,
    "fecha_hora_fin" TIMESTAMP(6),
    "motivo" TEXT,
    "canal_recordatorio" VARCHAR(50),

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id_cita")
);

-- CreateTable
CREATE TABLE "consentimientos_paciente" (
    "id_consentimiento" SERIAL NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "id_plantilla" INTEGER NOT NULL,
    "id_atencion" INTEGER,
    "id_estado_consentimiento" INTEGER,
    "fecha_firma" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firma_paciente" TEXT,
    "firma_testigo" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "consentimientos_paciente_pkey" PRIMARY KEY ("id_consentimiento")
);

-- CreateTable
CREATE TABLE "desistimientos_programa" (
    "id_desistimiento" SERIAL NOT NULL,
    "id_programa_paciente" INTEGER NOT NULL,
    "id_profesional" INTEGER,
    "id_atencion" INTEGER,
    "fecha" DATE NOT NULL,
    "id_sede" INTEGER,
    "motivo_desistimiento" TEXT,
    "firma_digital" TEXT,
    "compromiso_otras_rutas" TEXT,

    CONSTRAINT "desistimientos_programa_pkey" PRIMARY KEY ("id_desistimiento")
);

-- CreateTable
CREATE TABLE "diagnosticos_atencion" (
    "id_diagnostico" SERIAL NOT NULL,
    "id_atencion" INTEGER NOT NULL,
    "codigo_cie10" VARCHAR(10) NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "id_tipo_confirmacion" INTEGER,

    CONSTRAINT "diagnosticos_atencion_pkey" PRIMARY KEY ("id_diagnostico")
);

-- CreateTable
CREATE TABLE "disponibilidades_profesional" (
    "id_disponibilidad" SERIAL NOT NULL,
    "id_profesional" INTEGER NOT NULL,
    "dia_semana" SMALLINT NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_fin" TIME(6) NOT NULL,
    "capacidad_simultanea" INTEGER NOT NULL DEFAULT 1,
    "es_excepcion" BOOLEAN NOT NULL DEFAULT false,
    "fecha_inicio_vigencia" DATE,
    "fecha_fin_vigencia" DATE,

    CONSTRAINT "disponibilidades_profesional_pkey" PRIMARY KEY ("id_disponibilidad")
);

-- CreateTable
CREATE TABLE "eps" (
    "id_eps" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "nit" VARCHAR(50),

    CONSTRAINT "eps_pkey" PRIMARY KEY ("id_eps")
);

-- CreateTable
CREATE TABLE "especialidades" (
    "id_especialidad" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(200),

    CONSTRAINT "especialidades_pkey" PRIMARY KEY ("id_especialidad")
);

-- CreateTable
CREATE TABLE "estados_cita" (
    "id_estado_cita" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150) NOT NULL,

    CONSTRAINT "estados_cita_pkey" PRIMARY KEY ("id_estado_cita")
);

-- CreateTable
CREATE TABLE "estados_civiles" (
    "id_estado_civil" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "descripcion" VARCHAR(100) NOT NULL,

    CONSTRAINT "estados_civiles_pkey" PRIMARY KEY ("id_estado_civil")
);

-- CreateTable
CREATE TABLE "estados_consentimiento" (
    "id_estado_consentimiento" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150) NOT NULL,

    CONSTRAINT "estados_consentimiento_pkey" PRIMARY KEY ("id_estado_consentimiento")
);

-- CreateTable
CREATE TABLE "estados_examen" (
    "id_estado_examen" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150) NOT NULL,

    CONSTRAINT "estados_examen_pkey" PRIMARY KEY ("id_estado_examen")
);

-- CreateTable
CREATE TABLE "estados_programa_paciente" (
    "id_estado_programa_paciente" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150) NOT NULL,

    CONSTRAINT "estados_programa_paciente_pkey" PRIMARY KEY ("id_estado_programa_paciente")
);

-- CreateTable
CREATE TABLE "estados_seguimiento" (
    "id_estado_seguimiento" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150) NOT NULL,

    CONSTRAINT "estados_seguimiento_pkey" PRIMARY KEY ("id_estado_seguimiento")
);

-- CreateTable
CREATE TABLE "eventos_seguimiento_cronico" (
    "id_evento" SERIAL NOT NULL,
    "id_seguimiento_cronico" INTEGER NOT NULL,
    "id_atencion" INTEGER,
    "fecha_programada" DATE,
    "fecha_realizada" DATE,
    "id_estado_seguimiento" INTEGER,
    "comentarios" TEXT,

    CONSTRAINT "eventos_seguimiento_cronico_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "examenes_diagnosticos" (
    "id_examen" SERIAL NOT NULL,
    "id_atencion" INTEGER NOT NULL,
    "id_examen_catalogo" INTEGER NOT NULL,
    "id_estado_examen" INTEGER,
    "indicaciones" TEXT,
    "resultado" TEXT,

    CONSTRAINT "examenes_diagnosticos_pkey" PRIMARY KEY ("id_examen")
);

-- CreateTable
CREATE TABLE "formulas_medicas" (
    "id_formula" SERIAL NOT NULL,
    "id_atencion" INTEGER NOT NULL,
    "fecha_emision" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigencia_hasta" DATE,
    "instrucciones_generales" TEXT,
    "firma_digital" TEXT,

    CONSTRAINT "formulas_medicas_pkey" PRIMARY KEY ("id_formula")
);

-- CreateTable
CREATE TABLE "generos" (
    "id_genero" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "descripcion" VARCHAR(100) NOT NULL,

    CONSTRAINT "generos_pkey" PRIMARY KEY ("id_genero")
);

-- CreateTable
CREATE TABLE "historias_clinicas" (
    "id_historia" SERIAL NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "id_tipo_historia" INTEGER NOT NULL,
    "id_profesional_responsable" INTEGER,
    "fecha_apertura" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" VARCHAR(50) DEFAULT 'activa',
    "motivo_consulta" TEXT,
    "enfermedad_actual" TEXT,
    "antecedentes_personales" TEXT,
    "antecedentes_familiares" TEXT,

    CONSTRAINT "historias_clinicas_pkey" PRIMARY KEY ("id_historia")
);

-- CreateTable
CREATE TABLE "items_formula" (
    "id_item" SERIAL NOT NULL,
    "id_formula" INTEGER NOT NULL,
    "id_medicamento" INTEGER NOT NULL,
    "dosis" VARCHAR(100) NOT NULL,
    "frecuencia" VARCHAR(100) NOT NULL,
    "duracion" VARCHAR(100),
    "via_administracion" VARCHAR(50),

    CONSTRAINT "items_formula_pkey" PRIMARY KEY ("id_item")
);

-- CreateTable
CREATE TABLE "modalidades_atencion" (
    "id_modalidad_atencion" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150) NOT NULL,

    CONSTRAINT "modalidades_atencion_pkey" PRIMARY KEY ("id_modalidad_atencion")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id_paciente" SERIAL NOT NULL,
    "id_tipo_documento" INTEGER NOT NULL,
    "numero_documento" VARCHAR(50) NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "id_genero" INTEGER,
    "id_estado_civil" INTEGER,
    "direccion" VARCHAR(200),
    "telefono" VARCHAR(50),
    "email" VARCHAR(150),
    "id_tipo_sangre" INTEGER,
    "id_sede" INTEGER,
    "id_programa_academico" INTEGER,
    "id_eps" INTEGER,
    "condicion_particular" TEXT,
    "id_tipo_usuario" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_creacion" INTEGER,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id_paciente")
);

-- CreateTable
CREATE TABLE "plantillas_consentimiento" (
    "id_plantilla" SERIAL NOT NULL,
    "id_tipo_consentimiento" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "vigente_desde" DATE NOT NULL,
    "vigente_hasta" DATE,
    "contenido" TEXT NOT NULL,
    "id_usuario_creador" INTEGER,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plantillas_consentimiento_pkey" PRIMARY KEY ("id_plantilla")
);

-- CreateTable
CREATE TABLE "profesionales_salud" (
    "id_profesional" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_sede" INTEGER,
    "id_especialidad" INTEGER,
    "registro_medico" VARCHAR(100),
    "telefono_contacto" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "profesionales_salud_pkey" PRIMARY KEY ("id_profesional")
);

-- CreateTable
CREATE TABLE "programas_academicos" (
    "id_programa_academico" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "codigo" VARCHAR(50),
    "tipo_poblacion" VARCHAR(30) NOT NULL,

    CONSTRAINT "programas_academicos_pkey" PRIMARY KEY ("id_programa_academico")
);

-- CreateTable
CREATE TABLE "programas_paciente" (
    "id_programa_paciente" SERIAL NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "id_programa_salud" INTEGER NOT NULL,
    "id_estado_programa_paciente" INTEGER,
    "fecha_inicio" DATE NOT NULL DEFAULT CURRENT_DATE,
    "fecha_fin" DATE,

    CONSTRAINT "programas_paciente_pkey" PRIMARY KEY ("id_programa_paciente")
);

-- CreateTable
CREATE TABLE "programas_salud" (
    "id_programa_salud" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" VARCHAR(300),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "programas_salud_pkey" PRIMARY KEY ("id_programa_salud")
);

-- CreateTable
CREATE TABLE "recomendaciones_medicas" (
    "id_recomendacion" SERIAL NOT NULL,
    "id_atencion" INTEGER NOT NULL,
    "id_tipo_recomendacion" INTEGER,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "recomendaciones_medicas_pkey" PRIMARY KEY ("id_recomendacion")
);

-- CreateTable
CREATE TABLE "roles" (
    "id_rol" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(200),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "rutas_activadas_atencion" (
    "id_ruta_activada" SERIAL NOT NULL,
    "id_atencion" INTEGER NOT NULL,
    "id_ruta_atencion" INTEGER NOT NULL,
    "fecha_activacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,

    CONSTRAINT "rutas_activadas_atencion_pkey" PRIMARY KEY ("id_ruta_activada")
);

-- CreateTable
CREATE TABLE "rutas_atencion" (
    "id_ruta_atencion" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150) NOT NULL,

    CONSTRAINT "rutas_atencion_pkey" PRIMARY KEY ("id_ruta_atencion")
);

-- CreateTable
CREATE TABLE "sedes" (
    "id_sede" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "ciudad" VARCHAR(100),
    "departamento" VARCHAR(100),

    CONSTRAINT "sedes_pkey" PRIMARY KEY ("id_sede")
);

-- CreateTable
CREATE TABLE "seguimientos_cronicos" (
    "id_seguimiento_cronico" SERIAL NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "id_programa_salud" INTEGER,
    "id_diagnostico_principal" INTEGER,
    "fecha_inicio" DATE NOT NULL DEFAULT CURRENT_DATE,
    "fecha_fin" DATE,
    "id_estado_seguimiento" INTEGER,
    "observaciones_generales" TEXT,

    CONSTRAINT "seguimientos_cronicos_pkey" PRIMARY KEY ("id_seguimiento_cronico")
);

-- CreateTable
CREATE TABLE "tipos_atencion" (
    "id_tipo_atencion" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150) NOT NULL,

    CONSTRAINT "tipos_atencion_pkey" PRIMARY KEY ("id_tipo_atencion")
);

-- CreateTable
CREATE TABLE "tipos_certificado_medico" (
    "id_tipo_certificado" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150) NOT NULL,

    CONSTRAINT "tipos_certificado_medico_pkey" PRIMARY KEY ("id_tipo_certificado")
);

-- CreateTable
CREATE TABLE "tipos_cita" (
    "id_tipo_cita" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150) NOT NULL,

    CONSTRAINT "tipos_cita_pkey" PRIMARY KEY ("id_tipo_cita")
);

-- CreateTable
CREATE TABLE "tipos_confirmacion_diagnostico" (
    "id_tipo_confirmacion" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150) NOT NULL,

    CONSTRAINT "tipos_confirmacion_diagnostico_pkey" PRIMARY KEY ("id_tipo_confirmacion")
);

-- CreateTable
CREATE TABLE "tipos_consentimiento" (
    "id_tipo_consentimiento" SERIAL NOT NULL,
    "codigo" VARCHAR(80) NOT NULL,
    "descripcion" VARCHAR(200) NOT NULL,

    CONSTRAINT "tipos_consentimiento_pkey" PRIMARY KEY ("id_tipo_consentimiento")
);

-- CreateTable
CREATE TABLE "tipos_documento" (
    "id_tipo_documento" SERIAL NOT NULL,
    "codigo" VARCHAR(10) NOT NULL,
    "descripcion" VARCHAR(100) NOT NULL,

    CONSTRAINT "tipos_documento_pkey" PRIMARY KEY ("id_tipo_documento")
);

-- CreateTable
CREATE TABLE "tipos_examen" (
    "id_tipo_examen" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150) NOT NULL,

    CONSTRAINT "tipos_examen_pkey" PRIMARY KEY ("id_tipo_examen")
);

-- CreateTable
CREATE TABLE "tipos_historia_clinica" (
    "id_tipo_historia" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150) NOT NULL,

    CONSTRAINT "tipos_historia_clinica_pkey" PRIMARY KEY ("id_tipo_historia")
);

-- CreateTable
CREATE TABLE "tipos_recomendacion_medica" (
    "id_tipo_recomendacion" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150) NOT NULL,

    CONSTRAINT "tipos_recomendacion_medica_pkey" PRIMARY KEY ("id_tipo_recomendacion")
);

-- CreateTable
CREATE TABLE "tipos_sangre" (
    "id_tipo_sangre" SERIAL NOT NULL,
    "codigo" VARCHAR(5) NOT NULL,
    "descripcion" VARCHAR(50),

    CONSTRAINT "tipos_sangre_pkey" PRIMARY KEY ("id_tipo_sangre")
);

-- CreateTable
CREATE TABLE "tipos_usuario" (
    "id_tipo_usuario" SERIAL NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "descripcion" VARCHAR(100) NOT NULL,

    CONSTRAINT "tipos_usuario_pkey" PRIMARY KEY ("id_tipo_usuario")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nombre_completo" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "id_rol" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id_permiso" SERIAL NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "modulo" VARCHAR(50) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id_permiso")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "id_rol_permiso" SERIAL NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "id_permiso" INTEGER NOT NULL,
    "concedido" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("id_rol_permiso")
);

-- CreateIndex
CREATE INDEX "idx_adjuntos_entidad" ON "archivos_adjuntos"("entidad", "id_entidad");

-- CreateIndex
CREATE INDEX "idx_citas_paciente" ON "citas"("id_paciente");

-- CreateIndex
CREATE INDEX "idx_citas_profesional" ON "citas"("id_profesional", "fecha_hora_inicio");

-- CreateIndex
CREATE INDEX "idx_consent_paciente" ON "consentimientos_paciente"("id_paciente");

-- CreateIndex
CREATE INDEX "idx_diag_atencion" ON "diagnosticos_atencion"("id_atencion");

-- CreateIndex
CREATE INDEX "idx_diag_cie10" ON "diagnosticos_atencion"("codigo_cie10");

-- CreateIndex
CREATE UNIQUE INDEX "estados_cita_codigo_key" ON "estados_cita"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "estados_civiles_codigo_key" ON "estados_civiles"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "estados_consentimiento_codigo_key" ON "estados_consentimiento"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "estados_examen_codigo_key" ON "estados_examen"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "estados_programa_paciente_codigo_key" ON "estados_programa_paciente"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "estados_seguimiento_codigo_key" ON "estados_seguimiento"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "generos_codigo_key" ON "generos"("codigo");

-- CreateIndex
CREATE INDEX "idx_historia_paciente" ON "historias_clinicas"("id_paciente");

-- CreateIndex
CREATE UNIQUE INDEX "modalidades_atencion_codigo_key" ON "modalidades_atencion"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_numero_documento_key" ON "pacientes"("numero_documento");

-- CreateIndex
CREATE INDEX "idx_pacientes_nombre" ON "pacientes"("nombres", "apellidos");

-- CreateIndex
CREATE UNIQUE INDEX "plantillas_consentimiento_id_tipo_consentimiento_version_key" ON "plantillas_consentimiento"("id_tipo_consentimiento", "version");

-- CreateIndex
CREATE UNIQUE INDEX "programas_academicos_codigo_key" ON "programas_academicos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "rutas_atencion_codigo_key" ON "rutas_atencion"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_atencion_codigo_key" ON "tipos_atencion"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_certificado_medico_codigo_key" ON "tipos_certificado_medico"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_cita_codigo_key" ON "tipos_cita"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_confirmacion_diagnostico_codigo_key" ON "tipos_confirmacion_diagnostico"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_consentimiento_codigo_key" ON "tipos_consentimiento"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_documento_codigo_key" ON "tipos_documento"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_examen_codigo_key" ON "tipos_examen"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_historia_clinica_codigo_key" ON "tipos_historia_clinica"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_recomendacion_medica_codigo_key" ON "tipos_recomendacion_medica"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_sangre_codigo_key" ON "tipos_sangre"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_usuario_codigo_key" ON "tipos_usuario"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_rol_permiso" ON "roles_permisos"("id_rol", "id_permiso");

-- AddForeignKey
ALTER TABLE "acompanantes" ADD CONSTRAINT "acompanantes_id_paciente_fkey" FOREIGN KEY ("id_paciente") REFERENCES "pacientes"("id_paciente") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "archivos_adjuntos" ADD CONSTRAINT "archivos_adjuntos_id_usuario_subio_fkey" FOREIGN KEY ("id_usuario_subio") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "atenciones_salud" ADD CONSTRAINT "atenciones_salud_id_historia_fkey" FOREIGN KEY ("id_historia") REFERENCES "historias_clinicas"("id_historia") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "atenciones_salud" ADD CONSTRAINT "atenciones_salud_id_modalidad_atencion_fkey" FOREIGN KEY ("id_modalidad_atencion") REFERENCES "modalidades_atencion"("id_modalidad_atencion") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "atenciones_salud" ADD CONSTRAINT "atenciones_salud_id_profesional_fkey" FOREIGN KEY ("id_profesional") REFERENCES "profesionales_salud"("id_profesional") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "atenciones_salud" ADD CONSTRAINT "atenciones_salud_id_tipo_atencion_fkey" FOREIGN KEY ("id_tipo_atencion") REFERENCES "tipos_atencion"("id_tipo_atencion") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "atenciones_salud" ADD CONSTRAINT "fk_atencion_cita" FOREIGN KEY ("id_cita") REFERENCES "citas"("id_cita") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "catalogo_examenes" ADD CONSTRAINT "catalogo_examenes_id_tipo_examen_fkey" FOREIGN KEY ("id_tipo_examen") REFERENCES "tipos_examen"("id_tipo_examen") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "certificados_medicos" ADD CONSTRAINT "certificados_medicos_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "certificados_medicos" ADD CONSTRAINT "certificados_medicos_id_tipo_certificado_fkey" FOREIGN KEY ("id_tipo_certificado") REFERENCES "tipos_certificado_medico"("id_tipo_certificado") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "certificados_medicos" ADD CONSTRAINT "certificados_medicos_id_usuario_emisor_fkey" FOREIGN KEY ("id_usuario_emisor") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_id_estado_cita_fkey" FOREIGN KEY ("id_estado_cita") REFERENCES "estados_cita"("id_estado_cita") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_id_paciente_fkey" FOREIGN KEY ("id_paciente") REFERENCES "pacientes"("id_paciente") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_id_profesional_fkey" FOREIGN KEY ("id_profesional") REFERENCES "profesionales_salud"("id_profesional") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_id_sede_fkey" FOREIGN KEY ("id_sede") REFERENCES "sedes"("id_sede") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_id_tipo_cita_fkey" FOREIGN KEY ("id_tipo_cita") REFERENCES "tipos_cita"("id_tipo_cita") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consentimientos_paciente" ADD CONSTRAINT "consentimientos_paciente_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consentimientos_paciente" ADD CONSTRAINT "consentimientos_paciente_id_estado_consentimiento_fkey" FOREIGN KEY ("id_estado_consentimiento") REFERENCES "estados_consentimiento"("id_estado_consentimiento") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consentimientos_paciente" ADD CONSTRAINT "consentimientos_paciente_id_paciente_fkey" FOREIGN KEY ("id_paciente") REFERENCES "pacientes"("id_paciente") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consentimientos_paciente" ADD CONSTRAINT "consentimientos_paciente_id_plantilla_fkey" FOREIGN KEY ("id_plantilla") REFERENCES "plantillas_consentimiento"("id_plantilla") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "desistimientos_programa" ADD CONSTRAINT "desistimientos_programa_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "desistimientos_programa" ADD CONSTRAINT "desistimientos_programa_id_profesional_fkey" FOREIGN KEY ("id_profesional") REFERENCES "profesionales_salud"("id_profesional") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "desistimientos_programa" ADD CONSTRAINT "desistimientos_programa_id_programa_paciente_fkey" FOREIGN KEY ("id_programa_paciente") REFERENCES "programas_paciente"("id_programa_paciente") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "desistimientos_programa" ADD CONSTRAINT "desistimientos_programa_id_sede_fkey" FOREIGN KEY ("id_sede") REFERENCES "sedes"("id_sede") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "diagnosticos_atencion" ADD CONSTRAINT "diagnosticos_atencion_codigo_cie10_fkey" FOREIGN KEY ("codigo_cie10") REFERENCES "cie10"("codigo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "diagnosticos_atencion" ADD CONSTRAINT "diagnosticos_atencion_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "diagnosticos_atencion" ADD CONSTRAINT "diagnosticos_atencion_id_tipo_confirmacion_fkey" FOREIGN KEY ("id_tipo_confirmacion") REFERENCES "tipos_confirmacion_diagnostico"("id_tipo_confirmacion") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "disponibilidades_profesional" ADD CONSTRAINT "disponibilidades_profesional_id_profesional_fkey" FOREIGN KEY ("id_profesional") REFERENCES "profesionales_salud"("id_profesional") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "eventos_seguimiento_cronico" ADD CONSTRAINT "eventos_seguimiento_cronico_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "eventos_seguimiento_cronico" ADD CONSTRAINT "eventos_seguimiento_cronico_id_estado_seguimiento_fkey" FOREIGN KEY ("id_estado_seguimiento") REFERENCES "estados_seguimiento"("id_estado_seguimiento") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "eventos_seguimiento_cronico" ADD CONSTRAINT "eventos_seguimiento_cronico_id_seguimiento_cronico_fkey" FOREIGN KEY ("id_seguimiento_cronico") REFERENCES "seguimientos_cronicos"("id_seguimiento_cronico") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "examenes_diagnosticos" ADD CONSTRAINT "examenes_diagnosticos_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "examenes_diagnosticos" ADD CONSTRAINT "examenes_diagnosticos_id_estado_examen_fkey" FOREIGN KEY ("id_estado_examen") REFERENCES "estados_examen"("id_estado_examen") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "examenes_diagnosticos" ADD CONSTRAINT "examenes_diagnosticos_id_examen_catalogo_fkey" FOREIGN KEY ("id_examen_catalogo") REFERENCES "catalogo_examenes"("id_examen_catalogo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "formulas_medicas" ADD CONSTRAINT "formulas_medicas_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historias_clinicas" ADD CONSTRAINT "historias_clinicas_id_paciente_fkey" FOREIGN KEY ("id_paciente") REFERENCES "pacientes"("id_paciente") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historias_clinicas" ADD CONSTRAINT "historias_clinicas_id_profesional_responsable_fkey" FOREIGN KEY ("id_profesional_responsable") REFERENCES "profesionales_salud"("id_profesional") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historias_clinicas" ADD CONSTRAINT "historias_clinicas_id_tipo_historia_fkey" FOREIGN KEY ("id_tipo_historia") REFERENCES "tipos_historia_clinica"("id_tipo_historia") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "items_formula" ADD CONSTRAINT "items_formula_id_formula_fkey" FOREIGN KEY ("id_formula") REFERENCES "formulas_medicas"("id_formula") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "items_formula" ADD CONSTRAINT "items_formula_id_medicamento_fkey" FOREIGN KEY ("id_medicamento") REFERENCES "catalogo_medicamentos"("id_medicamento") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_id_eps_fkey" FOREIGN KEY ("id_eps") REFERENCES "eps"("id_eps") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_id_estado_civil_fkey" FOREIGN KEY ("id_estado_civil") REFERENCES "estados_civiles"("id_estado_civil") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_id_genero_fkey" FOREIGN KEY ("id_genero") REFERENCES "generos"("id_genero") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_id_programa_academico_fkey" FOREIGN KEY ("id_programa_academico") REFERENCES "programas_academicos"("id_programa_academico") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_id_sede_fkey" FOREIGN KEY ("id_sede") REFERENCES "sedes"("id_sede") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_id_tipo_documento_fkey" FOREIGN KEY ("id_tipo_documento") REFERENCES "tipos_documento"("id_tipo_documento") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_id_tipo_sangre_fkey" FOREIGN KEY ("id_tipo_sangre") REFERENCES "tipos_sangre"("id_tipo_sangre") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_id_tipo_usuario_fkey" FOREIGN KEY ("id_tipo_usuario") REFERENCES "tipos_usuario"("id_tipo_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_id_usuario_creacion_fkey" FOREIGN KEY ("id_usuario_creacion") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plantillas_consentimiento" ADD CONSTRAINT "plantillas_consentimiento_id_tipo_consentimiento_fkey" FOREIGN KEY ("id_tipo_consentimiento") REFERENCES "tipos_consentimiento"("id_tipo_consentimiento") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plantillas_consentimiento" ADD CONSTRAINT "plantillas_consentimiento_id_usuario_creador_fkey" FOREIGN KEY ("id_usuario_creador") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profesionales_salud" ADD CONSTRAINT "profesionales_salud_id_especialidad_fkey" FOREIGN KEY ("id_especialidad") REFERENCES "especialidades"("id_especialidad") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profesionales_salud" ADD CONSTRAINT "profesionales_salud_id_sede_fkey" FOREIGN KEY ("id_sede") REFERENCES "sedes"("id_sede") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profesionales_salud" ADD CONSTRAINT "profesionales_salud_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "programas_paciente" ADD CONSTRAINT "programas_paciente_id_estado_programa_paciente_fkey" FOREIGN KEY ("id_estado_programa_paciente") REFERENCES "estados_programa_paciente"("id_estado_programa_paciente") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "programas_paciente" ADD CONSTRAINT "programas_paciente_id_paciente_fkey" FOREIGN KEY ("id_paciente") REFERENCES "pacientes"("id_paciente") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "programas_paciente" ADD CONSTRAINT "programas_paciente_id_programa_salud_fkey" FOREIGN KEY ("id_programa_salud") REFERENCES "programas_salud"("id_programa_salud") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recomendaciones_medicas" ADD CONSTRAINT "recomendaciones_medicas_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recomendaciones_medicas" ADD CONSTRAINT "recomendaciones_medicas_id_tipo_recomendacion_fkey" FOREIGN KEY ("id_tipo_recomendacion") REFERENCES "tipos_recomendacion_medica"("id_tipo_recomendacion") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rutas_activadas_atencion" ADD CONSTRAINT "rutas_activadas_atencion_id_atencion_fkey" FOREIGN KEY ("id_atencion") REFERENCES "atenciones_salud"("id_atencion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rutas_activadas_atencion" ADD CONSTRAINT "rutas_activadas_atencion_id_ruta_atencion_fkey" FOREIGN KEY ("id_ruta_atencion") REFERENCES "rutas_atencion"("id_ruta_atencion") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seguimientos_cronicos" ADD CONSTRAINT "fk_seguimiento_diag_principal" FOREIGN KEY ("id_diagnostico_principal") REFERENCES "diagnosticos_atencion"("id_diagnostico") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seguimientos_cronicos" ADD CONSTRAINT "seguimientos_cronicos_id_estado_seguimiento_fkey" FOREIGN KEY ("id_estado_seguimiento") REFERENCES "estados_seguimiento"("id_estado_seguimiento") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seguimientos_cronicos" ADD CONSTRAINT "seguimientos_cronicos_id_paciente_fkey" FOREIGN KEY ("id_paciente") REFERENCES "pacientes"("id_paciente") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seguimientos_cronicos" ADD CONSTRAINT "seguimientos_cronicos_id_programa_salud_fkey" FOREIGN KEY ("id_programa_salud") REFERENCES "programas_salud"("id_programa_salud") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "roles"("id_rol") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_id_permiso_fkey" FOREIGN KEY ("id_permiso") REFERENCES "permisos"("id_permiso") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "roles"("id_rol") ON DELETE CASCADE ON UPDATE NO ACTION;
