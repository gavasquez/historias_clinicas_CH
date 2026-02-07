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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const id = Number(resolvedParams.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "ID de profesional inválido" }, { status: 400 });
    }

    const body = await request.json();
    const {
      id_sede,
      id_especialidad,
      registro_medico,
      telefono_contacto,
      activo,
    } = body ?? {};

    const data: any = {};

    if (typeof id_sede === "number") {
      data.id_sede = id_sede > 0 ? id_sede : null;
    }

    if (typeof id_especialidad === "number") {
      data.id_especialidad = id_especialidad > 0 ? id_especialidad : null;
    }

    if (typeof registro_medico === "string") {
      data.registro_medico = registro_medico.trim() || null;
    }

    if (typeof telefono_contacto === "string") {
      data.telefono_contacto = telefono_contacto.trim() || null;
    }

    if (typeof activo === "boolean") {
      data.activo = activo;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No se enviaron campos para actualizar." },
        { status: 400 },
      );
    }

    const updated = await prisma.profesionales_salud.update({
      where: { id_profesional: id },
      data,
      include: {
        usuarios: true,
        especialidades: true,
        sedes: true,
      },
    });

    const response = {
      id_profesional: updated.id_profesional,
      nombre_completo: updated.usuarios.nombre_completo,
      email: updated.usuarios.email,
      activo: updated.activo,
      registro_medico: updated.registro_medico ?? null,
      telefono_contacto: updated.telefono_contacto ?? null,
      especialidad: updated.especialidades
        ? {
            nombre: updated.especialidades.nombre,
            descripcion: updated.especialidades.descripcion ?? null,
          }
        : null,
      sede: updated.sedes
        ? {
            nombre: updated.sedes.nombre,
            ciudad: updated.sedes.ciudad ?? null,
            departamento: updated.sedes.departamento ?? null,
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating professional", error);
    return NextResponse.json(
      { message: "Error actualizando profesional" },
      { status: 500 },
    );
  }
}
