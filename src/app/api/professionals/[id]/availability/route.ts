import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseDateOnlyToUtc, parseTimeToUtcDate, timeFromUtcDate } from "@/lib/date-time";

const DEFAULT_CAPACIDAD_SIMULTANEA = 1;

function toMinutesUtc(d: Date) {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function dateOnlyOrMin(d: Date | null) {
  return d ? d.getTime() : Number.NEGATIVE_INFINITY;
}

function dateOnlyOrMax(d: Date | null) {
  return d ? d.getTime() : Number.POSITIVE_INFINITY;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const professionalId = Number(resolvedParams.id);

    if (!Number.isInteger(professionalId) || professionalId <= 0) {
      return NextResponse.json({ message: "ID de profesional inválido" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const idSedeParam = searchParams.get("id_sede");
    const idSede = idSedeParam ? Number(idSedeParam) : null;

    const items = await prisma.disponibilidades_profesional.findMany({
      where: {
        id_profesional: professionalId,
        ...(idSede && Number.isInteger(idSede) && idSede > 0
          ? {
              OR: [{ id_sede: idSede }, { id_sede: null }],
            }
          : {}),
      },
      orderBy: [{ id_sede: "asc" }, { dia_semana: "asc" }, { hora_inicio: "asc" }],
    });

    return NextResponse.json(
      items.map((i) => ({
        id_disponibilidad: i.id_disponibilidad,
        id_profesional: i.id_profesional,
        id_sede: i.id_sede,
        dia_semana: i.dia_semana,
        hora_inicio: timeFromUtcDate(i.hora_inicio),
        hora_fin: timeFromUtcDate(i.hora_fin),
        capacidad_simultanea: i.capacidad_simultanea,
        es_excepcion: i.es_excepcion,
        fecha_inicio_vigencia: i.fecha_inicio_vigencia ? i.fecha_inicio_vigencia.toISOString().slice(0, 10) : null,
        fecha_fin_vigencia: i.fecha_fin_vigencia ? i.fecha_fin_vigencia.toISOString().slice(0, 10) : null,
      })),
    );
  } catch (error) {
    console.error("Error fetching professional availability", error);
    return NextResponse.json(
      { message: "Error obteniendo disponibilidad" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const professionalId = Number(resolvedParams.id);

    if (!Number.isInteger(professionalId) || professionalId <= 0) {
      return NextResponse.json({ message: "ID de profesional inválido" }, { status: 400 });
    }

    const body = await request.json();
    const {
      id_sede,
      dia_semana,
      hora_inicio,
      hora_fin,
      capacidad_simultanea,
      fecha_inicio_vigencia,
      fecha_fin_vigencia,
    } = body;

    const idSedeNum = Number(id_sede);
    const diaSemanaNum = Number(dia_semana);

    if (!Number.isInteger(idSedeNum) || idSedeNum <= 0) {
      return NextResponse.json({ message: "La sede es obligatoria" }, { status: 400 });
    }

    if (!Number.isInteger(diaSemanaNum) || diaSemanaNum < 1 || diaSemanaNum > 7) {
      return NextResponse.json(
        { message: "El día de semana debe estar entre 1 (lunes) y 7 (domingo)" },
        { status: 400 },
      );
    }

    const start = parseTimeToUtcDate(hora_inicio);
    const end = parseTimeToUtcDate(hora_fin);

    if (!start || !end) {
      return NextResponse.json(
        { message: "hora_inicio y hora_fin deben tener formato HH:mm" },
        { status: 400 },
      );
    }

    if (end.getTime() <= start.getTime()) {
      return NextResponse.json(
        { message: "La hora fin debe ser mayor que la hora inicio" },
        { status: 400 },
      );
    }

    if (!fecha_inicio_vigencia || !String(fecha_inicio_vigencia).trim()) {
      return NextResponse.json(
        { message: "La fecha_inicio_vigencia es obligatoria" },
        { status: 400 },
      );
    }

    if (!fecha_fin_vigencia || !String(fecha_fin_vigencia).trim()) {
      return NextResponse.json(
        { message: "La fecha_fin_vigencia es obligatoria" },
        { status: 400 },
      );
    }

    const fechaInicioVigencia = parseDateOnlyToUtc(String(fecha_inicio_vigencia));
    const fechaFinVigencia = parseDateOnlyToUtc(String(fecha_fin_vigencia));

    if (!fechaInicioVigencia) {
      return NextResponse.json(
        { message: "La fecha_inicio_vigencia no es válida (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    if (!fechaFinVigencia) {
      return NextResponse.json(
        { message: "La fecha_fin_vigencia no es válida (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    if (fechaInicioVigencia && fechaFinVigencia && fechaFinVigencia < fechaInicioVigencia) {
      return NextResponse.json(
        { message: "La fecha fin de vigencia no puede ser anterior a la fecha inicio" },
        { status: 400 },
      );
    }

    const capacidad = Number.isInteger(Number(capacidad_simultanea))
      ? Math.max(Number(capacidad_simultanea), 1)
      : DEFAULT_CAPACIDAD_SIMULTANEA;

    const existing = await prisma.disponibilidades_profesional.findMany({
      where: {
        id_profesional: professionalId,
        id_sede: idSedeNum,
        dia_semana: diaSemanaNum,
        es_excepcion: false,
      },
      select: {
        id_disponibilidad: true,
        hora_inicio: true,
        hora_fin: true,
        fecha_inicio_vigencia: true,
        fecha_fin_vigencia: true,
      },
    });

    const newStartMin = toMinutesUtc(start);
    const newEndMin = toMinutesUtc(end);
    const newStartDate = dateOnlyOrMin(fechaInicioVigencia);
    const newEndDate = dateOnlyOrMax(fechaFinVigencia);

    const hasOverlap = existing.some((e) => {
      const eStartMin = toMinutesUtc(e.hora_inicio);
      const eEndMin = toMinutesUtc(e.hora_fin);
      const timeOverlap = newStartMin < eEndMin && newEndMin > eStartMin;
      if (!timeOverlap) return false;

      const eStartDate = dateOnlyOrMin(e.fecha_inicio_vigencia);
      const eEndDate = dateOnlyOrMax(e.fecha_fin_vigencia);
      const dateOverlap = newStartDate <= eEndDate && newEndDate >= eStartDate;
      return dateOverlap;
    });

    if (hasOverlap) {
      return NextResponse.json(
        {
          message:
            "Ya existe una disponibilidad que se cruza con la sede, día, vigencia y horario seleccionados.",
        },
        { status: 400 },
      );
    }

    const created = await prisma.disponibilidades_profesional.create({
      data: {
        id_profesional: professionalId,
        id_sede: idSedeNum,
        dia_semana: diaSemanaNum,
        hora_inicio: start,
        hora_fin: end,
        capacidad_simultanea: capacidad,
        es_excepcion: false,
        fecha_inicio_vigencia: fechaInicioVigencia,
        fecha_fin_vigencia: fechaFinVigencia,
      },
    });

    return NextResponse.json(
      {
        id_disponibilidad: created.id_disponibilidad,
        id_profesional: created.id_profesional,
        id_sede: created.id_sede,
        dia_semana: created.dia_semana,
        hora_inicio: timeFromUtcDate(created.hora_inicio),
        hora_fin: timeFromUtcDate(created.hora_fin),
        capacidad_simultanea: created.capacidad_simultanea,
        es_excepcion: created.es_excepcion,
        fecha_inicio_vigencia: created.fecha_inicio_vigencia
          ? created.fecha_inicio_vigencia.toISOString().slice(0, 10)
          : null,
        fecha_fin_vigencia: created.fecha_fin_vigencia
          ? created.fecha_fin_vigencia.toISOString().slice(0, 10)
          : null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating professional availability", error);
    return NextResponse.json(
      { message: "Error creando disponibilidad" },
      { status: 500 },
    );
  }
}
