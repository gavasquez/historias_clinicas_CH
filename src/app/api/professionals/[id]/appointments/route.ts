import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { endOfDayInZone, parseDateInZoneToUtc } from "@/lib/date-time";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const resolvedParams = await (context as any).params;
    const id = Number(resolvedParams.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { message: "ID de profesional inválido" },
        { status: 400 },
      );
    }

    const date = request.nextUrl.searchParams.get("date");

    let dateFilter: { gte: Date; lte: Date } | undefined;
    if (date) {
      const start = parseDateInZoneToUtc(date);
      if (start) {
        const end = endOfDayInZone(start);
        dateFilter = { gte: start, lte: end };
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
