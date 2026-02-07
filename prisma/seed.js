const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { nombre: "super_admin", descripcion: "Super administrador del sistema" },
    { nombre: "medico", descripcion: "Profesional de salud" },
    { nombre: "administrativo", descripcion: "Usuario administrativo (agenda, pacientes)" },
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
        activo: true,
        id_rol: superAdminRoleId,
        password_hash: passwordHash,
      },
      create: {
        username: "admin",
        password_hash: passwordHash,
        nombre_completo: "Administrador",
        email: "tic@corhuila.edu.co",
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

  console.log("Seed completado: roles, permisos, roles_permisos");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
