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

    const roleName = (session.user as any)?.role as string | undefined;

    if (!roleName) {
      return NextResponse.json({ data: [] });
    }

    const role = await prisma.roles.findUnique({
      where: { nombre: roleName },
      select: { id_rol: true, descripcion: true },
    });

    if (!role) {
      return NextResponse.json({ data: [] });
    }

    const permisos = await prisma.roles_permisos.findMany({
      where: {
        id_rol: role.id_rol,
        concedido: true,
        permisos: {
          activo: true,
        },
      },
      select: {
        permisos: {
          select: {
            id_permiso: true,
            codigo: true,
            modulo: true,
          },
        },
      },
      orderBy: {
        id_permiso: "asc",
      },
    });

    return NextResponse.json({
      roleDescription: role.descripcion ?? null,
      data: permisos.map((p) => p.permisos),
    });
  } catch (error) {
    console.error("Error fetching my permissions", error);
    return NextResponse.json({ message: "Error obteniendo permisos" }, { status: 500 });
  }
}
