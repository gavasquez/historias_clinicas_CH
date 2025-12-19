import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  context:
    | { params: Promise<{ id: string; availabilityId: string }> }
    | { params: { id: string; availabilityId: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const professionalId = Number(resolvedParams.id);
    const availabilityId = Number(resolvedParams.availabilityId);

    if (!Number.isInteger(professionalId) || professionalId <= 0) {
      return NextResponse.json({ message: "ID de profesional inválido" }, { status: 400 });
    }

    if (!Number.isInteger(availabilityId) || availabilityId <= 0) {
      return NextResponse.json(
        { message: "ID de disponibilidad inválido" },
        { status: 400 },
      );
    }

    const existing = await prisma.disponibilidades_profesional.findUnique({
      where: { id_disponibilidad: availabilityId },
      select: { id_disponibilidad: true, id_profesional: true },
    });

    if (!existing || existing.id_profesional !== professionalId) {
      return NextResponse.json(
        { message: "Disponibilidad no encontrada" },
        { status: 404 },
      );
    }

    await prisma.disponibilidades_profesional.delete({
      where: { id_disponibilidad: availabilityId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting professional availability", error);
    return NextResponse.json(
      { message: "Error eliminando disponibilidad" },
      { status: 500 },
    );
  }
}
