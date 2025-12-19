import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const id = Number(resolvedParams.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "ID de cita inválido" }, { status: 400 });
    }

    const cita = await prisma.citas.findUnique({ where: { id_cita: id } });

    if (!cita) {
      return NextResponse.json({ message: "Cita no encontrada" }, { status: 404 });
    }

    // Leer código de estado opcional desde el body para permitir elegir motivo de cancelación.
    // Si no viene, usamos CANCELADA_INST como valor por defecto.
    let codigoEstado = "CANCELADA_INST";
    try {
      const body = await request.json().catch(() => null);
      if (body && typeof body.codigo_estado === "string" && body.codigo_estado.trim() !== "") {
        codigoEstado = body.codigo_estado.trim();
      }
    } catch {
      // si el body no es JSON válido, ignoramos y usamos el valor por defecto
    }

    // Buscar el estado de cancelación existente según el código recibido.
    const estadoCancelada = await prisma.estados_cita.findFirst({
      where: {
        codigo: {
          equals: codigoEstado,
          mode: "insensitive",
        },
      },
    });

    if (!estadoCancelada) {
      return NextResponse.json(
        {
          message: `No se encontró el estado con código '${codigoEstado}' en la tabla estados_cita`,
        },
        { status: 500 },
      );
    }

    const citaActualizada = await prisma.citas.update({
      where: { id_cita: id },
      data: {
        id_estado_cita: estadoCancelada.id_estado_cita,
      },
    });

    return NextResponse.json(citaActualizada);
  } catch (error) {
    console.error("Error cancelling appointment", error);
    return NextResponse.json({ message: "Error cancelando cita" }, { status: 500 });
  }
}
