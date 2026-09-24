import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, hasPermission, type AppSession } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

async function canAccessUser(
  request: NextRequest,
  targetUserId: number,
): Promise<{ allowed: true; session: AppSession } | { allowed: false; response: NextResponse }> {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) {
    return { allowed: false, response: session };
  }

  const currentUserId = Number(session.user.id);
  const isAdmin = await hasPermission(session.user.role, "ADMIN_USUARIOS");

  if (!isAdmin && currentUserId !== targetUserId) {
    return {
      allowed: false,
      response: NextResponse.json({ message: "No autorizado" }, { status: 403 }),
    };
  }

  return { allowed: true, session };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const resolvedParams = await (context.params as Promise<{ id: string }>);
    const id = Number(resolvedParams.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "ID de usuario inválido" }, { status: 400 });
    }

    const access = await canAccessUser(request, id);
    if (!access.allowed) return access.response;

    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: id },
      include: {
        roles: true,
        tipos_documento: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    const data = {
      id_usuario: usuario.id_usuario,
      username: usuario.username,
      nombre_completo: usuario.nombre_completo,
      email: usuario.email,
      telefono: usuario.telefono,
      id_tipo_documento: usuario.id_tipo_documento,
      numero_documento: usuario.numero_documento,
      activo: usuario.activo,
      password_reset_required: usuario.password_reset_required,
      rol: usuario.roles
        ? {
            id_rol: usuario.roles.id_rol,
            nombre: usuario.roles.nombre,
            descripcion: usuario.roles.descripcion ?? null,
          }
        : null,
      tipo_documento: usuario.tipos_documento
        ? {
            id_tipo_documento: usuario.tipos_documento.id_tipo_documento,
            codigo: usuario.tipos_documento.codigo,
            descripcion: usuario.tipos_documento.descripcion,
          }
        : null,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching user detail", error);
    return NextResponse.json(
      { message: "Error obteniendo detalle de usuario" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const resolvedParams = await (context.params as Promise<{ id: string }>);
    const id = Number(resolvedParams.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "ID de usuario inválido" }, { status: 400 });
    }

    const access = await canAccessUser(request, id);
    if (!access.allowed) return access.response;

    const isAdmin = await hasPermission(access.session.user.role, "ADMIN_USUARIOS");

    const body = await request.json();
    const {
      nombre_completo,
      email,
      telefono,
      id_tipo_documento,
      numero_documento,
      activo,
      password_reset_required,
    } = body ?? {};

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

    if (isAdmin && typeof activo === "boolean") {
      data.activo = activo;
    }

    if (isAdmin && typeof password_reset_required === "boolean") {
      data.password_reset_required = password_reset_required;
    }

    if (typeof id_tipo_documento === "number") {
      data.id_tipo_documento = id_tipo_documento > 0 ? id_tipo_documento : null;
    }

    if (typeof numero_documento === "string") {
      data.numero_documento = numero_documento.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No se enviaron campos para actualizar." },
        { status: 400 },
      );
    }

    const updated = await prisma.usuarios.update({
      where: { id_usuario: id },
      data,
      include: {
        roles: true,
        tipos_documento: true,
      },
    });

    const response = {
      id_usuario: updated.id_usuario,
      username: updated.username,
      nombre_completo: updated.nombre_completo,
      email: updated.email,
      telefono: updated.telefono,
      id_tipo_documento: updated.id_tipo_documento,
      numero_documento: updated.numero_documento,
      activo: updated.activo,
      password_reset_required: updated.password_reset_required,
      rol: updated.roles
        ? {
            id_rol: updated.roles.id_rol,
            nombre: updated.roles.nombre,
            descripcion: updated.roles.descripcion ?? null,
          }
        : null,
      tipo_documento: updated.tipos_documento
        ? {
            id_tipo_documento: updated.tipos_documento.id_tipo_documento,
            codigo: updated.tipos_documento.codigo,
            descripcion: updated.tipos_documento.descripcion,
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating user", error);
    return NextResponse.json(
      { message: "Error actualizando el usuario" },
      { status: 500 },
    );
  }
}
