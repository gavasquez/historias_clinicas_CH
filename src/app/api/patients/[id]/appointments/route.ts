import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseDateOnlyToUtc } from "@/lib/date-time";

const PAGE_SIZE = 5;

function addDaysUtc(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const patientId = Number(resolvedParams.id);

    if (!Number.isInteger(patientId) || patientId <= 0) {
      return NextResponse.json({ message: "ID de paciente inválido" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);

    const pageParam = searchParams.get("page");
    const page = Math.max(Number(pageParam) || 1, 1);
    const skip = (page - 1) * PAGE_SIZE;

    const desdeParam = searchParams.get("desde");
    const hastaParam = searchParams.get("hasta");
    const estadoIdParam = searchParams.get("id_estado_cita");
    const sedeIdParam = searchParams.get("id_sede");
    const profesionalParam = searchParams.get("profesional")?.trim() || "";

    const desde = desdeParam ? parseDateOnlyToUtc(desdeParam) : null;
    const hastaDateOnly = hastaParam ? parseDateOnlyToUtc(hastaParam) : null;

    if (desdeParam && !desde) {
      return NextResponse.json(
        { message: "El parámetro 'desde' debe tener formato YYYY-MM-DD" },
        { status: 400 },
      );
    }

    if (hastaParam && !hastaDateOnly) {
      return NextResponse.json(
        { message: "El parámetro 'hasta' debe tener formato YYYY-MM-DD" },
        { status: 400 },
      );
    }

    if (desde && hastaDateOnly && hastaDateOnly.getTime() < desde.getTime()) {
      return NextResponse.json(
        { message: "La fecha 'hasta' debe ser mayor o igual que 'desde'" },
        { status: 400 },
      );
    }

    const hastaExclusive = hastaDateOnly ? addDaysUtc(hastaDateOnly, 1) : null;

    const idEstadoCita = estadoIdParam ? Number(estadoIdParam) : null;
    const idSede = sedeIdParam ? Number(sedeIdParam) : null;

    const where: any = {
      id_paciente: patientId,
      ...(Number.isInteger(idEstadoCita) && idEstadoCita! > 0 ? { id_estado_cita: idEstadoCita } : {}),
      ...(Number.isInteger(idSede) && idSede! > 0 ? { id_sede: idSede } : {}),
      ...(profesionalParam
        ? {
            profesionales_salud: {
              usuarios: {
                nombre_completo: { contains: profesionalParam, mode: "insensitive" },
              },
            },
          }
        : {}),
      ...(desde || hastaExclusive
        ? {
            fecha_hora_inicio: {
              ...(desde ? { gte: desde } : {}),
              ...(hastaExclusive ? { lt: hastaExclusive } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.citas.findMany({
        where,
        include: {
          profesionales_salud: { include: { usuarios: true } },
          tipos_cita: true,
          estados_cita: true,
          sedes: true,
        },
        orderBy: { fecha_hora_inicio: "desc" },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.citas.count({ where }),
    ]);

    return NextResponse.json({
      data: items.map((cita) => ({
        id_cita: cita.id_cita,
        fecha_hora_inicio: cita.fecha_hora_inicio.toISOString(),
        fecha_hora_fin: cita.fecha_hora_fin ? cita.fecha_hora_fin.toISOString() : null,
        tipo_cita: cita.tipos_cita?.descripcion ?? null,
        estado_cita: cita.estados_cita?.descripcion ?? null,
        profesional_nombre: cita.profesionales_salud?.usuarios?.nombre_completo ?? null,
        sede: cita.sedes?.nombre ?? null,
      })),
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
      },
    });
  } catch (error) {
    console.error("Error fetching patient appointments", error);
    return NextResponse.json(
      { message: "Error obteniendo historial de citas del paciente" },
      { status: 500 },
    );
  }
}
