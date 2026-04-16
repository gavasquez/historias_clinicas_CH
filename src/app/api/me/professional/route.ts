import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const idUsuario = Number((session.user as any)?.id);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const profesional = await prisma.profesionales_salud.findFirst({
      where: {
        id_usuario: idUsuario,
        activo: true,
      },
      include: {
        usuarios: {
          select: {
            id_usuario: true,
            nombre_completo: true,
            email: true,
          },
        },
        sedes: {
          select: {
            id_sede: true,
            nombre: true,
          },
        },
        especialidades: {
          select: {
            id_especialidad: true,
            nombre: true,
          },
        },
      },
    });

    if (!profesional) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: profesional });
  } catch (error) {
    console.error("Error fetching my professional", error);
    return NextResponse.json(
      { message: "Error obteniendo profesional" },
      { status: 500 },
    );
  }
}
