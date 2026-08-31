import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const idUsuario = Number(auth.user.id);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return NextResponse.json({ message: "ID de usuario inválido" }, { status: 400 });
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: idUsuario },
      select: {
        id_usuario: true,
        nombre_completo: true,
        email: true,
        password_reset_required: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      id_usuario: usuario.id_usuario,
      nombre_completo: usuario.nombre_completo,
      email: usuario.email,
      password_reset_required: usuario.password_reset_required,
    });
  } catch (error) {
    console.error("Error fetching user data", error);
    return NextResponse.json(
      { message: "Error obteniendo datos del usuario" },
      { status: 500 },
    );
  }
}
