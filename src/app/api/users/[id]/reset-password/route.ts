import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const auth = await requireRole(request, ["super_admin"]);
    if (auth instanceof NextResponse) return auth;

    const resolvedParams = await (context as any).params;
    const idUsuario = Number(resolvedParams.id);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return NextResponse.json({ message: "ID de usuario inválido" }, { status: 400 });
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: idUsuario },
      include: {
        tipos_documento: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    if (!usuario.numero_documento) {
      return NextResponse.json(
        { message: "El usuario no tiene número de documento registrado. No se puede restablecer la contraseña." },
        { status: 400 },
      );
    }

    // Establecer contraseña = número de documento
    const password_hash = await bcrypt.hash(usuario.numero_documento, 10);

    // Marcar que requiere cambio de contraseña
    const updated = await prisma.usuarios.update({
      where: { id_usuario: idUsuario },
      data: {
        password_hash,
        password_reset_required: true,
      },
    });

    // Registrar en auditoría
    const idUsuarioAdmin = Number(auth.user.id);
    await prisma.auditoria.create({
      data: {
        id_usuario: idUsuarioAdmin,
        tabla: "usuarios",
        id_registro: String(idUsuario),
        accion: "RESET_PASSWORD",
        detalle: `Restablecimiento de contraseña para usuario ${usuario.username} (ID: ${idUsuario})`,
      },
    });

    return NextResponse.json({
      message: "Contraseña restablecida exitosamente. La nueva contraseña es el número de documento del usuario.",
      usuario: {
        id_usuario: updated.id_usuario,
        username: updated.username,
        nombre_completo: updated.nombre_completo,
        password_reset_required: updated.password_reset_required,
      },
    });
  } catch (error) {
    console.error("Error resetting password", error);
    return NextResponse.json(
      { message: "Error restableciendo la contraseña" },
      { status: 500 },
    );
  }
}
