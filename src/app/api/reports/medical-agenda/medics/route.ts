import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const items = await prisma.profesionales_salud.findMany({
      where: {
        activo: true,
        usuarios: {
          activo: true,
          roles: {
            nombre: "medico",
          },
        },
        disponibilidades_profesional: {
          some: {},
        },
      },
      include: {
        usuarios: true,
        sedes: true,
      },
      orderBy: {
        usuarios: {
          nombre_completo: "asc",
        },
      },
    });

    const data = items.map((p: (typeof items)[number]) => ({
      id_profesional: p.id_profesional,
      nombre_completo: p.usuarios.nombre_completo,
      sede: p.sedes?.nombre ?? null,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching medical agenda medics", error);
    return NextResponse.json(
      { message: "Error obteniendo médicos con agenda" },
      { status: 500 },
    );
  }
}
