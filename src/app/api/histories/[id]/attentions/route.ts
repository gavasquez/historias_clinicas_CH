import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { requireAnyPermission } from "@/lib/auth";
import { resolveClinicalHistoryStatus } from "@/lib/clinical-history-status";
import { resolveAcompananteAtencion } from "@/lib/acompanante-atencion";

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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const auth = await requireAnyPermission(request, ["HISTORIAS_REGISTRAR"]);
    if (auth instanceof NextResponse) return auth;

    const idUsuario = Number(auth.user.id);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
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
      observacion_analisis,
      analisis,
      recomendaciones,
      seguimiento_opcion,
      seguimiento_efectivo,
      cierre_seguimiento,
      seguimiento_fecha,
      seguimiento_observaciones,
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
    const observacionAnalisisTrim = String(observacion_analisis ?? "").trim();
    const recomendacionesTrim = String(recomendaciones ?? "").trim();
    if (!analisisTrim) {
      return NextResponse.json(
        { message: "El análisis es obligatorio" },
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
          codigo_confirmacion: String(d?.codigo_confirmacion ?? "").trim().toUpperCase(),
        };
      })
      .filter(Boolean) as Array<{
        codigo_cie10: string;
        es_principal: boolean;
        codigo_confirmacion: string;
      }>;

    if (diagnosticosCreateRaw.length === 0) {
      return NextResponse.json(
        { message: "Debe agregar al menos un diagnóstico" },
        { status: 400 },
      );
    }

    if (diagnosticosCreateRaw.filter((diagnostico) => diagnostico.es_principal).length !== 1) {
      return NextResponse.json(
        { message: "Debe seleccionar exactamente un diagnóstico principal." },
        { status: 400 },
      );
    }

    if (
      diagnosticosCreateRaw.some(
        (diagnostico) => !["CN", "CR", "ID"].includes(diagnostico.codigo_confirmacion),
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Todos los diagnósticos deben tener un tipo de confirmación: CN, CR o ID.",
        },
        { status: 400 },
      );
    }

    const confirmaciones = await prisma.tipos_confirmacion_diagnostico.findMany({
      where: { codigo: { in: ["CN", "CR", "ID"] } },
      select: { codigo: true, id_tipo_confirmacion: true },
    });
    const confirmacionesMap = new Map(
      confirmaciones.map((confirmacion) => [
        confirmacion.codigo.toUpperCase(),
        confirmacion.id_tipo_confirmacion,
      ]),
    );
    if (confirmacionesMap.size !== 3) {
      return NextResponse.json(
        { message: "El catálogo de tipos de confirmación diagnóstica está incompleto." },
        { status: 500 },
      );
    }

    const diagnosticosCreate = diagnosticosCreateRaw.map((diagnostico) => ({
      codigo_cie10: diagnostico.codigo_cie10,
      es_principal: diagnostico.es_principal,
      id_tipo_confirmacion: confirmacionesMap.get(diagnostico.codigo_confirmacion)!,
    }));

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
    const seguimientoEfectivoBool = normalizeOptionalBoolean(seguimiento_efectivo);
    const cierreSeguimientoBool = normalizeOptionalBoolean(cierre_seguimiento);
    const seguimientoFechaDate = normalizeDateOnly(seguimiento_fecha);
    const seguimientoObservacionesTrim = String(seguimiento_observaciones ?? "").trim();

    const resolvedEstado = resolveClinicalHistoryStatus({
      seguimientoOpcion: seguimientoOpcionTrim,
      cierreSeguimiento: cierreSeguimientoBool,
    });

    // Si hay historia vinculada, la historia actual queda en seguimiento
    const estadoFinal = historia.id_historia_vinculada ? "Seguimiento" : resolvedEstado;

    const acompananteRes = await resolveAcompananteAtencion((body as any)?.acompanante, historia.id_paciente);
    if (acompananteRes.error) {
      return NextResponse.json({ message: acompananteRes.error }, { status: 400 });
    }
    const acompananteData = acompananteRes.data;
    const atencion = await prisma.$transaction(async (tx) => {
      const createdAttention = await tx.atenciones_salud.create({
      data: {
        id_historia: historia.id_historia,
        id_cita: null,
        id_sede: idSedeNum,
        id_profesional: profesional.id_profesional,
        id_tipo_atencion: idTipoAtencion,
        id_modalidad_atencion: idModalidadAtencion,
        fecha_hora: fechaHora,
        analisis: analisisTrim || null,
        observacion_analisis: observacionAnalisisTrim || null,
        hc_anamnesis_atencion: {
          create: {
            motivo_consulta: motivoTrim,
            enfermedad_actual: null,
          },
        },
        hc_atencion_cierre: {
          create: {
            conducta_plan_estudio_manejo: null,
            recomendaciones: recomendacionesTrim || null,
            certificado_recomendaciones: null,
            certificado_emitido: null,
            certificado_opcion: null,
            notificacion_emitida: null,
            seguimiento_notificacion: null,
            seguimiento_observaciones: seguimientoObservacionesTrim || null,
            seguimiento_opcion: seguimientoOpcionTrim || null,
            seguimiento_efectivo: seguimientoEfectivoBool,
            cierre_seguimiento: cierreSeguimientoBool,
            seguimiento_fecha: seguimientoFechaDate,
          },
        },
        diagnosticos_atencion: {
          create: diagnosticosCreate,
        },
        acompanante_atencion: acompananteData ? { create: acompananteData } : undefined,
      } as any,
      include: {
        hc_anamnesis_atencion: true,
        hc_atencion_cierre: true,
        acompanante_atencion: true,
        diagnosticos_atencion: { include: { cie10: true }, orderBy: { es_principal: "desc" } },
      },
      });

      if (estadoFinal) {
        if (historia.id_historia_vinculada) {
          const idHistoriaVinculada = Number(historia.id_historia_vinculada);
          if (Number.isInteger(idHistoriaVinculada) && idHistoriaVinculada > 0) {
            await tx.historias_clinicas.update({
              where: { id_historia: historia.id_historia },
              data: { estado: estadoFinal },
            });
            await tx.historias_clinicas.update({
              where: { id_historia: idHistoriaVinculada },
              data: { estado: "Finalizado" },
            });
            await tx.citas.updateMany({
              where: { id_historia_vinculada: idHistoriaVinculada },
              data: { seguimiento: false },
            });
          }
        } else {
          await tx.historias_clinicas.update({
            where: { id_historia: historia.id_historia },
            data: { estado: estadoFinal },
          });
        }
      }

      return createdAttention;
    });

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
