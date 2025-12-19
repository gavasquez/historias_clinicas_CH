import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const id = Number(resolvedParams.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "ID de profesional inválido" }, { status: 400 });
    }

    const profesional = await prisma.profesionales_salud.findFirst({
      where: {
        id_profesional: id,
        activo: true,
        usuarios: {
          activo: true,
        },
      },
      include: {
        usuarios: true,
        especialidades: true,
        sedes: true,
      },
    });

    if (!profesional) {
      return NextResponse.json({ message: "Profesional no encontrado" }, { status: 404 });
    }

    const data = {
      id_profesional: profesional.id_profesional,
      nombre_completo: profesional.usuarios.nombre_completo,
      email: profesional.usuarios.email,
      activo: profesional.activo,
      registro_medico: profesional.registro_medico ?? null,
      telefono_contacto: profesional.telefono_contacto ?? null,
      especialidad: profesional.especialidades
        ? {
            nombre: profesional.especialidades.nombre,
            descripcion: profesional.especialidades.descripcion ?? null,
          }
        : null,
      sede: profesional.sedes
        ? {
            nombre: profesional.sedes.nombre,
            ciudad: profesional.sedes.ciudad ?? null,
            departamento: profesional.sedes.departamento ?? null,
          }
        : null,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching professional detail", error);
    return NextResponse.json(
      { message: "Error obteniendo detalle de profesional" },
      { status: 500 },
    );
  }
}
