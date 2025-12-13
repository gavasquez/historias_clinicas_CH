import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; companionId: string }> },
) {
  try {
    const resolvedParams = await (context as any).params;
    const idPaciente = Number(resolvedParams.id);
    const idAcompanante = Number(resolvedParams.companionId);

    if (!Number.isInteger(idPaciente) || idPaciente <= 0) {
      return NextResponse.json({ message: "ID de paciente inválido" }, { status: 400 });
    }

    if (!Number.isInteger(idAcompanante) || idAcompanante <= 0) {
      return NextResponse.json({ message: "ID de acompañante inválido" }, { status: 400 });
    }

    const body = await request.json();
    const { nombre, direccion, telefono, relacion_con_paciente } = body;

    const nombreTrim = String(nombre ?? "").trim();
    if (!nombreTrim) {
      return NextResponse.json(
        { message: "El nombre del acompañante es obligatorio" },
        { status: 400 },
      );
    }

    const acompanante = await prisma.acompanantes.update({
      where: {
        id_acompanante: idAcompanante,
        id_paciente: idPaciente,
      },
      data: {
        nombre: nombreTrim,
        direccion: direccion ?? null,
        telefono: telefono ?? null,
        relacion_con_paciente: relacion_con_paciente ?? null,
      },
    });

    return NextResponse.json(acompanante);
  } catch (error) {
    console.error("Error updating companion", error);
    return NextResponse.json(
      { message: "Error actualizando acompañante" },
      { status: 500 },
    );
  }
}
