import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const PAGE_SIZE = 5;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const nombre = searchParams.get("nombre")?.trim() || "";
    const especialidad = searchParams.get("especialidad")?.trim() || "";
    const sede = searchParams.get("sede")?.trim() || "";

    const page = Math.max(Number(pageParam) || 1, 1);
    const skip = (page - 1) * PAGE_SIZE;

    const where: any = {
      activo: true,
      usuarios: {
        activo: true,
        roles: {
          nombre: "medico",
        },
        ...(nombre
          ? {
              nombre_completo: {
                contains: nombre,
                mode: "insensitive",
              },
            }
          : {}),
      },
      ...(especialidad
        ? {
            especialidades: {
              nombre: {
                contains: especialidad,
                mode: "insensitive",
              },
            },
          }
        : {}),
      ...(sede
        ? {
            sedes: {
              nombre: {
                contains: sede,
                mode: "insensitive",
              },
            },
          }
        : {}),
    };

    const total = await prisma.profesionales_salud.count({ where });

    const items = await prisma.profesionales_salud.findMany({
      where,
      include: {
        usuarios: {
          include: {
            roles: true,
          },
        },
        especialidades: true,
        sedes: true,
      },
      orderBy: {
        id_profesional: "asc",
      },
      skip,
      take: PAGE_SIZE,
    });

    const data = items.map((p: (typeof items)[number]) => ({
      id_profesional: p.id_profesional,
      nombre_completo: p.usuarios.nombre_completo,
      email: p.usuarios.email,
      especialidad: p.especialidades?.nombre ?? null,
      sede: p.sedes?.nombre ?? null,
      registro_medico: p.registro_medico ?? null,
      firma_digital: (p as any).firma_digital ?? null,
      activo: p.activo,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (error) {
    console.error("Error fetching medical professionals", error);
    return NextResponse.json(
      { message: "Error obteniendo profesionales médicos" },
      { status: 500 },
    );
  }
}
