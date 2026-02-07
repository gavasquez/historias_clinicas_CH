import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateAvailabilityOrThrow } from "@/lib/availability-validator";

const PAGE_SIZE = 5;
const DEFAULT_APPOINTMENT_DURATION_MINUTES = 20;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const profesional = searchParams.get("profesional")?.trim() || "";
    const paciente = searchParams.get("paciente")?.trim() || "";
    const estado = searchParams.get("estado")?.trim() || "";
    const tipoCita = searchParams.get("tipoCita")?.trim() || "";

    const page = Math.max(Number(pageParam) || 1, 1);
    const skip = (page - 1) * PAGE_SIZE;

    const where: any = {
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
    };

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
      seguimiento,
      tipo_seguimiento,
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

    if (!Number.isInteger(idProgramaSaludNum) || idProgramaSaludNum <= 0) {
      return NextResponse.json(
        { message: "El programa transversal es obligatorio" },
        { status: 400 },
      );
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
        fecha_hora_inicio: fechaInicio,
        fecha_hora_fin: fechaFin,
        seguimiento: seguimiento === true,
        tipo_seguimiento:
          seguimiento === true && typeof tipo_seguimiento === "string" && tipo_seguimiento.trim()
            ? tipo_seguimiento.trim()
            : null,
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
