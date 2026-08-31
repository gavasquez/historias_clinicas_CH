import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const roleName = auth.user.role;

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
