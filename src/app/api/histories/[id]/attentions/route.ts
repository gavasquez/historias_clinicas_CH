import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function normalizeOptionalInt(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function normalizeOptionalBoolean(input: unknown): boolean | null {
  if (input === true) return true;
  if (input === false) return false;
  if (input === "SI") return true;
  if (input === "NO") return false;
  return null;
}

function normalizeOptionalDateTime(input: unknown): Date | null {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (!raw || raw === "undefined" || raw === "null") return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeDateOnly(input: unknown): Date | null {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (!raw || raw === "undefined" || raw === "null") return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveHistoriaEstadoFromSeguimiento(input: {
  seguimientoOpcion: string;
  seguimientoEfectivo: boolean | null;
  cierreSeguimiento: boolean | null;
}): "Finalizado" | "Seguimiento" | null {
  const opt = String(input.seguimientoOpcion ?? "").trim().toUpperCase();
  if (!opt) return null;

  if (opt === "NO_APLICA") return "Finalizado";
  if (input.cierreSeguimiento === true) return "Finalizado";
  if (input.cierreSeguimiento === false) {
    return "Seguimiento";
  }
  return null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    const idUsuario = session?.user ? Number((session.user as any).id) : NaN;

    if (!session?.user || !Number.isInteger(idUsuario) || idUsuario <= 0) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const profesional = await prisma.profesionales_salud.findFirst({
      where: { id_usuario: idUsuario, activo: true },
      select: { id_profesional: true },
    });

    if (!profesional?.id_profesional) {
      return NextResponse.json(
        {
          message:
            "El usuario autenticado no tiene un profesional de salud activo asociado.",
        },
        { status: 400 },
      );
    }

    const resolvedParams = await (context as any).params;
    const idHistoria = Number(resolvedParams.id);

    if (!Number.isInteger(idHistoria) || idHistoria <= 0) {
      return NextResponse.json({ message: "ID de historia inválido" }, { status: 400 });
    }

    const historia = await prisma.historias_clinicas.findUnique({
      where: { id_historia: idHistoria },
      include: {
        tipos_historia_clinica: { select: { codigo: true } },
      },
    });

    if (!historia) {
      return NextResponse.json({ message: "Historia clínica no encontrada" }, { status: 404 });
    }

    if (String((historia as any)?.tipos_historia_clinica?.codigo ?? "") !== "REG_ATENCION_SALUD") {
      return NextResponse.json(
        { message: "La historia no corresponde a REG_ATENCION_SALUD." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      fecha_hora,
      id_tipo_atencion,
      id_modalidad_atencion,
      id_sede,
      motivo_atencion,
      analisis,
      plan_manejo,
      seguimiento_opcion,
      seguimiento_efectivo,
      cierre_seguimiento,
      seguimiento_fecha,
      diagnosticos,
    } = body ?? {};

    const fechaHora = normalizeOptionalDateTime(fecha_hora);
    if (!fechaHora) {
      return NextResponse.json({ message: "Fecha de atención inválida" }, { status: 400 });
    }

    const idTipoAtencion = normalizeOptionalInt(id_tipo_atencion);
    if (!idTipoAtencion) {
      return NextResponse.json({ message: "El tipo de atención es obligatorio" }, { status: 400 });
    }

    const idModalidadAtencion = normalizeOptionalInt(id_modalidad_atencion);
    if (!idModalidadAtencion) {
      return NextResponse.json(
        { message: "La modalidad de atención es obligatoria" },
        { status: 400 },
      );
    }

    const idSedeNum = normalizeOptionalInt(id_sede);
    if (id_sede !== undefined && id_sede !== null && String(id_sede).trim() !== "") {
      if (!idSedeNum) {
        return NextResponse.json({ message: "Sede inválida" }, { status: 400 });
      }
      const sede = await prisma.sedes.findUnique({
        where: { id_sede: idSedeNum },
        select: { id_sede: true },
      });
      if (!sede) {
        return NextResponse.json({ message: "Sede inválida" }, { status: 400 });
      }
    }

    const motivoTrim = String(motivo_atencion ?? "").trim();
    if (!motivoTrim) {
      return NextResponse.json(
        { message: "El motivo de atención es obligatorio" },
        { status: 400 },
      );
    }

    const analisisTrim = String(analisis ?? "").trim();
    if (!analisisTrim) {
      return NextResponse.json(
        { message: "La observación / análisis es obligatoria" },
        { status: 400 },
      );
    }

    const planManejoTrim = String(plan_manejo ?? "").trim();
    if (!planManejoTrim) {
      return NextResponse.json(
        { message: "El plan de manejo es obligatorio" },
        { status: 400 },
      );
    }

    const diagnosticosArray = Array.isArray(diagnosticos) ? diagnosticos : [];
    const diagnosticosCreateRaw = diagnosticosArray
      .map((d: any) => {
        const codigo = String(d?.codigo_cie10 ?? "").trim();
        if (!codigo) return null;
        return {
          codigo_cie10: codigo,
          es_principal: d?.es_principal === true,
        };
      })
      .filter(Boolean) as Array<{ codigo_cie10: string; es_principal: boolean }>;

    if (diagnosticosCreateRaw.length === 0) {
      return NextResponse.json(
        { message: "Debe agregar al menos un diagnóstico" },
        { status: 400 },
      );
    }

    const diagnosticosCreate = (() => {
      const idx = diagnosticosCreateRaw.findIndex((d) => d.es_principal);
      if (idx < 0) return diagnosticosCreateRaw;
      return diagnosticosCreateRaw.map((d, i) => ({ ...d, es_principal: i === idx }));
    })();

    const found = await prisma.cie10.findMany({
      where: {
        codigo: {
          in: [...new Set(diagnosticosCreate.map((d) => d.codigo_cie10))],
        },
      },
      select: { codigo: true },
    });
    const foundSet = new Set(found.map((f) => f.codigo));
    const missing = diagnosticosCreate
      .map((d) => d.codigo_cie10)
      .filter((c) => !foundSet.has(c));
    if (missing.length > 0) {
      return NextResponse.json(
        { message: `Códigos CIE-10 inválidos: ${[...new Set(missing)].join(", ")}` },
        { status: 400 },
      );
    }

    const seguimientoOpcionTrim = String(seguimiento_opcion ?? "").trim();
    if (!seguimientoOpcionTrim) {
      return NextResponse.json(
        { message: "El tipo de seguimiento es obligatorio" },
        { status: 400 },
      );
    }
    const seguimientoEfectivoBool = normalizeOptionalBoolean(seguimiento_efectivo);
    const cierreSeguimientoBool = normalizeOptionalBoolean(cierre_seguimiento);
    const seguimientoFechaDate = normalizeDateOnly(seguimiento_fecha);

    const resolvedEstado = resolveHistoriaEstadoFromSeguimiento({
      seguimientoOpcion: seguimientoOpcionTrim,
      seguimientoEfectivo: seguimientoEfectivoBool,
      cierreSeguimiento: cierreSeguimientoBool,
    });

    // Si hay historia vinculada, la historia actual queda en seguimiento
    const estadoFinal = historia.id_historia_vinculada ? "Seguimiento" : resolvedEstado;
    const seguimientoCita = estadoFinal === "Seguimiento";

    const cita = await prisma.citas.create({
      data: {
        id_paciente: historia.id_paciente,
        id_profesional: profesional.id_profesional,
        id_sede: idSedeNum,
        id_tipo_cita: null,
        id_estado_cita: null,
        id_modalidad_atencion: idModalidadAtencion,
        id_programa_salud: null,
        fecha_hora_inicio: fechaHora,
        fecha_hora_fin: null,
        seguimiento: seguimientoCita,
        tipo_seguimiento: null,
        canal_recordatorio: null,
        id_historia_vinculada: null,
        tipos_atencionId_tipo_atencion: idTipoAtencion,
      } as any,
    });

    const atencion = await prisma.atenciones_salud.create({
      data: {
        id_historia: historia.id_historia,
        id_cita: cita.id_cita,
        id_profesional: profesional.id_profesional,
        id_tipo_atencion: idTipoAtencion,
        id_modalidad_atencion: idModalidadAtencion,
        fecha_hora: fechaHora,
        analisis: analisisTrim || null,
        hc_anamnesis_atencion: {
          create: {
            motivo_consulta: motivoTrim,
            enfermedad_actual: null,
          },
        },
        hc_atencion_cierre: {
          create: {
            conducta_plan_estudio_manejo: planManejoTrim,
            recomendaciones: null,
            certificado_recomendaciones: null,
            certificado_emitido: null,
            certificado_opcion: null,
            notificacion_emitida: null,
            seguimiento_notificacion: null,
            notificacion_observaciones: null,
            seguimiento_opcion: seguimientoOpcionTrim || null,
            seguimiento_efectivo: seguimientoEfectivoBool,
            cierre_seguimiento: cierreSeguimientoBool,
            seguimiento_fecha: seguimientoFechaDate,
          },
        },
        diagnosticos_atencion: {
          create: diagnosticosCreate,
        },
      } as any,
      include: {
        hc_anamnesis_atencion: true,
        hc_atencion_cierre: true,
        diagnosticos_atencion: { include: { cie10: true }, orderBy: { es_principal: "desc" } },
      },
    });

    if (estadoFinal) {
      try {
        // Si la historia actual está vinculada a otra, actualizamos ambas
        if (historia.id_historia_vinculada) {
          const idHistoriaVinculada = Number(historia.id_historia_vinculada);
          if (Number.isInteger(idHistoriaVinculada) && idHistoriaVinculada > 0) {
            // La historia actual queda en seguimiento (porque ahora es la activa)
            await prisma.historias_clinicas.update({
              where: { id_historia: historia.id_historia },
              data: { estado: "Seguimiento" },
            });
            
            // La historia vinculada (madre) se finaliza
            await prisma.historias_clinicas.update({
              where: { id_historia: idHistoriaVinculada },
              data: { estado: "Finalizado" },
            });
          }
        } else {
          // Si no está vinculada, actualizamos solo su estado según las reglas
          await prisma.historias_clinicas.update({
            where: { id_historia: historia.id_historia },
            data: { estado: estadoFinal },
          });
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ data: atencion }, { status: 201 });
  } catch (error) {
    console.error("Error creando atención para historia", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          message: "No se pudo guardar la atención por un error de base de datos.",
          code: error.code,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Error creando atención" },
      { status: 500 },
    );
  }
}
