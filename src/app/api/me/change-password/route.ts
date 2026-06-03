import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const idUsuario = Number((session.user as any)?.id);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return NextResponse.json({ message: "ID de usuario inválido" }, { status: 400 });
    }

    const body = await request.json();
    const { current_password, new_password } = body ?? {};

    if (!current_password || typeof current_password !== "string" || current_password.length < 6) {
      return NextResponse.json(
        { message: "La contraseña actual es obligatoria y debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    if (!new_password || typeof new_password !== "string" || new_password.length < 6) {
      return NextResponse.json(
        { message: "La nueva contraseña es obligatoria y debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    if (current_password === new_password) {
      return NextResponse.json(
        { message: "La nueva contraseña debe ser diferente a la actual" },
        { status: 400 },
      );
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: idUsuario },
    });

    if (!usuario) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(current_password, usuario.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "La contraseña actual es incorrecta" },
        { status: 400 },
      );
    }

    // Actualizar contraseña
    const password_hash = await bcrypt.hash(new_password, 10);

    const updated = await prisma.usuarios.update({
      where: { id_usuario: idUsuario },
      data: {
        password_hash,
        password_reset_required: false,
      },
    });

    // Registrar en auditoría
    await prisma.auditoria.create({
      data: {
        id_usuario: idUsuario,
        tabla: "usuarios",
        id_registro: String(idUsuario),
        accion: "CHANGE_PASSWORD",
        detalle: `Cambio de contraseña por usuario ${usuario.username} (ID: ${idUsuario})`,
      },
    });

    return NextResponse.json({
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error changing password", error);
    return NextResponse.json(
      { message: "Error actualizando la contraseña" },
      { status: 500 },
    );
  }
}
