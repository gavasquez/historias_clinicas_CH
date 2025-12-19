import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const id = Number(resolvedParams.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { message: "ID de profesional inválido" },
        { status: 400 },
      );
    }

    const date = request.nextUrl.searchParams.get("date");

    let dateFilter: { gte: Date; lt: Date } | undefined;
    if (date) {
      const start = new Date(`${date}T00:00:00`);
      if (!Number.isNaN(start.getTime())) {
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        dateFilter = { gte: start, lt: end };
      }
    }

    const citas = await prisma.citas.findMany({
      where: {
        id_profesional: id,
        ...(dateFilter ? { fecha_hora_inicio: dateFilter } : {}),
      },
      include: {
        pacientes: true,
        tipos_cita: true,
        estados_cita: true,
      },
      orderBy: {
        fecha_hora_inicio: "asc",
      },
    });

    const data = citas.map((cita: (typeof citas)[number]) => ({
      id_cita: cita.id_cita,
      fecha_hora_inicio: cita.fecha_hora_inicio.toISOString(),
      fecha_hora_fin: cita.fecha_hora_fin ? cita.fecha_hora_fin.toISOString() : null,
      tipo_cita: cita.tipos_cita?.descripcion ?? null,
      estado_cita: cita.estados_cita?.descripcion ?? null,
      paciente_nombre: `${cita.pacientes.nombres} ${cita.pacientes.apellidos}`.trim(),
      paciente_documento: cita.pacientes.numero_documento,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching professional appointments", error);
    return NextResponse.json(
      { message: "Error obteniendo citas del profesional" },
      { status: 500 },
    );
  }
}
