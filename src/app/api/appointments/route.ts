import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateAvailabilityOrThrow } from "@/lib/availability-validator";

const PAGE_SIZE = 5;
const DEFAULT_APPOINTMENT_DURATION_MINUTES = 20;

function computeEndDate(params: { start: Date; end: Date | null }) {
  const { start, end } = params;
  if (end && !Number.isNaN(end.getTime())) return end;
  return new Date(start.getTime() + DEFAULT_APPOINTMENT_DURATION_MINUTES * 60_000);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const profesional = searchParams.get("profesional")?.trim() || "";
    const paciente = searchParams.get("paciente")?.trim() || "";
    const estado = searchParams.get("estado")?.trim() || "";
    const tipoCita = searchParams.get("tipoCita")?.trim() || "";
    const fecha = searchParams.get("fecha")?.trim() || "";
    const idSedeParam = searchParams.get("id_sede");

    const idSede = idSedeParam != null && idSedeParam.trim() !== "" ? Number(idSedeParam) : null;

    const page = Math.max(Number(pageParam) || 1, 1);
    const skip = (page - 1) * PAGE_SIZE;

    const where: any = {
      // Solo mostrar citas programadas (con tipo y estado definidos)
      id_tipo_cita: { not: null },
      id_estado_cita: { not: null },
      ...(profesional
        ? {
            profesionales_salud: {
              usuarios: {
                nombre_completo: {
                  contains: profesional,
                  mode: "insensitive",
                },
              },
            },
          }
        : {}),
      ...(paciente
        ? {
            pacientes: {
              OR: [
                {
                  nombres: { contains: paciente, mode: "insensitive" },
                },
                {
                  apellidos: { contains: paciente, mode: "insensitive" },
                },
                {
                  numero_documento: { contains: paciente, mode: "insensitive" },
                },
              ],
            },
          }
        : {}),
      ...(estado
        ? {
            estados_cita: {
              descripcion: { contains: estado, mode: "insensitive" },
            },
          }
        : {}),
      ...(tipoCita
        ? {
            tipos_cita: {
              descripcion: { contains: tipoCita, mode: "insensitive" },
            },
          }
        : {}),
      ...(Number.isInteger(idSede as any) && (idSede as number) > 0
        ? {
            id_sede: idSede,
          }
        : {}),
    };

    if (fecha) {
      const start = new Date(`${fecha}T00:00:00`);
      const end = new Date(`${fecha}T23:59:59.999`);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        where.fecha_hora_inicio = {
          gte: start,
          lte: end,
        };
      }
    }

    const total = await prisma.citas.count({ where });

    const citas = await prisma.citas.findMany({
      where,
      include: {
        pacientes: true,
        profesionales_salud: {
          include: {
            usuarios: true,
          },
        },
        tipos_cita: true,
        estados_cita: true,
        tipos_historia_clinica: true,
        sedes: true,
      },
      orderBy: {
        fecha_hora_inicio: "desc",
      },
      skip,
      take: PAGE_SIZE,
    });

    const data = citas.map((cita: (typeof citas)[number]) => ({
      id_cita: cita.id_cita,
      fecha_hora_inicio: cita.fecha_hora_inicio.toISOString(),
      fecha_hora_fin: cita.fecha_hora_fin ? cita.fecha_hora_fin.toISOString() : null,
      tipo_cita: cita.tipos_cita?.descripcion ?? null,
      estado_cita: cita.estados_cita?.descripcion ?? null,
      tipo_historia: cita.tipos_historia_clinica?.descripcion ?? null,
      paciente_nombre: `${cita.pacientes.nombres} ${cita.pacientes.apellidos}`.trim(),
      paciente_documento: cita.pacientes.numero_documento,
      profesional_nombre: cita.profesionales_salud.usuarios.nombre_completo,
      sede: cita.sedes?.nombre ?? null,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (error) {
    console.error("Error fetching appointments", error);
    return NextResponse.json(
      { message: "Error obteniendo citas" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      id_modalidad_atencion,
      id_programa_salud,
      id_tipo_historia,
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
    const idModalidadAtencionNum =
      id_modalidad_atencion != null ? Number(id_modalidad_atencion) : null;
    const idProgramaSaludNum = Number(id_programa_salud);
    const idTipoHistoriaNum = id_tipo_historia != null ? Number(id_tipo_historia) : null;

    if (!Number.isInteger(idProgramaSaludNum) || idProgramaSaludNum <= 0) {
      return NextResponse.json(
        { message: "El programa transversal es obligatorio" },
        { status: 400 },
      );
    }

    if (idTipoHistoriaNum === null) {
      return NextResponse.json(
        { message: "El tipo de historia clínica es obligatorio" },
        { status: 400 },
      );
    }
    if (!Number.isInteger(idTipoHistoriaNum) || idTipoHistoriaNum <= 0) {
      return NextResponse.json(
        { message: "El tipo de historia clínica es inválido" },
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

    const cita = await prismaAny.citas.create({
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
        id_modalidad_atencion:
          idModalidadAtencionNum && Number.isInteger(idModalidadAtencionNum) && idModalidadAtencionNum > 0
            ? idModalidadAtencionNum
            : null,
        id_programa_salud: idProgramaSaludNum,
        id_tipo_historia: idTipoHistoriaNum,
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

    return NextResponse.json(cita, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment", error);
    return NextResponse.json(
      { message: "Error creando cita" },
      { status: 500 },
    );
  }
}
