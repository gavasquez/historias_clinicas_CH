import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateAvailabilityOrThrow } from "@/lib/availability-validator";

const DEFAULT_APPOINTMENT_DURATION_MINUTES = 30;

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

    return NextResponse.json({
      id_cita: cita.id_cita,
      id_paciente: cita.id_paciente,
      id_profesional: cita.id_profesional,
      id_sede: cita.id_sede,
      id_tipo_cita: cita.id_tipo_cita,
      id_estado_cita: cita.id_estado_cita,
      fecha_hora_inicio: cita.fecha_hora_inicio.toISOString(),
      fecha_hora_fin: cita.fecha_hora_fin ? cita.fecha_hora_fin.toISOString() : null,
      motivo: cita.motivo,
      canal_recordatorio: cita.canal_recordatorio,
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
      motivo,
    } = body;

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

    const cita = await prisma.citas.update({
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
        fecha_hora_inicio: fechaInicio,
        fecha_hora_fin: fechaFin,
        canal_recordatorio: canal_recordatorio ?? null,
        motivo: motivo ?? null,
      },
    });

    return NextResponse.json(cita);
  } catch (error) {
    console.error("Error updating appointment", error);
    return NextResponse.json({ message: "Error actualizando cita" }, { status: 500 });
  }
}
