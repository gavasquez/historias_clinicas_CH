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

export async function PUT(
  request: NextRequest,
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

    const current = await prisma.disponibilidades_profesional.findUnique({
      where: { id_disponibilidad: availabilityId },
    });

    if (!current || current.id_profesional !== professionalId) {
      return NextResponse.json({ message: "Disponibilidad no encontrada" }, { status: 404 });
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

    const others = await prisma.disponibilidades_profesional.findMany({
      where: {
        id_profesional: professionalId,
        id_sede: idSedeNum,
        dia_semana: diaSemanaNum,
        es_excepcion: false,
        id_disponibilidad: { not: availabilityId },
      },
      select: {
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

    const hasOverlap = others.some((e) => {
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

    const updated = await prisma.disponibilidades_profesional.update({
      where: { id_disponibilidad: availabilityId },
      data: {
        id_sede: idSedeNum,
        dia_semana: diaSemanaNum,
        hora_inicio: start,
        hora_fin: end,
        capacidad_simultanea: capacidad,
        fecha_inicio_vigencia: fechaInicioVigencia,
        fecha_fin_vigencia: fechaFinVigencia,
      },
    });

    return NextResponse.json({
      id_disponibilidad: updated.id_disponibilidad,
      id_profesional: updated.id_profesional,
      id_sede: updated.id_sede,
      dia_semana: updated.dia_semana,
      hora_inicio: timeFromUtcDate(updated.hora_inicio),
      hora_fin: timeFromUtcDate(updated.hora_fin),
      capacidad_simultanea: updated.capacidad_simultanea,
      es_excepcion: updated.es_excepcion,
      fecha_inicio_vigencia: updated.fecha_inicio_vigencia
        ? updated.fecha_inicio_vigencia.toISOString().slice(0, 10)
        : null,
      fecha_fin_vigencia: updated.fecha_fin_vigencia
        ? updated.fecha_fin_vigencia.toISOString().slice(0, 10)
        : null,
    });
  } catch (error) {
    console.error("Error updating professional availability", error);
    return NextResponse.json(
      { message: "Error actualizando disponibilidad" },
      { status: 500 },
    );
  }
}
