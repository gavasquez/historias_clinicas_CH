import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await (context as any).params;
    const idPaciente = Number(resolvedParams.id);

    if (!Number.isInteger(idPaciente) || idPaciente <= 0) {
      return NextResponse.json({ message: "ID de paciente inválido" }, { status: 400 });
    }

    const acompanantes = await prisma.acompanantes.findMany({
      where: { id_paciente: idPaciente },
      orderBy: { id_acompanante: "asc" },
    });

    return NextResponse.json(acompanantes);
  } catch (error) {
    console.error("Error fetching companions", error);
    return NextResponse.json(
      { message: "Error obteniendo acompañantes" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await (context as any).params;
    const idPaciente = Number(resolvedParams.id);

    if (!Number.isInteger(idPaciente) || idPaciente <= 0) {
      return NextResponse.json({ message: "ID de paciente inválido" }, { status: 400 });
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

    const acompanante = await prisma.acompanantes.create({
      data: {
        id_paciente: idPaciente,
        nombre: nombreTrim,
        direccion: direccion ?? null,
        telefono: telefono ?? null,
        relacion_con_paciente: relacion_con_paciente ?? null,
      },
    });

    return NextResponse.json(acompanante, { status: 201 });
  } catch (error) {
    console.error("Error creating companion", error);
    return NextResponse.json(
      { message: "Error creando acompañante" },
      { status: 500 },
    );
  }
}
