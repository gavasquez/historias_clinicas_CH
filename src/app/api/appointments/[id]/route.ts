import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateAvailabilityOrThrow } from "@/lib/availability-validator";

const DEFAULT_APPOINTMENT_DURATION_MINUTES = 20;

function computeEndDate(params: { start: Date; end: Date | null }) {
  const { start, end } = params;
  if (end && !Number.isNaN(end.getTime())) return end;
  return new Date(start.getTime() + DEFAULT_APPOINTMENT_DURATION_MINUTES * 60_000);
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const id = Number(resolvedParams.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "ID de cita inválido" }, { status: 400 });
    }

    const cita = await prisma.citas.findUnique({
      where: { id_cita: id },
    });

    if (!cita) {
      return NextResponse.json({ message: "Cita no encontrada" }, { status: 404 });
    }

    // Obtener la última atención asociada a esta cita (si existe)
    const ultimaAtencion = await prisma.atenciones_salud.findFirst({
      where: { id_cita: cita.id_cita },
      orderBy: { id_atencion: "desc" },
      include: {
        tipos_atencion: true,
        modalidades_atencion: true,
      },
    });

    return NextResponse.json({
      id_cita: cita.id_cita,
      id_paciente: cita.id_paciente,
      id_profesional: cita.id_profesional,
      id_sede: cita.id_sede,
      id_tipo_cita: cita.id_tipo_cita,
      id_estado_cita: cita.id_estado_cita,
      id_modalidad_atencion: cita.id_modalidad_atencion,
      id_programa_salud: (cita as any).id_programa_salud ?? null,
      id_tipo_historia: (cita as any).id_tipo_historia ?? null,
      fecha_hora_inicio: cita.fecha_hora_inicio.toISOString(),
      fecha_hora_fin: cita.fecha_hora_fin ? cita.fecha_hora_fin.toISOString() : null,
      seguimiento: (cita as any).seguimiento ?? false,
      tipo_seguimiento: (cita as any).tipo_seguimiento ?? null,
      id_historia_vinculada: (cita as any).id_historia_vinculada ?? null,
      canal_recordatorio: cita.canal_recordatorio,
      ultima_atencion: ultimaAtencion
        ? {
            id_atencion: ultimaAtencion.id_atencion,
            id_historia: ultimaAtencion.id_historia,
            id_tipo_atencion: ultimaAtencion.id_tipo_atencion,
            descripcion_tipo_atencion: ultimaAtencion.tipos_atencion?.descripcion ?? null,
            id_modalidad_atencion: ultimaAtencion.id_modalidad_atencion,
            descripcion_modalidad_atencion:
              ultimaAtencion.modalidades_atencion?.descripcion ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching appointment by id", error);
    return NextResponse.json({ message: "Error obteniendo cita" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const id = Number(resolvedParams.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "ID de cita inválido" }, { status: 400 });
    }

    const body = await request.json();
    const {
      id_paciente,
      id_profesional,
      fecha_hora_inicio,
      fecha_hora_fin,
      id_sede,
      id_tipo_cita,
      id_estado_cita,
      canal_recordatorio,
      id_programa_salud,
      seguimiento,
      tipo_seguimiento,
      id_historia_vinculada,
    } = body;

    const prismaAny = prisma as any;

    const idPacienteNum = Number(id_paciente);
    const idProfesionalNum = Number(id_profesional);

    if (!Number.isInteger(idPacienteNum) || idPacienteNum <= 0) {
      return NextResponse.json(
        { message: "El id_paciente es obligatorio y debe ser un entero positivo" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(idProfesionalNum) || idProfesionalNum <= 0) {
      return NextResponse.json(
        { message: "El id_profesional es obligatorio y debe ser un entero positivo" },
        { status: 400 },
      );
    }

    if (!fecha_hora_inicio || typeof fecha_hora_inicio !== "string") {
      return NextResponse.json(
        { message: "La fecha y hora de inicio es obligatoria" },
        { status: 400 },
      );
    }

    const fechaInicio = new Date(fecha_hora_inicio);
    if (Number.isNaN(fechaInicio.getTime())) {
      return NextResponse.json(
        { message: "La fecha y hora de inicio no es válida" },
        { status: 400 },
      );
    }

    const idSedeNum = id_sede != null ? Number(id_sede) : null;
    const idTipoCitaNum = id_tipo_cita != null ? Number(id_tipo_cita) : null;
    const idEstadoCitaNum = id_estado_cita != null ? Number(id_estado_cita) : null;
    const idProgramaSaludNum = Number(id_programa_salud);

    if (!Number.isInteger(idProgramaSaludNum) || idProgramaSaludNum <= 0) {
      return NextResponse.json(
        { message: "El programa transversal es obligatorio" },
        { status: 400 },
      );
    }

    const seguimientoBool = seguimiento === true;
    const idHistoriaVinculadaNum =
      id_historia_vinculada === null || id_historia_vinculada === undefined || String(id_historia_vinculada).trim() === ""
        ? null
        : Number(id_historia_vinculada);

    if (seguimientoBool) {
      if (!Number.isInteger(idHistoriaVinculadaNum as any) || (idHistoriaVinculadaNum as number) <= 0) {
        return NextResponse.json(
          { message: "Debe seleccionar una historia en seguimiento para vincular" },
          { status: 400 },
        );
      }

      const historiaVinculada = await prisma.historias_clinicas.findFirst({
        where: {
          id_historia: idHistoriaVinculadaNum as number,
          id_paciente: idPacienteNum,
          estado: "Seguimiento",
        },
        select: { id_historia: true },
      });

      if (!historiaVinculada?.id_historia) {
        return NextResponse.json(
          { message: "La historia vinculada no existe, no pertenece al paciente o no está en estado Seguimiento" },
          { status: 400 },
        );
      }
    }

    const idSedeValid =
      idSedeNum != null && Number.isInteger(idSedeNum) && idSedeNum > 0 ? idSedeNum : null;

    if (!idSedeValid) {
      return NextResponse.json(
        { message: "La sede es obligatoria para validar disponibilidad" },
        { status: 400 },
      );
    }

    let fechaFin: Date | null = null;
    if (fecha_hora_fin) {
      const parsed = new Date(fecha_hora_fin);
      if (!Number.isNaN(parsed.getTime())) {
        fechaFin = parsed;
      }
    }

    if (!fechaFin) {
      fechaFin = new Date(
        fechaInicio.getTime() + DEFAULT_APPOINTMENT_DURATION_MINUTES * 60_000,
      );
    }

    if (fechaFin.getTime() <= fechaInicio.getTime()) {
      return NextResponse.json(
        { message: "La fecha y hora fin debe ser mayor que la fecha y hora inicio" },
        { status: 400 },
      );
    }

    try {
      await validateAvailabilityOrThrow({
        idProfesional: idProfesionalNum,
        idSede: idSedeValid,
        start: fechaInicio,
        end: fechaFin,
      });
    } catch (e) {
      if (e instanceof Error && e.message === "NO_AVAILABILITY") {
        return NextResponse.json(
          { message: "El profesional no tiene disponibilidad para esa sede/horario" },
          { status: 400 },
        );
      }
      throw e;
    }

    const availabilityItems = await prisma.disponibilidades_profesional.findMany({
      where: {
        id_profesional: idProfesionalNum,
        id_sede: idSedeValid,
        dia_semana: ((fechaInicio.getDay() + 6) % 7) + 1,
        es_excepcion: false,
      },
      orderBy: [{ hora_inicio: "asc" }],
    });

    const intervalCapacity = (() => {
      const startMin = fechaInicio.getHours() * 60 + fechaInicio.getMinutes();
      const endMin = fechaFin.getHours() * 60 + fechaFin.getMinutes();
      const item = availabilityItems.find((i) => {
        const aStart = i.hora_inicio.getUTCHours() * 60 + i.hora_inicio.getUTCMinutes();
        const aEnd = i.hora_fin.getUTCHours() * 60 + i.hora_fin.getUTCMinutes();
        return startMin >= aStart && endMin <= aEnd;
      });
      const cap = item?.capacidad_simultanea ?? 1;
      return Math.max(Number(cap) || 1, 1);
    })();

    const possibleOverlaps = await prisma.citas.findMany({
      where: {
        id_profesional: idProfesionalNum,
        id_cita: { not: id },
        fecha_hora_inicio: { lt: fechaFin },
        OR: [{ fecha_hora_fin: { gt: fechaInicio } }, { fecha_hora_fin: null }],
      },
      select: {
        id_cita: true,
        fecha_hora_inicio: true,
        fecha_hora_fin: true,
      },
    });

    const overlaps = possibleOverlaps.reduce((acc, c) => {
      const s = c.fecha_hora_inicio;
      const e = computeEndDate({ start: c.fecha_hora_inicio, end: c.fecha_hora_fin });
      const isOverlap = s < fechaFin && e > fechaInicio;
      return acc + (isOverlap ? 1 : 0);
    }, 0);

    if (overlaps >= intervalCapacity) {
      return NextResponse.json(
        { message: "El profesional ya tiene una cita programada en ese horario" },
        { status: 400 },
      );
    }

    const cita = await prismaAny.citas.update({
      where: { id_cita: id },
      data: {
        id_paciente: idPacienteNum,
        id_profesional: idProfesionalNum,
        id_sede: idSedeValid,
        id_tipo_cita:
          idTipoCitaNum && Number.isInteger(idTipoCitaNum) && idTipoCitaNum > 0
            ? idTipoCitaNum
            : null,
        id_estado_cita:
          idEstadoCitaNum && Number.isInteger(idEstadoCitaNum) && idEstadoCitaNum > 0
            ? idEstadoCitaNum
            : null,
        id_programa_salud: idProgramaSaludNum,
        fecha_hora_inicio: fechaInicio,
        fecha_hora_fin: fechaFin,
        seguimiento: seguimientoBool,
        tipo_seguimiento:
          seguimiento === true && typeof tipo_seguimiento === "string" && tipo_seguimiento.trim()
            ? tipo_seguimiento.trim()
            : null,
        id_historia_vinculada: seguimientoBool ? (idHistoriaVinculadaNum as number) : null,
        canal_recordatorio: canal_recordatorio ?? null,
      },
    });

    return NextResponse.json(cita);
  } catch (error) {
    console.error("Error updating appointment", error);
    return NextResponse.json({ message: "Error actualizando cita" }, { status: 500 });
  }
}
