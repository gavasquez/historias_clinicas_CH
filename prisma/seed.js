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
    { nombre: "Externo", codigo: "EXT_EXTERNO", tipo_poblacion: "EXTERNO" },

    { nombre: "Talento humano", codigo: "AREA_TALENTO_HUMANO", tipo_poblacion: "ADMIN" },
    { nombre: "Bienestar universitario", codigo: "AREA_BIENESTAR", tipo_poblacion: "ADMIN" },
    { nombre: "Admisiones y registro", codigo: "AREA_ADMISIONES", tipo_poblacion: "ADMIN" },

    { nombre: "Ingeniería de Sistemas", codigo: "PROG_ING_SIST", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "Ingeniería Industrial", codigo: "PROG_ING_IND", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "Administración de Empresas", codigo: "PROG_ADM_EMP", tipo_poblacion: "ESTUDIANTE" },
    { nombre: "Psicología", codigo: "PROG_PSICO", tipo_poblacion: "ESTUDIANTE" },
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
    { nombre: "Huila", codigo_dane: "41" },
    { nombre: "Cundinamarca", codigo_dane: "25" },
    { nombre: "Bogotá D.C.", codigo_dane: "11" },
    { nombre: "Antioquia", codigo_dane: "05" },
    { nombre: "Valle del Cauca", codigo_dane: "76" },
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
    "Huila": [
      { nombre: "Neiva", codigo_dane: "41001" },
      { nombre: "Pitalito", codigo_dane: "41551" },
      { nombre: "Garzón", codigo_dane: "41298" },
    ],
    "Cundinamarca": [
      { nombre: "Soacha", codigo_dane: "25754" },
      { nombre: "Chía", codigo_dane: "25175" },
      { nombre: "Zipaquirá", codigo_dane: "25899" },
    ],
    "Bogotá D.C.": [{ nombre: "Bogotá", codigo_dane: "11001" }],
    "Antioquia": [
      { nombre: "Medellín", codigo_dane: "05001" },
      { nombre: "Envigado", codigo_dane: "05266" },
      { nombre: "Bello", codigo_dane: "05088" },
    ],
    "Valle del Cauca": [
      { nombre: "Cali", codigo_dane: "76001" },
      { nombre: "Palmira", codigo_dane: "76520" },
      { nombre: "Buenaventura", codigo_dane: "76109" },
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
