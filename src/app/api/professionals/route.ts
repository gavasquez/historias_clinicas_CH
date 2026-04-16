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
        usuarios: true,
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
    console.error("Error fetching professionals", error);
    return NextResponse.json(
      { message: "Error obteniendo profesionales de salud" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id_usuario,
      id_sede,
      id_especialidad,
      registro_medico,
      firma_digital,
      activo,
    } = body;

    const idUsuarioNum = Number(id_usuario);
    if (!Number.isInteger(idUsuarioNum) || idUsuarioNum <= 0) {
      return NextResponse.json(
        { message: "El id_usuario es obligatorio y debe ser un entero positivo" },
        { status: 400 },
      );
    }

    const profesional = await prisma.profesionales_salud.create({
      data: {
        id_usuario: idUsuarioNum,
        id_sede: id_sede ?? null,
        id_especialidad: id_especialidad ?? null,
        registro_medico: registro_medico ?? null,
        firma_digital: typeof firma_digital === "string" ? firma_digital : null,
        activo: activo ?? true,
      },
      include: {
        usuarios: true,
        especialidades: true,
        sedes: true,
      },
    });

    const data = {
      id_profesional: profesional.id_profesional,
      nombre_completo: profesional.usuarios.nombre_completo,
      email: profesional.usuarios.email,
      especialidad: profesional.especialidades?.nombre ?? null,
      sede: profesional.sedes?.nombre ?? null,
      registro_medico: profesional.registro_medico ?? null,
      firma_digital: (profesional as any).firma_digital ?? null,
      activo: profesional.activo,
    };

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating professional", error);
    return NextResponse.json(
      { message: "Error creando profesional de salud" },
      { status: 500 },
    );
  }
}
