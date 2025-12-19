import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { UserListItem } from '@/types/users';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const where: Prisma.usuariosWhereInput = {
      activo: true,
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

    const users = await prisma.usuarios.findMany({
      where,
      orderBy: { nombre_completo: "asc" },
    });

    const data = users.map((u: UserListItem) => ({
      id_usuario: u.id_usuario,
      nombre_completo: u.nombre_completo,
      email: u.email,
      activo: u.activo,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching users", error);
    return NextResponse.json(
      { message: "Error obteniendo usuarios" },
      { status: 500 },
    );
  }
}
