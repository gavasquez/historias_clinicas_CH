import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireAnyPermission } from "@/lib/auth";
import { resolveClinicalHistoryStatus } from "@/lib/clinical-history-status";
import { resolveAcompananteAtencion } from "@/lib/acompanante-atencion";
import prisma from "@/lib/prisma";

function optionalPositiveInt(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function optionalBoolean(value: unknown) {
  if (value === true || value === "SI" || value === "SÍ") return true;
  if (value === false || value === "NO") return false;
  return null;
}

function optionalDate(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const auth = await requireAnyPermission(request, ["HISTORIAS_REGISTRAR"]);
    if (auth instanceof NextResponse) return auth;

    const resolvedParams = await context.params;
    const idPaciente = Number(resolvedParams.id);
    if (!Number.isInteger(idPaciente) || idPaciente <= 0) {
      return NextResponse.json({ message: "ID de paciente inválido" }, { status: 400 });
    }

    const idUsuario = Number(auth.user.id);
    const profesional = await prisma.profesionales_salud.findFirst({
      where: { id_usuario: idUsuario, activo: true },
      select: { id_profesional: true },
    });
    if (!profesional) {
      return NextResponse.json(
        { message: "El usuario autenticado no tiene un profesional de salud activo asociado." },
        { status: 400 },
      );
    }

    const paciente = await prisma.pacientes.findUnique({
      where: { id_paciente: idPaciente },
      select: { id_paciente: true },
    });
    if (!paciente) {
      return NextResponse.json({ message: "Paciente no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const fechaHora = optionalDate(body?.fecha_hora);
    const idTipoAtencion = optionalPositiveInt(body?.id_tipo_atencion);
    const idModalidadAtencion = optionalPositiveInt(body?.id_modalidad_atencion);
    const idSede = optionalPositiveInt(body?.id_sede);
    const idHistoriaVinculada = optionalPositiveInt(body?.id_historia_vinculada);
    const motivoAtencion = String(body?.motivo_atencion ?? "").trim();
    const observacionAnalisis = String(body?.observacion_analisis ?? "").trim();
    const analisis = String(body?.analisis ?? "").trim();
    const recomendaciones = String(body?.recomendaciones ?? "").trim();
    const seguimientoOpcion = String(body?.seguimiento_opcion ?? "").trim();
    const seguimientoEfectivo = optionalBoolean(body?.seguimiento_efectivo);
    const cierreSeguimiento = optionalBoolean(body?.cierre_seguimiento);
    const seguimientoFecha = optionalDate(body?.seguimiento_fecha);
    const seguimientoObservaciones = String(body?.seguimiento_observaciones ?? "").trim();

    if (!fechaHora) return NextResponse.json({ message: "Fecha de atención inválida" }, { status: 400 });
    if (!idTipoAtencion) return NextResponse.json({ message: "El tipo de atención es obligatorio" }, { status: 400 });
    if (!idModalidadAtencion) return NextResponse.json({ message: "La modalidad de atención es obligatoria" }, { status: 400 });
    if (!motivoAtencion) return NextResponse.json({ message: "El motivo de atención es obligatorio" }, { status: 400 });
    if (!analisis) return NextResponse.json({ message: "El análisis es obligatorio" }, { status: 400 });

    const [tipoHistoria, tipoAtencion, modalidad, sede] = await Promise.all([
      prisma.tipos_historia_clinica.findUnique({ where: { codigo: "REG_ATENCION_SALUD" } }),
      prisma.tipos_atencion.findUnique({ where: { id_tipo_atencion: idTipoAtencion } }),
      prisma.modalidades_atencion.findUnique({ where: { id_modalidad_atencion: idModalidadAtencion } }),
      idSede ? prisma.sedes.findUnique({ where: { id_sede: idSede } }) : Promise.resolve(null),
    ]);

    if (!tipoHistoria) return NextResponse.json({ message: "No está configurado REG_ATENCION_SALUD" }, { status: 500 });
    if (!tipoAtencion) return NextResponse.json({ message: "Tipo de atención inválido" }, { status: 400 });
    if (!modalidad) return NextResponse.json({ message: "Modalidad de atención inválida" }, { status: 400 });
    if (idSede && !sede) return NextResponse.json({ message: "Sede inválida" }, { status: 400 });

    if (idHistoriaVinculada) {
      const vinculada = await prisma.historias_clinicas.findFirst({
        where: {
          id_historia: idHistoriaVinculada,
          id_paciente: idPaciente,
          estado: "Seguimiento",
          tipos_historia_clinica: { codigo: "REG_ATENCION_SALUD" },
        },
        select: { id_historia: true },
      });
      if (!vinculada) {
        return NextResponse.json(
          { message: "La historia vinculada no existe, no pertenece al paciente o no está en seguimiento" },
          { status: 400 },
        );
      }
    }

    const diagnosticos = (Array.isArray(body?.diagnosticos) ? body.diagnosticos : [])
      .map((diagnostico: {
        codigo_cie10?: unknown;
        es_principal?: unknown;
        codigo_confirmacion?: unknown;
      }) => {
        const codigo = String(diagnostico?.codigo_cie10 ?? "").trim();
        const codigoConfirmacion = String(diagnostico?.codigo_confirmacion ?? "")
          .trim()
          .toUpperCase();
        return codigo
          ? {
              codigo_cie10: codigo,
              es_principal: diagnostico?.es_principal === true,
              codigo_confirmacion: codigoConfirmacion,
            }
          : null;
      })
      .filter(Boolean) as Array<{
        codigo_cie10: string;
        es_principal: boolean;
        codigo_confirmacion: string;
      }>;

    if (diagnosticos.length === 0) {
      return NextResponse.json({ message: "Debe agregar al menos un diagnóstico" }, { status: 400 });
    }
    if (diagnosticos.filter((diagnostico) => diagnostico.es_principal).length !== 1) {
      return NextResponse.json(
        { message: "Debe seleccionar exactamente un diagnóstico principal." },
        { status: 400 },
      );
    }

    const codigosConfirmacionPermitidos = new Set(["CN", "CR", "ID"]);
    if (
      diagnosticos.some(
        (diagnostico) =>
          !codigosConfirmacionPermitidos.has(diagnostico.codigo_confirmacion),
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

    const diagnosticosPersistencia = diagnosticos.map((diagnostico) => ({
      codigo_cie10: diagnostico.codigo_cie10,
      es_principal: diagnostico.es_principal,
      id_tipo_confirmacion: confirmacionesMap.get(diagnostico.codigo_confirmacion)!,
    }));

    const acompananteRes = await resolveAcompananteAtencion(body?.acompanante, idPaciente);
    if (acompananteRes.error) {
      return NextResponse.json({ message: acompananteRes.error }, { status: 400 });
    }
    const acompananteData = acompananteRes.data;

    const codigos = [...new Set(diagnosticos.map((diagnostico) => diagnostico.codigo_cie10))];
    const encontrados = await prisma.cie10.findMany({
      where: { codigo: { in: codigos } },
      select: { codigo: true },
    });
    const encontradosSet = new Set(encontrados.map((diagnostico) => diagnostico.codigo));
    const faltantes = codigos.filter((codigo) => !encontradosSet.has(codigo));
    if (faltantes.length > 0) {
      return NextResponse.json(
        { message: `Códigos CIE-10 inválidos: ${faltantes.join(", ")}` },
        { status: 400 },
      );
    }

    const estadoCalculado = resolveClinicalHistoryStatus({
      seguimientoOpcion,
      cierreSeguimiento,
    });
    const estado = idHistoriaVinculada ? "Seguimiento" : estadoCalculado ?? "Finalizado";

    const result = await prisma.$transaction(async (transaction) => {
      const historia = await transaction.historias_clinicas.create({
        data: {
          id_paciente: idPaciente,
          id_tipo_historia: tipoHistoria.id_tipo_historia,
          id_profesional_responsable: profesional.id_profesional,
          id_historia_vinculada: idHistoriaVinculada,
          motivo_consulta: motivoAtencion,
          estado,
        },
      });

      const atencion = await transaction.atenciones_salud.create({
        data: {
          id_historia: historia.id_historia,
          id_cita: null,
          id_sede: idSede,
          id_profesional: profesional.id_profesional,
          id_tipo_atencion: idTipoAtencion,
          id_modalidad_atencion: idModalidadAtencion,
          fecha_hora: fechaHora,
          analisis,
          observacion_analisis: observacionAnalisis || null,
          hc_anamnesis_atencion: {
            create: { motivo_consulta: motivoAtencion, enfermedad_actual: null },
          },
          hc_atencion_cierre: {
            create: {
              recomendaciones: recomendaciones || null,
              seguimiento_opcion: seguimientoOpcion || null,
              seguimiento_efectivo: seguimientoEfectivo,
              cierre_seguimiento: cierreSeguimiento,
              seguimiento_fecha: seguimientoFecha,
              seguimiento_observaciones: seguimientoObservaciones || null,
            },
          },
          diagnosticos_atencion: { create: diagnosticosPersistencia },
          acompanante_atencion: acompananteData ? { create: acompananteData } : undefined,
        },
        include: {
          hc_anamnesis_atencion: true,
          hc_atencion_cierre: true,
          acompanante_atencion: true,
          diagnosticos_atencion: { include: { cie10: true }, orderBy: { es_principal: "desc" } },
        },
      });

      if (idHistoriaVinculada) {
        await transaction.historias_clinicas.update({
          where: { id_historia: idHistoriaVinculada },
          data: { estado: "Finalizado" },
        });
        await transaction.citas.updateMany({
          where: { id_historia_vinculada: idHistoriaVinculada },
          data: { seguimiento: false },
        });
      }

      return { historia, atencion };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creando registro de atención sin cita", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { message: "No se pudo guardar el registro por un error de base de datos.", code: error.code },
        { status: 500 },
      );
    }
    return NextResponse.json({ message: "Error creando registro de atención" }, { status: 500 });
  }
}
