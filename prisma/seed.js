const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  async function upsertByNombreField(model, where, createData, updateData) {
    const existing = await model.findFirst({ where });
    if (existing) {
      const idKey = Object.keys(existing).find((k) => k.startsWith("id_"));
      if (!idKey) throw new Error("No se encontró llave primaria para upsert manual");
      return model.update({ where: { [idKey]: existing[idKey] }, data: updateData });
    }
    return model.create({ data: createData });
  }

  const roles = [
    { nombre: "super_admin", descripcion: "Super administrador del sistema" },
    { nombre: "medico", descripcion: "Profesional de salud" },
    { nombre: "enfermera", descripcion: "Profesional de enfermería" },
    { nombre: "administrativo", descripcion: "Usuario administrativo (agenda, pacientes)" },
    { nombre: "directivo", descripcion: "Directivo / coordinación" },
  ];

  for (const role of roles) {
    await prisma.roles.upsert({
      where: { nombre: role.nombre },
      update: { descripcion: role.descripcion },
      create: role,
    });
  }

  const permisos = [
    { codigo: "PACIENTES_VER", descripcion: "Ver pacientes", modulo: "PACIENTES", activo: true },
    { codigo: "PACIENTES_CREAR", descripcion: "Crear pacientes", modulo: "PACIENTES", activo: true },
    { codigo: "PACIENTES_EDITAR", descripcion: "Editar pacientes", modulo: "PACIENTES", activo: true },
    { codigo: "PACIENTES_ELIMINAR", descripcion: "Eliminar pacientes", modulo: "PACIENTES", activo: true },
    { codigo: "CITAS_VER", descripcion: "Ver citas", modulo: "CITAS", activo: true },
    { codigo: "CITAS_GESTIONAR", descripcion: "Gestionar citas", modulo: "CITAS", activo: true },
    { codigo: "HISTORIAS_VER", descripcion: "Ver historias clínicas", modulo: "HISTORIAS", activo: true },
    { codigo: "HISTORIAS_REGISTRAR", descripcion: "Registrar historias clínicas", modulo: "HISTORIAS", activo: true },
    { codigo: "ADMIN_USUARIOS", descripcion: "Administrar usuarios", modulo: "ADMIN", activo: true },
    { codigo: "ADMIN_ROLES", descripcion: "Administrar roles", modulo: "ADMIN", activo: true },
  ];

  for (const permiso of permisos) {
    await prisma.permisos.upsert({
      where: { codigo: permiso.codigo },
      update: {
        descripcion: permiso.descripcion,
        modulo: permiso.modulo,
        activo: permiso.activo,
      },
      create: permiso,
    });
  }

  const rolesByName = await prisma.roles.findMany({
    where: { nombre: { in: roles.map((r) => r.nombre) } },
    select: { id_rol: true, nombre: true },
  });

  const permisosByCode = await prisma.permisos.findMany({
    where: { codigo: { in: permisos.map((p) => p.codigo) } },
    select: { id_permiso: true, codigo: true },
  });

  const roleId = Object.fromEntries(rolesByName.map((r) => [r.nombre, r.id_rol]));
  const permId = Object.fromEntries(permisosByCode.map((p) => [p.codigo, p.id_permiso]));

  const superAdminRoleId = roleId["super_admin"];
  if (superAdminRoleId) {
    const passwordHash = await bcrypt.hash("123456789", 10);
    await prisma.usuarios.upsert({
      where: { username: "admin" },
      update: {
        nombre_completo: "Administrador",
        email: "tic@corhuila.edu.co",
        telefono: "0000000000",
        activo: true,
        id_rol: superAdminRoleId,
        password_hash: passwordHash,
      },
      create: {
        username: "admin",
        password_hash: passwordHash,
        nombre_completo: "Administrador",
        email: "tic@corhuila.edu.co",
        telefono: "0000000000",
        activo: true,
        id_rol: superAdminRoleId,
      },
    });
  }

  const grants = [
    // super_admin => todo
    ["super_admin", "PACIENTES_VER"],
    ["super_admin", "PACIENTES_CREAR"],
    ["super_admin", "PACIENTES_EDITAR"],
    ["super_admin", "PACIENTES_ELIMINAR"],
    ["super_admin", "CITAS_VER"],
    ["super_admin", "CITAS_GESTIONAR"],
    ["super_admin", "HISTORIAS_VER"],
    ["super_admin", "HISTORIAS_REGISTRAR"],
    ["super_admin", "ADMIN_USUARIOS"],
    ["super_admin", "ADMIN_ROLES"],

    // medico => 1,2,3,5,7,8
    ["medico", "PACIENTES_VER"],
    ["medico", "PACIENTES_CREAR"],
    ["medico", "PACIENTES_EDITAR"],
    ["medico", "CITAS_VER"],
    ["medico", "HISTORIAS_VER"],
    ["medico", "HISTORIAS_REGISTRAR"],

    // enfermera => 1,2,3,5,7,8 (similar a medico pero sin gestión de citas)
    ["enfermera", "PACIENTES_VER"],
    ["enfermera", "PACIENTES_CREAR"],
    ["enfermera", "PACIENTES_EDITAR"],
    ["enfermera", "CITAS_VER"],
    ["enfermera", "HISTORIAS_VER"],
    ["enfermera", "HISTORIAS_REGISTRAR"],

    // administrativo => 1,2,3,5,6
    ["administrativo", "PACIENTES_VER"],
    ["administrativo", "PACIENTES_CREAR"],
    ["administrativo", "PACIENTES_EDITAR"],
    ["administrativo", "CITAS_VER"],
    ["administrativo", "CITAS_GESTIONAR"],
  ];

  for (const [rol, codigo] of grants) {
    const id_rol = roleId[rol];
    const id_permiso = permId[codigo];

    if (!id_rol || !id_permiso) continue;

    await prisma.roles_permisos.upsert({
      where: {
        id_rol_id_permiso: {
          id_rol,
          id_permiso,
        },
      },
      update: { concedido: true },
      create: {
        id_rol,
        id_permiso,
        concedido: true,
      },
    });
  }

  const tiposDocumento = [
    { codigo: "CC", descripcion: "Cédula de ciudadanía" },
    { codigo: "TI", descripcion: "Tarjeta de identidad" },
    { codigo: "RC", descripcion: "Registro civil" },
    { codigo: "PT", descripcion: "Pasaporte" },
    { codigo: "OTRO", descripcion: "Otro tipo de documento" },
  ];

  for (const td of tiposDocumento) {
    await prisma.tipos_documento.upsert({
      where: { codigo: td.codigo },
      update: { descripcion: td.descripcion },
      create: td,
    });
  }

  const generos = [
    { codigo: "F", descripcion: "Femenino" },
    { codigo: "M", descripcion: "Masculino" },
    { codigo: "NO_BINARIO", descripcion: "No binario" },
    { codigo: "OTRO", descripcion: "Otro" },
  ];

  for (const g of generos) {
    await prisma.generos.upsert({
      where: { codigo: g.codigo },
      update: { descripcion: g.descripcion },
      create: g,
    });
  }

  const estadosCiviles = [
    { codigo: "SOLTERO", descripcion: "Soltero(a)" },
    { codigo: "CASADO", descripcion: "Casado(a)" },
    { codigo: "UNION_LB", descripcion: "Unión libre" },
    { codigo: "DIVORCIADO", descripcion: "Divorciado(a)" },
    { codigo: "VIUDO", descripcion: "Viudo(a)" },
    { codigo: "OTRO", descripcion: "Otro" },
  ];

  for (const ec of estadosCiviles) {
    await prisma.estados_civiles.upsert({
      where: { codigo: ec.codigo },
      update: { descripcion: ec.descripcion },
      create: ec,
    });
  }

  const tiposUsuario = [
    { codigo: "ESTUDIANTE", descripcion: "Estudiante" },
    { codigo: "ESTUDIANTE_PTA", descripcion: "Estudiante PTA" },
    { codigo: "PROFESOR", descripcion: "Profesor" },
    { codigo: "ADMINISTRATIVO", descripcion: "Administrativo" },
    { codigo: "EGRESADO", descripcion: "Egresado" },
    { codigo: "EXTERNO", descripcion: "Usuario externo" },
  ];

  for (const tu of tiposUsuario) {
    await prisma.tipos_usuario.upsert({
      where: { codigo: tu.codigo },
      update: { descripcion: tu.descripcion },
      create: tu,
    });
  }

  const sedes = [
    { nombre: "Neiva", ciudad: "Neiva", departamento: "Huila" },
    { nombre: "Pitalito", ciudad: "Pitalito", departamento: "Huila" },
    { nombre: "Prado Alto", ciudad: "Neiva", departamento: "Huila" },
  ];

  for (const s of sedes) {
    await upsertByNombreField(
      prisma.sedes,
      { nombre: s.nombre },
      s,
      { ciudad: s.ciudad, departamento: s.departamento },
    );
  }

  const epsList = [
    { nombre: "Nueva EPS", nit: null },
    { nombre: "Sanitas EPS", nit: null },
    { nombre: "Coomeva EPS", nit: null },
    { nombre: "Sura EPS", nit: null },
    { nombre: "Compensar EPS", nit: null },
  ];

  for (const e of epsList) {
    await upsertByNombreField(
      prisma.eps,
      { nombre: e.nombre },
      e,
      { nit: e.nit },
    );
  }

  const programas = [
    // Programas académicos (ESTUDIANTE)
    { nombre: "ADMINISTRACION BANCARIA Y FINANCIERA", codigo: "30", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ADMINISTRACION BANCARIA Y FINANCIERA-PITALITO", codigo: "31", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ADMINISTRACION COMERCIAL", codigo: "60", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ADMINISTRACION COMERCIAL-PITALITO", codigo: "61", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ADMINISTRACION DE EMPRESAS AGROPECUARIAS", codigo: "10", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ADMINISTRACION DE EMPRESAS AGROPECUARIAS-PITALITO", codigo: "16", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ADMINISTRACION DE EMPRESAS TURISTICAS", codigo: "15", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ADMINISTRACIÓN DE EMPRESAS TURÍSTICAS - Virtual", codigo: "27", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ADMINISTRACIÓN FINANCIERA Y BURSÁTIL", codigo: "32", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ADMINISTRACIÓN FINANCIERA Y BURSÁTIL - PITALITO", codigo: "33", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ADMINISTRACION TURISTICA", codigo: "11", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ELECTIVA", codigo: "ELTVA", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN ARQUITECTURA DE SOFTWARE - Virtual", codigo: "56", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN BIG DATA Y ANALÍTICA DE DATOS - Virtual", codigo: "36", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN CIBERSEGURIDAD - Virtual", codigo: "73", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN GERENCIA DE EMPRESAS", codigo: "13", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN GERENCIA DE SISTEMAS INTEGRADOS DE CALIDAD", codigo: "14", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN GERENCIA LOGÍSTICA Y CADENAS DE SUMINISTRO", codigo: "22", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN GESTIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO", codigo: "18", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN GESTIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO - Virtual", codigo: "74", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN HIDROINFORMÁTICA - Presencial", codigo: "25", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN HIDROINFORMÁTICA - Virtual", codigo: "26", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN INGENIERÍA DE SOFTWARE - Virtual", codigo: "34", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN INTELIGENCIA ARTIFICIAL - Virtual", codigo: "35", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN MACHINE LEARNING PARA INTERNET DE LAS COSAS (IoT) - Virtual", codigo: "29", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN MARKETING DIGITAL - Virtual", codigo: "28", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN SANIDAD Y PRODUCCIÓN DE PECES DE AGUAS CONTINENTALES", codigo: "37", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN SANIDAD Y PRODUCCIÓN DE PECES DE AGUAS CONTINENTALES", codigo: "21", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ESPECIALIZACIÓN EN SISTEMAS INTEGRADOS DE GESTIÓN - Virtual", codigo: "24", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "INGENIERÍA AGRONÓMICA", codigo: "38", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "INGENIERÍA AGRONÓMICA - PITALITO", codigo: "55", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "INGENIERIA AMBIENTAL", codigo: "80", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "INGENIERIA DE SISTEMAS", codigo: "90", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "INGENIERÍA DE SISTEMAS - PITALITO", codigo: "91", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "INGENIERÍA DE SOFTWARE - Hibrida", codigo: "58", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "INGENIERÍA DE SOFTWARE - Virtual", codigo: "57", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "INGENIERIA EN ENERGIAS RENOVABLES", codigo: "19", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "INGENIERÍA EN INTELIGENCIA ARTIFICIAL - Híbrida", codigo: "72", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "INGENIERÍA EN INTELIGENCIA ARTIFICIAL - Virtual", codigo: "71", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "INGENIERIA INDUSTRIAL", codigo: "40", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "INGENIERIA INDUSTRIAL-PITALITO", codigo: "41", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "INGENIERIA MECATRONICA", codigo: "17", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "INTERCAMBIO INSTITUCIONAL", codigo: "OU", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "MEDICINA VETERINARIA Y ZOOTECNIA", codigo: "50", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "MEDICINA VETERINARIA Y ZOOTECNIA-PITALITO", codigo: "51", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "MERCADEO, PUBLICIDAD Y VENTAS", codigo: "70", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "MERCADEO Y PUBLICIDAD", codigo: "23", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "NEGOCIOS INTERNACIONALES", codigo: "12", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "ZOOTECNIA", codigo: "20", tipo_poblacion: "ESTUDIANTE" },

    // Áreas administrativas (ADMIN)
    { nombre: "INFORMACION - VENTANILLA UNICA - CONTACTO", codigo: "AREA_001", tipo_poblacion: "ADMIN" },
    { nombre: "ADMINISTRADOR DE SEDE", codigo: "AREA_002", tipo_poblacion: "ADMIN" },
    { nombre: "ADMISIONES", codigo: "AREA_003", tipo_poblacion: "ADMIN" },
    { nombre: "GESTIÓN DOCUMENTAL - ARCHIVO", codigo: "AREA_004", tipo_poblacion: "ADMIN" },
    { nombre: "BIBLIOTECA", codigo: "AREA_005", tipo_poblacion: "ADMIN" },
    { nombre: "BIENESTAR - QUIRINAL", codigo: "AREA_006", tipo_poblacion: "ADMIN" },
    { nombre: "BIENESTAR - PSICOLOGIA", codigo: "AREA_007", tipo_poblacion: "ADMIN" },
    { nombre: "BIENESTAR - CONSULTORIO MEDICO", codigo: "AREA_008", tipo_poblacion: "ADMIN" },
    { nombre: "CTel", codigo: "AREA_009", tipo_poblacion: "ADMIN" },
    { nombre: "CLINICA VETERINARIA", codigo: "AREA_010", tipo_poblacion: "ADMIN" },
    { nombre: "COMPRAS BIENES Y SERVICIOS", codigo: "AREA_011", tipo_poblacion: "ADMIN" },
    { nombre: "CONTABILIDAD", codigo: "AREA_012", tipo_poblacion: "ADMIN" },
    { nombre: "CONTROL INTERNO", codigo: "AREA_013", tipo_poblacion: "ADMIN" },
    { nombre: "CORPORACION CULTURAL JOSE EUSTASIO RIVERA", codigo: "AREA_014", tipo_poblacion: "ADMIN" },
    { nombre: "DERECHOS PECUNIARIOS", codigo: "AREA_015", tipo_poblacion: "ADMIN" },
    { nombre: "AMBIENTES VIRTUALES DAVA", codigo: "AREA_016", tipo_poblacion: "ADMIN" },
    { nombre: "DIRECCIÓN DE CURRÍCULO", codigo: "AREA_017", tipo_poblacion: "ADMIN" },
    { nombre: "FACULTAD DE CIENCIAS ECONÓMICAS Y ADMINISTRATIVAS", codigo: "AREA_018", tipo_poblacion: "ADMIN" },
    { nombre: "FACULTAD DE MEDICINA VETERINARIA Y CIENCIAS AFINES", codigo: "AREA_019", tipo_poblacion: "ADMIN" },
    { nombre: "FACULTAD DE INGENIERIAS", codigo: "AREA_020", tipo_poblacion: "ADMIN" },
    { nombre: "SECRETRARIA DECANATURA INGENIERIA", codigo: "AREA_021", tipo_poblacion: "ADMIN" },
    { nombre: "GESTION DE TIC E INNOVACIÓN TECNOLOGICA", codigo: "AREA_022", tipo_poblacion: "ADMIN" },
    { nombre: "INSCRIPCIONES - MERCADEO", codigo: "AREA_023", tipo_poblacion: "ADMIN" },
    { nombre: "OFICINA DE COMUNICACIONES", codigo: "AREA_024", tipo_poblacion: "ADMIN" },
    { nombre: "PERSONAL Y TALENTO HUMANO", codigo: "AREA_025", tipo_poblacion: "ADMIN" },
    { nombre: "PLANEACIÓN", codigo: "AREA_026", tipo_poblacion: "ADMIN" },
    { nombre: "EGRESADOS", codigo: "AREA_027", tipo_poblacion: "ADMIN" },
    { nombre: "BOLSA DE EMPLEO", codigo: "AREA_028", tipo_poblacion: "ADMIN" },
    { nombre: "EMPRENDIMIENTO", codigo: "AREA_029", tipo_poblacion: "ADMIN" },
    { nombre: "SIG - CALIDAD", codigo: "AREA_030", tipo_poblacion: "ADMIN" },
    { nombre: "SEGURIDAD Y SALUD EN EL TRABAJO", codigo: "AREA_031", tipo_poblacion: "ADMIN" },
    { nombre: "PORTERIA QUIRINAL", codigo: "AREA_032", tipo_poblacion: "ADMIN" },
    { nombre: "PORTERIA PRADO ALTO", codigo: "AREA_033", tipo_poblacion: "ADMIN" },
    { nombre: "PRESUPUESTO", codigo: "AREA_034", tipo_poblacion: "ADMIN" },
    { nombre: "PROG. ADMON COMERCIAL", codigo: "AREA_035", tipo_poblacion: "ADMIN" },
    { nombre: "ADMINISTRACIÓN FINANCIERA Y BURSÁTIL", codigo: "AREA_036", tipo_poblacion: "ADMIN" },
    { nombre: "PROGRAMA ADMINISTRACIÓN DE EMPRESAS TURÍSTICAS", codigo: "AREA_037", tipo_poblacion: "ADMIN" },
    { nombre: "PROGRAMA MERCADEO, PUBLICIDAD Y VENTAS", codigo: "AREA_038", tipo_poblacion: "ADMIN" },
    { nombre: "PROGRAMA NEGOCIOS INTERNACIONALES", codigo: "AREA_039", tipo_poblacion: "ADMIN" },
    { nombre: "RECTORIA", codigo: "AREA_040", tipo_poblacion: "ADMIN" },
    { nombre: "REGISTRO Y CONTROL", codigo: "AREA_041", tipo_poblacion: "ADMIN" },
    { nombre: "SALA DE DOCENTES BLOQUE B - QUIRINAL", codigo: "AREA_042", tipo_poblacion: "ADMIN" },
    { nombre: "SALA DE DOCENTES BLOQUE C - QUIRINAL", codigo: "AREA_043", tipo_poblacion: "ADMIN" },
    { nombre: "SALA DE DOCENTES BLOQUE B - PRADO ALTO", codigo: "AREA_044", tipo_poblacion: "ADMIN" },
    { nombre: "SECRETARÍA GENERAL", codigo: "AREA_045", tipo_poblacion: "ADMIN" },
    { nombre: "TESORERIA", codigo: "AREA_046", tipo_poblacion: "ADMIN" },
    { nombre: "VICERRECTORIA ACADEMICA", codigo: "AREA_047", tipo_poblacion: "ADMIN" },
    { nombre: "VICERRECTORIA ADMINISTRATIVA", codigo: "AREA_048", tipo_poblacion: "ADMIN" },
    { nombre: "EXTENSIÓN Y PROYECCION SOCIAL", codigo: "AREA_049", tipo_poblacion: "ADMIN" },
    { nombre: "DEPARTAMENTO DE LENGUAS MODERNAS", codigo: "AREA_050", tipo_poblacion: "ADMIN" },
    { nombre: "ORI - OFICINA DE RELACIONES INTERNAC.", codigo: "AREA_051", tipo_poblacion: "ADMIN" },
    { nombre: "LABORATORIO REPRODUCCIÓN", codigo: "AREA_052", tipo_poblacion: "ADMIN" },
    { nombre: "LABORATORIO BIOTECNOLOGÍA SANITARIA", codigo: "AREA_053", tipo_poblacion: "ADMIN" },
    { nombre: "LABORATORIO AGROAMBIENTAL - RECEPCIÓN", codigo: "AREA_054", tipo_poblacion: "ADMIN" },
    { nombre: "LABORATORIO AGROAMBIENTAL- AGUAS", codigo: "AREA_055", tipo_poblacion: "ADMIN" },
    { nombre: "LABORATORIO AGROAMBIENTAL - SUELOS", codigo: "AREA_056", tipo_poblacion: "ADMIN" },
    { nombre: "PROGRAMA INGENIERÍA AMBIENTAL", codigo: "AREA_057", tipo_poblacion: "ADMIN" },
    { nombre: "PROGRAMA INGENIERÍA EN ENERGÍAS RENOVABLES", codigo: "AREA_058", tipo_poblacion: "ADMIN" },
    { nombre: "PROGRAMA INGENIERÍA INDUSTRIAL", codigo: "AREA_059", tipo_poblacion: "ADMIN" },
    { nombre: "PROGRAMA INGENIERÍA MECATRÓNICA", codigo: "AREA_060", tipo_poblacion: "ADMIN" },
    { nombre: "PROGRAMA INGENIERÍA DE SISTEMAS", codigo: "AREA_061", tipo_poblacion: "ADMIN" },
  ];

  for (const p of programas) {
    await prisma.programas_academicos.upsert({
      where: { codigo: p.codigo },
      update: { nombre: p.nombre, tipo_poblacion: p.tipo_poblacion },
      create: p,
    });
  }

  const tiposSangre = [
    { codigo: "O+", descripcion: "O positivo" },
    { codigo: "O-", descripcion: "O negativo" },
    { codigo: "A+", descripcion: "A positivo" },
    { codigo: "A-", descripcion: "A negativo" },
    { codigo: "B+", descripcion: "B positivo" },
    { codigo: "B-", descripcion: "B negativo" },
    { codigo: "AB+", descripcion: "AB positivo" },
    { codigo: "AB-", descripcion: "AB negativo" },
  ];

  for (const ts of tiposSangre) {
    await prisma.tipos_sangre.upsert({
      where: { codigo: ts.codigo },
      update: { descripcion: ts.descripcion },
      create: ts,
    });
  }

  const cie10Items = [
    {
      codigo: "A000",
      nombre: "COLERA DEBIDO A VIBRIO CHOLERAE 01, BIOTIPO CHOLERAE",
      descripcion: "COLERA",
      activo: true,
    },
    {
      codigo: "A001",
      nombre: "COLERA DEBIDO A VIBRIO CHOLERAE 01, BIOTIPO EL TOR",
      descripcion: "COLERA",
      activo: true,
    },
    {
      codigo: "A009",
      nombre: "COLERA, NO ESPECIFICADO",
      descripcion: "COLERA",
      activo: true,
    },
    {
      codigo: "A010",
      nombre: "FIEBRE TIFOIDEA",
      descripcion: "FIEBRES TIFOIDEA Y PARATIFOIDEA",
      activo: true,
    },
  ];

  for (const item of cie10Items) {
    await prisma.cie10.upsert({
      where: { codigo: item.codigo },
      update: {
        nombre: item.nombre,
        descripcion: item.descripcion,
        activo: item.activo,
      },
      create: item,
    });
  }

  const especialidades = [
    { nombre: "Medicina General", descripcion: "Médico general" },
    { nombre: "Medicina Familiar", descripcion: "Médico familiar" },
    { nombre: "Enfermería", descripcion: "Profesional de enfermería" },
    { nombre: "Psicología", descripcion: "Profesional en psicología" },
  ];

  for (const esp of especialidades) {
    await upsertByNombreField(
      prisma.especialidades,
      { nombre: esp.nombre },
      esp,
      { descripcion: esp.descripcion },
    );
  }

  const programasSalud = [
    { nombre: "Programa Transversal", descripcion: null, activo: true },
    { nombre: "Consulta del joven", descripcion: null, activo: true },
    { nombre: "Riesgo Cardiovascular", descripcion: null, activo: true },
  ];

  for (const p of programasSalud) {
    await upsertByNombreField(
      prisma.programas_salud,
      { nombre: p.nombre },
      p,
      { descripcion: p.descripcion, activo: true },
    );
  }

  const modalidades = [
    { codigo: "PRESENCIAL", descripcion: "Atención presencial" },
    { codigo: "TELEORIENTACION", descripcion: "Teleorientación" },
  ];

  for (const m of modalidades) {
    await prisma.modalidades_atencion.upsert({
      where: { codigo: m.codigo },
      update: { descripcion: m.descripcion },
      create: m,
    });
  }

  const estadosCita = [
    { codigo: "PROGRAMADA", descripcion: "Programada" },
    { codigo: "REALIZADA", descripcion: "Realizada" },
    { codigo: "CANCELADA_INST", descripcion: "Cancelada por la institución" },
    { codigo: "CANCELADA_PAC", descripcion: "Cancelada por el paciente" },
    { codigo: "NO_ASISTE", descripcion: "Paciente no asiste" },
  ];

  for (const ec of estadosCita) {
    await prisma.estados_cita.upsert({
      where: { codigo: ec.codigo },
      update: { descripcion: ec.descripcion },
      create: ec,
    });
  }

  const tiposConfirmacionDx = [
    { codigo: "CN", descripcion: "Confirmado Nuevo" },
    { codigo: "CR", descripcion: "Confirmado Repetido" },
    { codigo: "ID", descripcion: "Impresión Diagnóstica" },
  ];

  for (const t of tiposConfirmacionDx) {
    await prisma.tipos_confirmacion_diagnostico.upsert({
      where: { codigo: t.codigo },
      update: { descripcion: t.descripcion },
      create: t,
    });
  }

  const tiposCita = [
    { codigo: "INGRESO", descripcion: "Ingreso" },
    { codigo: "ENF_GENERAL", descripcion: "Enfermedad general" },
    { codigo: "PCC", descripcion: "Programa Condiciones Cronicas" },
    { codigo: "VGRG", descripcion: "Valoracion Grupos Representativos y Gimnasio" },
    { codigo: "ANTICON", descripcion: "Anticoncepcion" },
    { codigo: "SERV_CUID", descripcion: "Servicios y Cuidados Generales" },
  ];

  for (const tc of tiposCita) {
    await prisma.tipos_cita.upsert({
      where: { codigo: tc.codigo },
      update: { descripcion: tc.descripcion },
      create: tc,
    });
  }

  const tiposAtencion = [
    { id_tipo_atencion: 1, codigo: "INGRESO", descripcion: "Ingreso" },
    { id_tipo_atencion: 2, codigo: "ENF_GENERAL", descripcion: "Enfermedad general" },
    { id_tipo_atencion: 3, codigo: "PCC", descripcion: "Programa Condiciones Cronicas" },
    {
      id_tipo_atencion: 4,
      codigo: "VGRG",
      descripcion: "Valoracion Grupos Representativos y Gimnasio",
    },
    { id_tipo_atencion: 5, codigo: "ANTICON", descripcion: "Anticoncepcion" },
    { id_tipo_atencion: 6, codigo: "SERV_CUID", descripcion: "Servicios y Cuidados Generales" },
  ];

  for (const ta of tiposAtencion) {
    const existing = await prisma.tipos_atencion.findUnique({
      where: { codigo: ta.codigo },
      select: { id_tipo_atencion: true },
    });

    if (existing) {
      await prisma.tipos_atencion.update({
        where: { id_tipo_atencion: existing.id_tipo_atencion },
        data: { descripcion: ta.descripcion },
      });
    } else {
      await prisma.tipos_atencion.create({
        data: {
          id_tipo_atencion: ta.id_tipo_atencion,
          codigo: ta.codigo,
          descripcion: ta.descripcion,
        },
      });
    }
  }

  const tiposHistoria = [
    {
      codigo: "REG_ATENCION_SALUD",
      descripcion: "Registro de atención de salud",
    },
    {
      codigo: "HC_CONSULTA_EXTERNA",
      descripcion: "Historia clínica de consulta externa",
    },
  ];

  for (const th of tiposHistoria) {
    await prisma.tipos_historia_clinica.upsert({
      where: { codigo: th.codigo },
      update: { descripcion: th.descripcion },
      create: {
        codigo: th.codigo,
        descripcion: th.descripcion,
      },
    });
  }

  const allowed = await prisma.tipos_historia_clinica.findMany({
    where: {
      codigo: {
        in: tiposHistoria.map((t) => t.codigo),
      },
    },
    select: { id_tipo_historia: true, codigo: true },
  });

  const allowedIds = allowed.map((t) => t.id_tipo_historia);
  const consultaExternaId =
    allowed.find((t) => t.codigo === "HC_CONSULTA_EXTERNA")?.id_tipo_historia ?? null;

  if (consultaExternaId != null && allowedIds.length > 0) {
    await prisma.historias_clinicas.updateMany({
      where: {
        id_tipo_historia: {
          notIn: allowedIds,
        },
      },
      data: {
        id_tipo_historia: consultaExternaId,
      },
    });
  }

  await prisma.tipos_historia_clinica.deleteMany({
    where: {
      codigo: {
        notIn: tiposHistoria.map((t) => t.codigo),
      },
    },
  });

  const departamentos = [
    { nombre: "Amazonas", codigo_dane: "91" },
    { nombre: "Antioquia", codigo_dane: "05" },
    { nombre: "Arauca", codigo_dane: "81" },
    { nombre: "Atlántico", codigo_dane: "08" },
    { nombre: "Bogotá D.C.", codigo_dane: "11" },
    { nombre: "Bolívar", codigo_dane: "13" },
    { nombre: "Boyacá", codigo_dane: "15" },
    { nombre: "Caldas", codigo_dane: "17" },
    { nombre: "Caquetá", codigo_dane: "18" },
    { nombre: "Casanare", codigo_dane: "85" },
    { nombre: "Cauca", codigo_dane: "19" },
    { nombre: "Cesar", codigo_dane: "20" },
    { nombre: "Chocó", codigo_dane: "27" },
    { nombre: "Córdoba", codigo_dane: "23" },
    { nombre: "Cundinamarca", codigo_dane: "25" },
    { nombre: "Guainía", codigo_dane: "94" },
    { nombre: "Guaviare", codigo_dane: "95" },
    { nombre: "Huila", codigo_dane: "41" },
    { nombre: "La Guajira", codigo_dane: "44" },
    { nombre: "Magdalena", codigo_dane: "47" },
    { nombre: "Meta", codigo_dane: "50" },
    { nombre: "Nariño", codigo_dane: "52" },
    { nombre: "Norte de Santander", codigo_dane: "54" },
    { nombre: "Putumayo", codigo_dane: "86" },
    { nombre: "Quindío", codigo_dane: "63" },
    { nombre: "Risaralda", codigo_dane: "66" },
    { nombre: "San Andrés y Providencia", codigo_dane: "88" },
    { nombre: "Santander", codigo_dane: "68" },
    { nombre: "Sucre", codigo_dane: "70" },
    { nombre: "Tolima", codigo_dane: "73" },
    { nombre: "Valle del Cauca", codigo_dane: "76" },
    { nombre: "Vaupés", codigo_dane: "97" },
    { nombre: "Vichada", codigo_dane: "99" },
  ];

  for (const d of departamentos) {
    await prisma.departamentos.upsert({
      where: { nombre: d.nombre },
      update: { codigo_dane: d.codigo_dane },
      create: d,
    });
  }

  const depRows = await prisma.departamentos.findMany({
    where: { nombre: { in: departamentos.map((d) => d.nombre) } },
    select: { id_departamento: true, nombre: true },
  });
  const depIdByName = Object.fromEntries(depRows.map((d) => [d.nombre, d.id_departamento]));

  const ciudadesByDepartamento = {
    "Amazonas": [
      { nombre: "Leticia", codigo_dane: "91001" },
      { nombre: "Puerto Nariño", codigo_dane: "91545" },
      { nombre: "El Encanto", codigo_dane: "91288" },
      { nombre: "La Pedrera", codigo_dane: "91401" },
      { nombre: "Tarapacá", codigo_dane: "91775" },
    ],
    "Antioquia": [
      { nombre: "Medellín", codigo_dane: "05001" },
      { nombre: "Envigado", codigo_dane: "05266" },
      { nombre: "Bello", codigo_dane: "05088" },
      { nombre: "Itagüí", codigo_dane: "05360" },
      { nombre: "Rionegro", codigo_dane: "05631" },
      { nombre: "Apartadó", codigo_dane: "05035" },
      { nombre: "Turbo", codigo_dane: "05800" },
      { nombre: "Caucasia", codigo_dane: "05135" },
      { nombre: "Santa Rosa de Osos", codigo_dane: "05699" },
      { nombre: "Santafé de Antioquia", codigo_dane: "05680" },
      { nombre: "Jardín", codigo_dane: "05368" },
      { nombre: "Andes", codigo_dane: "05029" },
      { nombre: "Urrao", codigo_dane: "05782" },
      { nombre: "Yarumal", codigo_dane: "05890" },
      { nombre: "Chigorodó", codigo_dane: "05186" },
    ],
    "Arauca": [
      { nombre: "Arauca", codigo_dane: "81001" },
      { nombre: "Arauquita", codigo_dane: "81078" },
      { nombre: "Saravena", codigo_dane: "81747" },
      { nombre: "Tame", codigo_dane: "81800" },
      { nombre: "Fortul", codigo_dane: "81278" },
    ],
    "Atlántico": [
      { nombre: "Barranquilla", codigo_dane: "08001" },
      { nombre: "Soledad", codigo_dane: "08757" },
      { nombre: "Malambo", codigo_dane: "08452" },
      { nombre: "Baranoa", codigo_dane: "08030" },
      { nombre: "Sabanalarga", codigo_dane: "08697" },
      { nombre: "Santo Tomás", codigo_dane: "08715" },
      { nombre: "Galapa", codigo_dane: "08329" },
      { nombre: "Puerto Colombia", codigo_dane: "08636" },
    ],
    "Bogotá D.C.": [{ nombre: "Bogotá", codigo_dane: "11001" }],
    "Bolívar": [
      { nombre: "Cartagena", codigo_dane: "13001" },
      { nombre: "Magangué", codigo_dane: "13470" },
      { nombre: "Turbaco", codigo_dane: "13850" },
      { nombre: "Arjona", codigo_dane: "13052" },
      { nombre: "María La Baja", codigo_dane: "13487" },
      { nombre: "Carmen de Bolívar", codigo_dane: "13170" },
      { nombre: "San Juan Nepomuceno", codigo_dane: "13688" },
      { nombre: "El Carmen de Bolívar", codigo_dane: "13170" },
      { nombre: "Mompós", codigo_dane: "13540" },
      { nombre: "Tiquisio", codigo_dane: "13838" },
    ],
    "Boyacá": [
      { nombre: "Tunja", codigo_dane: "15001" },
      { nombre: "Duitama", codigo_dane: "15248" },
      { nombre: "Sogamoso", codigo_dane: "15760" },
      { nombre: "Chiquinquirá", codigo_dane: "15174" },
      { nombre: "Paipa", codigo_dane: "15593" },
      { nombre: "Villa de Leyva", codigo_dane: "15892" },
      { nombre: "Puerto Boyacá", codigo_dane: "15638" },
      { nombre: "Togüí", codigo_dane: "15815" },
      { nombre: "Moniquirá", codigo_dane: "15457" },
      { nombre: "Chivatá", codigo_dane: "15189" },
    ],
    "Caldas": [
      { nombre: "Manizales", codigo_dane: "17001" },
      { nombre: "La Dorada", codigo_dane: "17377" },
      { nombre: "Chinchiná", codigo_dane: "17188" },
      { nombre: "Villamaría", codigo_dane: "17894" },
      { nombre: "Salamina", codigo_dane: "17672" },
      { nombre: "Riosucio", codigo_dane: "17600" },
      { nombre: "Pereira", codigo_dane: "66001" },
      { nombre: "Dosquebradas", codigo_dane: "66170" },
    ],
    "Caquetá": [
      { nombre: "Florencia", codigo_dane: "18001" },
      { nombre: "San Vicente del Caguán", codigo_dane: "18760" },
      { nombre: "Morelia", codigo_dane: "18500" },
      { nombre: "La Montañita", codigo_dane: "18430" },
      { nombre: "Belén de los Andaquíes", codigo_dane: "18110" },
    ],
    "Casanare": [
      { nombre: "Yopal", codigo_dane: "85001" },
      { nombre: "Villanueva", codigo_dane: "85857" },
      { nombre: "Pore", codigo_dane: "85610" },
      { nombre: "Aguazul", codigo_dane: "85047" },
      { nombre: "Tauramena", codigo_dane: "85795" },
      { nombre: "Monterrey", codigo_dane: "85470" },
    ],
    "Cauca": [
      { nombre: "Popayán", codigo_dane: "19001" },
      { nombre: "Santander de Quilichao", codigo_dane: "19768" },
      { nombre: "Puerto Tejada", codigo_dane: "19655" },
      { nombre: "Guapi", codigo_dane: "19315" },
      { nombre: "Piendamó", codigo_dane: "19572" },
      { nombre: "Cajibío", codigo_dane: "19128" },
      { nombre: "Morales", codigo_dane: "19500" },
      { nombre: "Silvia", codigo_dane: "19722" },
    ],
    "Cesar": [
      { nombre: "Valledupar", codigo_dane: "20001" },
      { nombre: "Aguachica", codigo_dane: "20037" },
      { nombre: "Becerril", codigo_dane: "20096" },
      { nombre: "Pueblo Bello", codigo_dane: "20580" },
      { nombre: "La Gloria", codigo_dane: "20370" },
      { nombre: "Codazzi", codigo_dane: "20180" },
      { nombre: "Curumaní", codigo_dane: "20250" },
    ],
    "Chocó": [
      { nombre: "Quibdó", codigo_dane: "27001" },
      { nombre: "Nuquí", codigo_dane: "27580" },
      { nombre: "Bojayá", codigo_dane: "27140" },
      { nombre: "Istmina", codigo_dane: "27360" },
      { nombre: "Condoto", codigo_dane: "27210" },
      { nombre: "Riosucio", codigo_dane: "27600" },
      { nombre: "Bagadó", codigo_dane: "27045" },
    ],
    "Córdoba": [
      { nombre: "Montería", codigo_dane: "23001" },
      { nombre: "Lorica", codigo_dane: "23480" },
      { nombre: "Cereté", codigo_dane: "23200" },
      { nombre: "Sahagún", codigo_dane: "23670" },
      { nombre: "Planeta Rica", codigo_dane: "23550" },
      { nombre: "Tierralta", codigo_dane: "23860" },
      { nombre: "Momil", codigo_dane: "23490" },
      { nombre: "Purísima", codigo_dane: "23600" },
      { nombre: "San Pelayo", codigo_dane: "23695" },
      { nombre: "Ciénaga de Oro", codigo_dane: "23170" },
    ],
    "Cundinamarca": [
      { nombre: "Soacha", codigo_dane: "25754" },
      { nombre: "Chía", codigo_dane: "25175" },
      { nombre: "Zipaquirá", codigo_dane: "25899" },
      { nombre: "Facatativá", codigo_dane: "25258" },
      { nombre: "Girardot", codigo_dane: "25317" },
      { nombre: "Madrid", codigo_dane: "25430" },
      { nombre: "Cajicá", codigo_dane: "25122" },
      { nombre: "Funza", codigo_dane: "25290" },
      { nombre: "Mosquera", codigo_dane: "25480" },
      { nombre: "Sibaté", codigo_dane: "25705" },
      { nombre: "Tocancipá", codigo_dane: "25835" },
      { nombre: "Guaduas", codigo_dane: "25328" },
      { nombre: "Villeta", codigo_dane: "25880" },
      { nombre: "Chocontá", codigo_dane: "25194" },
      { nombre: "Ubaté", codigo_dane: "25858" },
    ],
    "Guainía": [
      { nombre: "Inírida", codigo_dane: "94001" },
      { nombre: "Cumaribo", codigo_dane: "94235" },
      { nombre: "Barranco Minas", codigo_dane: "94077" },
    ],
    "Guaviare": [
      { nombre: "San José del Guaviare", codigo_dane: "95001" },
      { nombre: "Calamar", codigo_dane: "95120" },
      { nombre: "El Retorno", codigo_dane: "95220" },
      { nombre: "Miraflores", codigo_dane: "95470" },
    ],
    "Huila": [
      { nombre: "Neiva", codigo_dane: "41001" },
      { nombre: "Pitalito", codigo_dane: "41551" },
      { nombre: "Garzón", codigo_dane: "41298" },
      { nombre: "La Plata", codigo_dane: "41427" },
      { nombre: "Rivera", codigo_dane: "41650" },
      { nombre: "Campoalegre", codigo_dane: "41125" },
      { nombre: "Palermo", codigo_dane: "41550" },
      { nombre: "Yaguará", codigo_dane: "41950" },
      { nombre: "Aipe", codigo_dane: "41020" },
      { nombre: "Colombia", codigo_dane: "41195" },
      { nombre: "Timaná", codigo_dane: "41800" },
      { nombre: "Suaza", codigo_dane: "41755" },
      { nombre: "Acevedo", codigo_dane: "41001" },
      { nombre: "Algeciras", codigo_dane: "41035" },
      { nombre: "Baraya", codigo_dane: "41080" },
    ],
    "La Guajira": [
      { nombre: "Riohacha", codigo_dane: "44001" },
      { nombre: "Maicao", codigo_dane: "44530" },
      { nombre: "Manaure", codigo_dane: "44500" },
      { nombre: "Uribia", codigo_dane: "44850" },
      { nombre: "Fonseca", codigo_dane: "44280" },
      { nombre: "Albania", codigo_dane: "44020" },
      { nombre: "San Juan del Cesar", codigo_dane: "44700" },
      { nombre: "Dibulla", codigo_dane: "44200" },
      { nombre: "Barrancas", codigo_dane: "44070" },
      { nombre: "El Molino", codigo_dane: "44250" },
    ],
    "Magdalena": [
      { nombre: "Santa Marta", codigo_dane: "47001" },
      { nombre: "Ciénaga", codigo_dane: "47225" },
      { nombre: "Fundación", codigo_dane: "47290" },
      { nombre: "Aracataca", codigo_dane: "47060" },
      { nombre: "Zona Bananera", codigo_dane: "47300" },
      { nombre: "El Banco", codigo_dane: "47170" },
      { nombre: "Plato", codigo_dane: "47570" },
      { nombre: "Pivijay", codigo_dane: "47560" },
      { nombre: "Sabanas de San Ángel", codigo_dane: "47690" },
      { nombre: "Cerro de San Antonio", codigo_dane: "47195" },
    ],
    "Meta": [
      { nombre: "Villavicencio", codigo_dane: "50001" },
      { nombre: "Granada", codigo_dane: "50314" },
      { nombre: "Acacías", codigo_dane: "50004" },
      { nombre: "Castilla la Nueva", codigo_dane: "50155" },
      { nombre: "Puerto López", codigo_dane: "50600" },
      { nombre: "San Martín", codigo_dane: "50710" },
      { nombre: "Lejanías", codigo_dane: "50420" },
      { nombre: "La Macarena", codigo_dane: "50390" },
      { nombre: "Puerto Gaitán", codigo_dane: "50580" },
      { nombre: "Restrepo", codigo_dane: "50640" },
    ],
    "Nariño": [
      { nombre: "Pasto", codigo_dane: "52001" },
      { nombre: "Ipiales", codigo_dane: "52370" },
      { nombre: "Tumaco", codigo_dane: "52845" },
      { nombre: "Túquerres", codigo_dane: "52875" },
      { nombre: "Samaniego", codigo_dane: "52690" },
      { nombre: "Buesaco", codigo_dane: "52120" },
      { nombre: "El Tambo", codigo_dane: "52265" },
      { nombre: "La Florida", codigo_dane: "52365" },
      { nombre: "Chachagüí", codigo_dane: "52170" },
      { nombre: "Yacuanquer", codigo_dane: "52970" },
      { nombre: "Taminango", codigo_dane: "52795" },
      { nombre: "Mallama", codigo_dane: "52430" },
      { nombre: "Barbacoas", codigo_dane: "52070" },
      { nombre: "Mosquera", codigo_dane: "52510" },
      { nombre: "Sandoná", codigo_dane: "52700" },
    ],
    "Norte de Santander": [
      { nombre: "Cúcuta", codigo_dane: "54001" },
      { nombre: "Ocaña", codigo_dane: "54550" },
      { nombre: "Pamplona", codigo_dane: "54630" },
      { nombre: "Villa del Rosario", codigo_dane: "54890" },
      { nombre: "Los Patios", codigo_dane: "54450" },
      { nombre: "Tibú", codigo_dane: "54820" },
      { nombre: "El Zulia", codigo_dane: "54300" },
      { nombre: "Sardinata", codigo_dane: "54690" },
      { nombre: "Arboledas", codigo_dane: "54055" },
      { nombre: "Salazar", codigo_dane: "54700" },
      { nombre: "Chinácota", codigo_dane: "54190" },
      { nombre: "Abrego", codigo_dane: "54001" },
      { nombre: "Convención", codigo_dane: "54220" },
      { nombre: "Cúcuta", codigo_dane: "54001" },
      { nombre: "Hacarí", codigo_dane: "54330" },
    ],
    "Putumayo": [
      { nombre: "Mocoa", codigo_dane: "86001" },
      { nombre: "Puerto Asís", codigo_dane: "86550" },
      { nombre: "Villagarzón", codigo_dane: "86885" },
      { nombre: "Puerto Guzmán", codigo_dane: "86600" },
      { nombre: "Puerto Leguízamo", codigo_dane: "86650" },
      { nombre: "Santiago", codigo_dane: "86760" },
      { nombre: "San Francisco", codigo_dane: "86670" },
      { nombre: "Colón", codigo_dane: "86180" },
    ],
    "Quindío": [
      { nombre: "Armenia", codigo_dane: "63001" },
      { nombre: "Calarcá", codigo_dane: "63170" },
      { nombre: "Salento", codigo_dane: "63690" },
      { nombre: "La Tebaida", codigo_dane: "63390" },
      { nombre: "Montenegro", codigo_dane: "63490" },
      { nombre: "Circasia", codigo_dane: "63200" },
      { nombre: "Filandia", codigo_dane: "63270" },
      { nombre: "Pijao", codigo_dane: "63560" },
      { nombre: "Buenavista", codigo_dane: "63120" },
      { nombre: "Cordoba", codigo_dane: "63210" },
      { nombre: "Genova", codigo_dane: "63290" },
    ],
    "Risaralda": [
      { nombre: "Pereira", codigo_dane: "66001" },
      { nombre: "Dosquebradas", codigo_dane: "66170" },
      { nombre: "Santa Rosa de Cabal", codigo_dane: "66760" },
      { nombre: "La Celia", codigo_dane: "66390" },
      { nombre: "Balboa", codigo_dane: "66080" },
      { nombre: "Mistrató", codigo_dane: "66500" },
      { nombre: "Guática", codigo_dane: "66340" },
      { nombre: "Apía", codigo_dane: "66040" },
      { nombre: "Santuario", codigo_dane: "66770" },
      { nombre: "Quinchía", codigo_dane: "66620" },
      { nombre: "Pereira", codigo_dane: "66001" },
      { nombre: "Belén de Umbría", codigo_dane: "66100" },
    ],
    "San Andrés y Providencia": [
      { nombre: "San Andrés", codigo_dane: "88001" },
      { nombre: "Providencia", codigo_dane: "88570" },
    ],
    "Santander": [
      { nombre: "Bucaramanga", codigo_dane: "68001" },
      { nombre: "Floridablanca", codigo_dane: "68292" },
      { nombre: "Girón", codigo_dane: "68309" },
      { nombre: "Barrancabermeja", codigo_dane: "68369" },
      { nombre: "Piedecuesta", codigo_dane: "68590" },
      { nombre: "San Gil", codigo_dane: "68740" },
      { nombre: "Barichara", codigo_dane: "68070" },
      { nombre: "Málaga", codigo_dane: "68450" },
      { nombre: "Lebrija", codigo_dane: "68400" },
      { nombre: "Vélez", codigo_dane: "68890" },
      { nombre: "Socorro", codigo_dane: "68770" },
      { nombre: "San Vicente de Chucurí", codigo_dane: "68750" },
      { nombre: "California", codigo_dane: "68130" },
      { nombre: "Rionegro", codigo_dane: "68680" },
      { nombre: "Simacota", codigo_dane: "68720" },
    ],
    "Sucre": [
      { nombre: "Sincelejo", codigo_dane: "70001" },
      { nombre: "Corozal", codigo_dane: "70220" },
      { nombre: "Sampués", codigo_dane: "70670" },
      { nombre: "Chalán", codigo_dane: "70180" },
      { nombre: "Ovejas", codigo_dane: "70550" },
      { nombre: "Morroa", codigo_dane: "70480" },
      { nombre: "Coveñas", codigo_dane: "70220" },
      { nombre: "San Marcos", codigo_dane: "70695" },
      { nombre: "San Benito Abad", codigo_dane: "70650" },
      { nombre: "San Luis de Sincé", codigo_dane: "70700" },
      { nombre: "Palmito", codigo_dane: "70570" },
      { nombre: "Tolú", codigo_dane: "70840" },
      { nombre: "Tolú Viejo", codigo_dane: "70850" },
    ],
    "Tolima": [
      { nombre: "Ibagué", codigo_dane: "73001" },
      { nombre: "Espinal", codigo_dane: "73275" },
      { nombre: "Melgar", codigo_dane: "73460" },
      { nombre: "Girardot", codigo_dane: "73317" },
      { nombre: "Líbano", codigo_dane: "73420" },
      { nombre: "Mariquita", codigo_dane: "73450" },
      { nombre: "Honda", codigo_dane: "73350" },
      { nombre: "Chaparral", codigo_dane: "73180" },
      { nombre: "Rovira", codigo_dane: "73650" },
      { nombre: "Saldaña", codigo_dane: "73680" },
      { nombre: "Ambalema", codigo_dane: "73020" },
      { nombre: "Fresno", codigo_dane: "73290" },
      { nombre: "Murillo", codigo_dane: "73500" },
      { nombre: "Anzoátegui", codigo_dane: "73040" },
      { nombre: "Cajamarca", codigo_dane: "73120" },
    ],
    "Valle del Cauca": [
      { nombre: "Cali", codigo_dane: "76001" },
      { nombre: "Palmira", codigo_dane: "76520" },
      { nombre: "Buenaventura", codigo_dane: "76109" },
      { nombre: "Tuluá", codigo_dane: "76670" },
      { nombre: "Buga", codigo_dane: "76130" },
      { nombre: "Cartago", codigo_dane: "76190" },
      { nombre: "Roldanillo", codigo_dane: "76640" },
      { nombre: "Andalucía", codigo_dane: "76035" },
      { nombre: "Florida", codigo_dane: "76290" },
      { nombre: "Pradera", codigo_dane: "76580" },
      { nombre: "Jamundí", codigo_dane: "76360" },
      { nombre: "Yumbo", codigo_dane: "76920" },
      { nombre: "Candelaria", codigo_dane: "76170" },
      { nombre: "Ginebra", codigo_dane: "76320" },
      { nombre: "Guacarí", codigo_dane: "76340" },
    ],
    "Vaupés": [
      { nombre: "Mitú", codigo_dane: "97001" },
      { nombre: "Carurú", codigo_dane: "97160" },
      { nombre: "Taraira", codigo_dane: "97780" },
    ],
    "Vichada": [
      { nombre: "Puerto Carreño", codigo_dane: "99001" },
      { nombre: "La Primavera", codigo_dane: "99450" },
      { nombre: "Cumaribo", codigo_dane: "99235" },
      { nombre: "Santa Rosalía", codigo_dane: "99670" },
    ],
  };

  for (const [depNombre, ciudades] of Object.entries(ciudadesByDepartamento)) {
    const id_departamento = depIdByName[depNombre];
    if (!id_departamento) continue;

    for (const c of ciudades) {
      const existing = await prisma.ciudades.findUnique({
        where: {
          id_departamento_nombre: {
            id_departamento,
            nombre: c.nombre,
          },
        },
      });

      if (existing) {
        await prisma.ciudades.update({
          where: { id_ciudad: existing.id_ciudad },
          data: { codigo_dane: c.codigo_dane },
        });
      } else {
        await prisma.ciudades.create({
          data: {
            id_departamento,
            nombre: c.nombre,
            codigo_dane: c.codigo_dane,
          },
        });
      }
    }
  }

  console.log(
    "Seed completado: roles, permisos, roles_permisos, catálogos (documentos, géneros, estados civiles, tipos usuario, sedes, eps, programas, tipos sangre, especialidades, modalidades, estados_cita, tipos_cita, departamentos, ciudades)"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
