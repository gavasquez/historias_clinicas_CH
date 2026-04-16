import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { UserListItem } from "@/types/users";

const PAGE_SIZE = 5;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const pageParam = searchParams.get("page");
    const page = Math.max(Number(pageParam) || 1, 1);
    const skip = (page - 1) * PAGE_SIZE;

    const where: Prisma.usuariosWhereInput = {
      id_rol: { not: 1 },
      ...(search
        ? {
            OR: [
              {
                nombre_completo: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.usuarios.findMany({
        where,
        orderBy: { nombre_completo: "asc" },
        skip,
        take: PAGE_SIZE,
        select: {
          id_usuario: true,
          username: true,
          nombre_completo: true,
          email: true,
          telefono: true,
          activo: true,
          fecha_creacion: true,
          roles: {
            select: {
              id_rol: true,
              nombre: true,
              descripcion: true,
            },
          },
          profesionales_salud: {
            select: {
              id_profesional: true,
            },
            take: 1,
          },
        },
      }),
      prisma.usuarios.count({ where }),
    ]);

    const data: UserListItem[] = users.map((u) => ({
      id_usuario: u.id_usuario,
      username: u.username,
      nombre_completo: u.nombre_completo,
      email: u.email,
      telefono: u.telefono,
      activo: u.activo,
      fecha_creacion: u.fecha_creacion.toISOString(),
      rol: u.roles
        ? {
            id_rol: u.roles.id_rol,
            nombre: u.roles.nombre,
            descripcion: u.roles.descripcion ?? null,
          }
        : null,
      profesional: u.profesionales_salud?.[0]
        ? { id_profesional: u.profesionales_salud[0].id_profesional }
        : null,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (error) {
    console.error("Error fetching users", error);
    return NextResponse.json(
      { message: "Error obteniendo usuarios" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      username,
      nombre_completo,
      email,
      telefono,
      password,
      id_rol,
      activo = true,
    } = body ?? {};

    if (!username || typeof username !== "string" || !username.trim()) {
      return NextResponse.json(
        { message: "El nombre de usuario es obligatorio." },
        { status: 400 },
      );
    }

    if (!nombre_completo || typeof nombre_completo !== "string" || !nombre_completo.trim()) {
      return NextResponse.json(
        { message: "El nombre completo es obligatorio." },
        { status: 400 },
      );
    }

    if (!telefono || typeof telefono !== "string" || !telefono.trim()) {
      return NextResponse.json(
        { message: "El teléfono es obligatorio." },
        { status: 400 },
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { message: "La contraseña es obligatoria y debe tener al menos 6 caracteres." },
        { status: 400 },
      );
    }

    if (!id_rol || typeof id_rol !== "number") {
      return NextResponse.json(
        { message: "El rol del usuario es obligatorio." },
        { status: 400 },
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    const created = await prisma.usuarios.create({
      data: {
        username: username.trim(),
        nombre_completo: nombre_completo.trim(),
        email: email && typeof email === "string" ? email.trim() : null,
        telefono: telefono.trim(),
        password_hash,
        id_rol,
        activo: Boolean(activo),
      },
    });

    return NextResponse.json(
      {
        id_usuario: created.id_usuario,
        nombre_completo: created.nombre_completo,
        email: created.email,
        telefono: created.telefono,
        activo: created.activo,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "Ya existe un usuario con el mismo nombre de usuario o email." },
        { status: 409 },
      );
    }

    console.error("Error creando usuario", error);
    return NextResponse.json(
      { message: "Error creando el usuario" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const id_usuario = idParam ? Number(idParam) : NaN;

    if (!idParam || Number.isNaN(id_usuario) || id_usuario <= 0) {
      return NextResponse.json(
        { message: "Debe especificar un id de usuario válido en la query (?id=)." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { nombre_completo, email, telefono, password, activo } = body ?? {};

    const data: Prisma.usuariosUpdateInput = {};

    if (typeof nombre_completo === "string" && nombre_completo.trim()) {
      data.nombre_completo = nombre_completo.trim();
    }

    if (typeof email === "string") {
      data.email = email.trim() || null;
    }

    if (typeof telefono === "string" && telefono.trim()) {
      data.telefono = telefono.trim();
    }

    if (typeof activo === "boolean") {
      data.activo = activo;
    }

    if (typeof password === "string" && password.length >= 6) {
      const password_hash = await bcrypt.hash(password, 10);
      data.password_hash = password_hash;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No se enviaron campos para actualizar." },
        { status: 400 },
      );
    }

    const updated = await prisma.usuarios.update({
      where: { id_usuario },
      data,
    });

    return NextResponse.json({
      id_usuario: updated.id_usuario,
      nombre_completo: updated.nombre_completo,
      email: updated.email,
      telefono: updated.telefono,
      activo: updated.activo,
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "Ya existe un usuario con el mismo nombre de usuario o email." },
        { status: 409 },
      );
    }

    console.error("Error actualizando usuario", error);
    return NextResponse.json(
      { message: "Error actualizando el usuario" },
      { status: 500 },
    );
  }
}
