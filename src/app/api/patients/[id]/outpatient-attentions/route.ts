import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function normalizeDateOnly(input: unknown): Date | null {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (!raw || raw === "undefined" || raw === "null") return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeOptionalBoolean(input: unknown): boolean | null {
  if (input === true) return true;
  if (input === false) return false;
  return null;
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
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const idPaciente = Number(resolvedParams.id);

    if (!Number.isInteger(idPaciente) || idPaciente <= 0) {
      return NextResponse.json({ message: "ID de paciente inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const idUsuario = session?.user ? Number((session.user as any).id) : NaN;

    if (!session?.user || !Number.isInteger(idUsuario) || idUsuario <= 0) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const profesional = await prisma.profesionales_salud.findFirst({
      where: {
        id_usuario: idUsuario,
        activo: true,
      },
      select: {
        id_profesional: true,
      },
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

    const body = await request.json();
    const {
      id_tipo_atencion,
      id_modalidad_atencion,
      id_sede,
      seguimiento,
      id_historia_vinculada,
      anamnesis_motivo_consulta,
      anamnesis_enfermedad_actual,
      analisis,
      hc_atencion_cierre,
      antecedentes,
      antecedentes_traumaticos,
      diagnosticos,
      hc_ssr_contenido,
      hc_tamizajes_contenido,
      hc_examen_fisico_contenido,
      hc_valoracion_sistemas_contenido,
      llega_por_sus_medios,
      llega_por_sus_medios_cual,
      estado_a_la_llegada,
      caso_accidente_intoxicacion_violencia,
      fecha_ocurrencia_evento,
      lugar_ocurrencia_evento,
      notificacion_policia,
      notificacion_cti,
      notificacion_acudiente,
      notificacion_otro,
      notificacion_otro_cual,
    } = body ?? {};

    const idTipoAtencionNum = Number(id_tipo_atencion);
    if (!Number.isInteger(idTipoAtencionNum) || idTipoAtencionNum <= 0) {
      return NextResponse.json(
        { message: "El tipo de atención es obligatorio" },
        { status: 400 },
      );
    }

    const idModalidadAtencionNum =
      id_modalidad_atencion === null || id_modalidad_atencion === undefined || String(id_modalidad_atencion).trim() === ""
        ? null
        : Number(id_modalidad_atencion);

    if (idModalidadAtencionNum !== null) {
      if (!Number.isInteger(idModalidadAtencionNum) || idModalidadAtencionNum <= 0) {
        return NextResponse.json(
          { message: "Modalidad de atención inválida" },
          { status: 400 },
        );
      }
    }

    const idSedeNum =
      id_sede === null || id_sede === undefined || String(id_sede).trim() === ""
        ? null
        : Number(id_sede);

    if (idSedeNum !== null) {
      if (!Number.isInteger(idSedeNum) || idSedeNum <= 0) {
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

    const idHistoriaVinculadaNum =
      id_historia_vinculada === null || id_historia_vinculada === undefined || String(id_historia_vinculada).trim() === ""
        ? null
        : Number(id_historia_vinculada);

    if (idHistoriaVinculadaNum !== null) {
      if (!Number.isInteger(idHistoriaVinculadaNum) || idHistoriaVinculadaNum <= 0) {
        return NextResponse.json(
          { message: "id_historia_vinculada inválido" },
          { status: 400 },
        );
      }
    }

    const seguimientoBool = seguimiento === true;
    if (seguimientoBool) {
      if (idHistoriaVinculadaNum === null) {
        return NextResponse.json(
          { message: "Debe seleccionar una historia en seguimiento para vincular" },
          { status: 400 },
        );
      }

      const historiaVinculada = await prisma.historias_clinicas.findFirst({
        where: {
          id_historia: idHistoriaVinculadaNum,
          id_paciente: idPaciente,
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

    const tipoHistoria = await prisma.tipos_historia_clinica.findFirst({
      where: { codigo: "HC_CONSULTA_EXTERNA" },
      select: { id_tipo_historia: true },
    });

    if (!tipoHistoria?.id_tipo_historia) {
      return NextResponse.json(
        {
          message:
            "No está configurado el tipo de historia clínica HC_CONSULTA_EXTERNA.",
        },
        { status: 500 },
      );
    }

    const anamnesisMotivoTrimEarly = String(anamnesis_motivo_consulta ?? "").trim();

    const prismaAny = prisma as any;
    let historia = await prismaAny.historias_clinicas.create({
      data: {
        id_paciente: idPaciente,
        id_tipo_historia: tipoHistoria.id_tipo_historia,
        id_profesional_responsable: profesional.id_profesional,
        estado: "Finalizado",
        id_historia_vinculada: seguimientoBool ? idHistoriaVinculadaNum : null,
        motivo_consulta: anamnesisMotivoTrimEarly || null,
      },
    });

    const tipoAtencion = await prisma.tipos_atencion.findUnique({
      where: { id_tipo_atencion: idTipoAtencionNum },
      select: { id_tipo_atencion: true },
    });

    if (!tipoAtencion) {
      return NextResponse.json({ message: "Tipo de atención inválido" }, { status: 400 });
    }

    if (idModalidadAtencionNum !== null) {
      const modalidad = await prisma.modalidades_atencion.findUnique({
        where: { id_modalidad_atencion: idModalidadAtencionNum },
        select: { id_modalidad_atencion: true },
      });

      if (!modalidad) {
        return NextResponse.json(
          { message: "Modalidad de atención inválida" },
          { status: 400 },
        );
      }
    }

    if (typeof llega_por_sus_medios !== "boolean") {
      return NextResponse.json(
        { message: "El campo llega_por_sus_medios es obligatorio" },
        { status: 400 },
      );
    }

    const llegaPorSusMediosCualTrim = String(llega_por_sus_medios_cual ?? "").trim();
    if (llega_por_sus_medios === false && !llegaPorSusMediosCualTrim) {
      return NextResponse.json(
        { message: "Debe especificar cuál cuando llega_por_sus_medios es No" },
        { status: 400 },
      );
    }

    const estadoLlegada = String(estado_a_la_llegada ?? "").trim().toUpperCase();
    const estadosPermitidos = new Set(["CONSCIENTE", "INCONSCIENTE", "MUERTO"]);
    if (!estadoLlegada || !estadosPermitidos.has(estadoLlegada)) {
      return NextResponse.json(
        { message: "El estado_a_la_llegada es obligatorio" },
        { status: 400 },
      );
    }

    if (typeof caso_accidente_intoxicacion_violencia !== "boolean") {
      return NextResponse.json(
        { message: "El campo caso_accidente_intoxicacion_violencia es obligatorio" },
        { status: 400 },
      );
    }

    let fechaOcurrencia: Date | null = null;
    const lugarOcurrenciaTrim = String(lugar_ocurrencia_evento ?? "").trim();
    if (caso_accidente_intoxicacion_violencia === true) {
      fechaOcurrencia = normalizeDateOnly(fecha_ocurrencia_evento);
      if (!fechaOcurrencia) {
        return NextResponse.json(
          {
            message:
              "La fecha_ocurrencia_evento es obligatoria cuando el caso es Sí",
          },
          { status: 400 },
        );
      }

      if (!lugarOcurrenciaTrim) {
        return NextResponse.json(
          {
            message:
              "El lugar_ocurrencia_evento es obligatorio cuando el caso es Sí",
          },
          { status: 400 },
        );
      }
    }

    const notificacionOtroCualTrim = String(notificacion_otro_cual ?? "").trim();
    if (notificacion_otro === true && !notificacionOtroCualTrim) {
      return NextResponse.json(
        {
          message:
            "Debe especificar notificacion_otro_cual cuando notificacion_otro está marcado",
        },
        { status: 400 },
      );
    }

    const anamnesisMotivoTrim = anamnesisMotivoTrimEarly;
    const anamnesisEnfActualTrim = String(anamnesis_enfermedad_actual ?? "").trim();
    const antecedentesArray = Array.isArray(antecedentes) ? antecedentes : [];

    if (!anamnesisMotivoTrim) {
      return NextResponse.json(
        { message: "El motivo de consulta es obligatorio" },
        { status: 400 },
      );
    }

    if (!anamnesisEnfActualTrim) {
      return NextResponse.json(
        { message: "La enfermedad actual es obligatoria" },
        { status: 400 },
      );
    }

    const antecedentesPersonalObsTrim = (() => {
      const found = antecedentesArray.find(
        (a: any) => String(a?.tipo_antecedente ?? "").trim().toUpperCase() === "PERSONAL",
      );
      return String(found?.observacion ?? "").trim();
    })();

    const antecedentesFamiliarObsTrim = (() => {
      const found = antecedentesArray.find(
        (a: any) => String(a?.tipo_antecedente ?? "").trim().toUpperCase() === "FAMILIAR",
      );
      return String(found?.observacion ?? "").trim();
    })();

    if (!antecedentesPersonalObsTrim && !antecedentesFamiliarObsTrim) {
      return NextResponse.json(
        {
          message:
            "Debe diligenciar antecedentes personales o familiares",
        },
        { status: 400 },
      );
    }

    const antecedentesCreate = antecedentesArray
      .map((item: any) => {
        const diagnosticoTrim = String(item?.diagnostico ?? "").trim();
        const tipoTrim = String(item?.tipo_antecedente ?? "").trim();
        const observacionTrim = String(item?.observacion ?? "").trim();

        const isEmpty = !diagnosticoTrim && !tipoTrim && !observacionTrim;
        if (isEmpty) return null;

        return {
          diagnostico: diagnosticoTrim || null,
          tipo_antecedente: tipoTrim || null,
          observacion: observacionTrim || null,
        };
      })
      .filter(Boolean);

    const antecedentesTraumaticosRaw =
      antecedentes_traumaticos && typeof antecedentes_traumaticos === "object"
        ? antecedentes_traumaticos
        : null;

    const naturalezaLesionTrim = String(antecedentesTraumaticosRaw?.naturaleza_lesion ?? "").trim();
    const secuelasTrim = String(antecedentesTraumaticosRaw?.secuelas ?? "").trim();
    const fechaOcurrenciaTrauma = normalizeDateOnly((antecedentesTraumaticosRaw as any)?.fecha_ocurrencia);

    const hasAntecedentesTraumaticos = !!(
      naturalezaLesionTrim ||
      secuelasTrim ||
      fechaOcurrenciaTrauma
    );

    if (!hasAntecedentesTraumaticos) {
      return NextResponse.json(
        { message: "Debe diligenciar antecedentes traumáticos" },
        { status: 400 },
      );
    }

    const diagnosticosArray = Array.isArray(diagnosticos) ? diagnosticos : [];

    const diagnosticosCreateRaw = diagnosticosArray
      .map((item: any) => {
        const codigoTrim = String(item?.codigo_cie10 ?? "").trim();
        if (!codigoTrim) return null;

        const esPrincipal = item?.es_principal === true;
        const codigoConfirmacionTrim = String(item?.codigo_confirmacion ?? "")
          .trim()
          .toUpperCase();

        const idTipoConfirmacion =
          item?.id_tipo_confirmacion === null || item?.id_tipo_confirmacion === undefined
            ? null
            : Number(item?.id_tipo_confirmacion);

        return {
          codigo_cie10: codigoTrim,
          es_principal: esPrincipal,
          id_tipo_confirmacion:
            Number.isInteger(idTipoConfirmacion) && idTipoConfirmacion! > 0
              ? idTipoConfirmacion
              : null,
          codigo_confirmacion:
            codigoConfirmacionTrim === "CN" ||
            codigoConfirmacionTrim === "CR" ||
            codigoConfirmacionTrim === "ID"
              ? (codigoConfirmacionTrim as any)
              : null,
        };
      })
      .filter(Boolean) as Array<{
      codigo_cie10: string;
      es_principal: boolean;
      id_tipo_confirmacion: number | null;
      codigo_confirmacion: "CN" | "CR" | "ID" | null;
    }>;

    if (diagnosticosCreateRaw.length === 0) {
      return NextResponse.json(
        { message: "Debe agregar al menos un diagnóstico" },
        { status: 400 },
      );
    }

    const resolvedDiagnosticosCreateRaw = await (async () => {
      if (diagnosticosCreateRaw.length === 0) return [];

      const codigos = [...new Set(diagnosticosCreateRaw.map((d) => d.codigo_confirmacion).filter(Boolean))] as Array<
        "CN" | "CR" | "ID"
      >;

      if (codigos.length === 0) {
        return diagnosticosCreateRaw.map(({ codigo_confirmacion, ...rest }) => rest);
      }

      const found = await prisma.tipos_confirmacion_diagnostico.findMany({
        where: { codigo: { in: codigos } },
        select: { codigo: true, id_tipo_confirmacion: true },
      });

      const map = new Map(
        found.map((f) => [String(f.codigo).trim().toUpperCase(), f.id_tipo_confirmacion]),
      );

      return diagnosticosCreateRaw.map((d) => {
        const resolvedId = d.id_tipo_confirmacion
          ? d.id_tipo_confirmacion
          : d.codigo_confirmacion
            ? map.get(d.codigo_confirmacion) ?? null
            : null;

        return {
          codigo_cie10: d.codigo_cie10,
          es_principal: d.es_principal,
          id_tipo_confirmacion: resolvedId,
        };
      });
    })();

    const diagnosticosCreate = (() => {
      if (resolvedDiagnosticosCreateRaw.length === 0) return [];
      const idxPrincipal = resolvedDiagnosticosCreateRaw.findIndex((d) => d.es_principal);
      if (idxPrincipal < 0) return resolvedDiagnosticosCreateRaw;
      return resolvedDiagnosticosCreateRaw.map((d, idx) => ({
        ...d,
        es_principal: idx === idxPrincipal,
      }));
    })();

    if (diagnosticosCreate.length > 0) {
      const codigos = [...new Set(diagnosticosCreate.map((d) => d.codigo_cie10))];
      const found = await prisma.cie10.findMany({
        where: { codigo: { in: codigos } },
        select: { codigo: true },
      });
      const foundSet = new Set(found.map((f) => f.codigo));
      const missing = codigos.filter((c) => !foundSet.has(c));
      if (missing.length > 0) {
        return NextResponse.json(
          { message: `Códigos CIE-10 inválidos: ${missing.join(", ")}` },
          { status: 400 },
        );
      }
    }

    try {
      const historiaUpdateData: Record<string, any> = {};

      const historiaMotivoActual = String((historia as any)?.motivo_consulta ?? "").trim();
      if (!historiaMotivoActual && anamnesisMotivoTrim) {
        historiaUpdateData.motivo_consulta = anamnesisMotivoTrim;
      }

      if (anamnesisEnfActualTrim) historiaUpdateData.enfermedad_actual = anamnesisEnfActualTrim;
      if (antecedentesPersonalObsTrim) historiaUpdateData.antecedentes_personales = antecedentesPersonalObsTrim;
      if (antecedentesFamiliarObsTrim) historiaUpdateData.antecedentes_familiares = antecedentesFamiliarObsTrim;

      const cierreRawForEstado = hc_atencion_cierre && typeof hc_atencion_cierre === "object" ? hc_atencion_cierre : null;
      const cierreSegOpcionTrimForEstado = String((cierreRawForEstado as any)?.seguimiento_opcion ?? "").trim();
      const cierreSegEfectivoForEstado = normalizeOptionalBoolean(
        (cierreRawForEstado as any)?.seguimiento_efectivo,
      );
      const cierreSegCierreForEstado = normalizeOptionalBoolean((cierreRawForEstado as any)?.cierre_seguimiento);
      const resolvedEstado = resolveHistoriaEstadoFromSeguimiento({
        seguimientoOpcion: cierreSegOpcionTrimForEstado,
        seguimientoEfectivo: cierreSegEfectivoForEstado,
        cierreSeguimiento: cierreSegCierreForEstado,
      });
      if (resolvedEstado) historiaUpdateData.estado = resolvedEstado;

      if (Object.keys(historiaUpdateData).length > 0) {
        historia = await prisma.historias_clinicas.update({
          where: { id_historia: historia.id_historia },
          data: historiaUpdateData,
        });
      }
    } catch {
      // ignore
    }

    const hcSsrTrim = String(hc_ssr_contenido ?? "").trim();
    const hcTamizajesTrim = String(hc_tamizajes_contenido ?? "").trim();
    const hcExamenFisicoTrim = String(hc_examen_fisico_contenido ?? "").trim();
    const hcValoracionSistemasTrim = String(hc_valoracion_sistemas_contenido ?? "").trim();

    if (!hcTamizajesTrim) {
      return NextResponse.json(
        { message: "Debe diligenciar los tamizajes" },
        { status: 400 },
      );
    }

    if (!hcExamenFisicoTrim) {
      return NextResponse.json(
        { message: "Debe diligenciar el examen físico" },
        { status: 400 },
      );
    }

    if (!hcValoracionSistemasTrim) {
      return NextResponse.json(
        { message: "Debe diligenciar la revisión por sistemas" },
        { status: 400 },
      );
    }

    const habitosParsed = (() => {
      if (!hcSsrTrim) return null;
      try {
        const parsed = JSON.parse(hcSsrTrim);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
        return parsed as any;
      } catch {
        return null;
      }
    })();

    const habitosData = (() => {
      if (!habitosParsed) return null;

      const tabaco = String(habitosParsed.habitos_tabaco_cigarrillo ?? "").trim();
      const alcohol = String(habitosParsed.habitos_alcohol ?? "").trim();
      const sustancias = String(habitosParsed.habitos_sustancias_psicoactivas ?? "").trim();
      const otros = String(habitosParsed.habitos_otros ?? "").trim();
      const actividad = String(habitosParsed.habitos_actividad_fisica ?? "").trim();
      const alimentacion = String(habitosParsed.habitos_alimentacion ?? "").trim();
      const otrasActividades = String(habitosParsed.habitos_otras_actividades ?? "").trim();

      const hasAny = !!(
        tabaco ||
        alcohol ||
        sustancias ||
        otros ||
        actividad ||
        alimentacion ||
        otrasActividades
      );

      if (!hasAny) return null;

      return {
        tabaco_cigarrillo: tabaco || null,
        alcohol: alcohol || null,
        sustancias_psicoactivas: sustancias || null,
        otros: otros || null,
        actividad_fisica: actividad || null,
        alimentacion: alimentacion || null,
        otras_actividades: otrasActividades || null,
      };
    })();

    const cierreRaw = hc_atencion_cierre && typeof hc_atencion_cierre === "object" ? hc_atencion_cierre : null;
    const cierreConductaTrim = String((cierreRaw as any)?.conducta_plan_estudio_manejo ?? "").trim();
    const cierreRecomendacionesTrim = String((cierreRaw as any)?.recomendaciones ?? "").trim();
    const cierreCertRecomTrim = String((cierreRaw as any)?.certificado_recomendaciones ?? "").trim();

    const cierreCertEmitidoRaw = (cierreRaw as any)?.certificado_emitido;
    const cierreCertEmitido =
      cierreCertEmitidoRaw === true
        ? true
        : cierreCertEmitidoRaw === false
          ? false
          : null;

    const cierreCertOpcionTrim = String((cierreRaw as any)?.certificado_opcion ?? "").trim();

    const cierreNotifEmitidaRaw = (cierreRaw as any)?.notificacion_emitida;
    const cierreNotifEmitida =
      cierreNotifEmitidaRaw === true
        ? true
        : cierreNotifEmitidaRaw === false
          ? false
          : null;

    const cierreSegNotifTrim = String((cierreRaw as any)?.seguimiento_notificacion ?? "").trim();
    const cierreNotifObsTrim = String((cierreRaw as any)?.notificacion_observaciones ?? "").trim();
    const cierreSegOpcionTrim = String((cierreRaw as any)?.seguimiento_opcion ?? "").trim();
    const cierreSegEfectivo = normalizeOptionalBoolean((cierreRaw as any)?.seguimiento_efectivo);
    const cierreSegCierre = normalizeOptionalBoolean((cierreRaw as any)?.cierre_seguimiento);
    const cierreSegFecha = normalizeDateOnly((cierreRaw as any)?.seguimiento_fecha);

    if (!cierreSegOpcionTrim) {
      return NextResponse.json(
        { message: "El tipo de seguimiento es obligatorio" },
        { status: 400 },
      );
    }

    const hasCierre = !!(
      cierreConductaTrim ||
      cierreRecomendacionesTrim ||
      cierreCertRecomTrim ||
      cierreCertEmitido !== null ||
      cierreCertOpcionTrim ||
      cierreNotifEmitida !== null ||
      cierreSegNotifTrim ||
      cierreNotifObsTrim ||
      cierreSegOpcionTrim ||
      cierreSegEfectivo !== null ||
      cierreSegCierre !== null ||
      cierreSegFecha
    );

    if (!cierreConductaTrim) {
      return NextResponse.json(
        { message: "La conducta / plan de manejo es obligatoria" },
        { status: 400 },
      );
    }

    const analisisTrim = String(analisis ?? "").trim();
    if (!analisisTrim) {
      return NextResponse.json(
        { message: "El análisis es obligatorio" },
        { status: 400 },
      );
    }

    const cita = await prisma.citas.create({
      data: {
        id_paciente: idPaciente,
        id_profesional: profesional.id_profesional,
        id_sede: idSedeNum,
        id_tipo_cita: null,
        id_estado_cita: null,
        id_modalidad_atencion: idModalidadAtencionNum,
        id_programa_salud: null,
        fecha_hora_inicio: new Date(),
        fecha_hora_fin: null,
        seguimiento: seguimientoBool,
        tipo_seguimiento: null,
        canal_recordatorio: null,
        id_historia_vinculada: null,
        tipos_atencionId_tipo_atencion: idTipoAtencionNum,
      } as any,
    });

    const atencion = await prisma.atenciones_salud.create({
      data: {
        id_historia: historia.id_historia,
        id_cita: cita.id_cita,
        id_profesional: profesional.id_profesional,
        id_tipo_atencion: idTipoAtencionNum,
        id_modalidad_atencion: idModalidadAtencionNum,
        analisis: analisisTrim || null,
        llega_por_sus_medios: llega_por_sus_medios,
        llega_por_sus_medios_cual: llega_por_sus_medios === false ? llegaPorSusMediosCualTrim : null,
        estado_a_la_llegada: estadoLlegada,
        caso_accidente_intoxicacion_violencia: caso_accidente_intoxicacion_violencia,
        fecha_ocurrencia_evento: caso_accidente_intoxicacion_violencia === true ? fechaOcurrencia : null,
        lugar_ocurrencia_evento: caso_accidente_intoxicacion_violencia === true ? lugarOcurrenciaTrim : null,
        notificacion_policia: caso_accidente_intoxicacion_violencia === true ? notificacion_policia === true : null,
        notificacion_cti: caso_accidente_intoxicacion_violencia === true ? notificacion_cti === true : null,
        notificacion_acudiente:
          caso_accidente_intoxicacion_violencia === true ? notificacion_acudiente === true : null,
        notificacion_otro: caso_accidente_intoxicacion_violencia === true ? notificacion_otro === true : null,
        notificacion_otro_cual:
          caso_accidente_intoxicacion_violencia === true && notificacion_otro === true
            ? notificacionOtroCualTrim
            : null,
        hc_anamnesis_atencion:
          anamnesisMotivoTrim || anamnesisEnfActualTrim
            ? {
                create: {
                  motivo_consulta: anamnesisMotivoTrim || null,
                  enfermedad_actual: anamnesisEnfActualTrim || null,
                },
              }
            : undefined,
        hc_antecedentes_atencion:
          antecedentesCreate.length > 0
            ? {
                create: antecedentesCreate as any,
              }
            : undefined,
        hc_antecedentes_traumaticos_atencion:
          hasAntecedentesTraumaticos
            ? {
                create: {
                  naturaleza_lesion: naturalezaLesionTrim || null,
                  fecha_ocurrencia: fechaOcurrenciaTrauma,
                  secuelas: secuelasTrim || null,
                },
              }
            : undefined,
        hc_atencion_cierre:
          hasCierre
            ? {
                create: {
                  conducta_plan_estudio_manejo: cierreConductaTrim || null,
                  recomendaciones: cierreRecomendacionesTrim || null,
                  certificado_recomendaciones: cierreCertRecomTrim || null,
                  certificado_emitido: cierreCertEmitido,
                  certificado_opcion: cierreCertEmitido === true ? cierreCertOpcionTrim || null : null,
                  notificacion_emitida: cierreNotifEmitida,
                  seguimiento_notificacion: cierreNotifEmitida === true ? cierreSegNotifTrim || null : null,
                  notificacion_observaciones: cierreNotifObsTrim || null,
                  seguimiento_opcion: cierreSegOpcionTrim || null,
                  seguimiento_efectivo: cierreSegEfectivo,
                  cierre_seguimiento: cierreSegCierre,
                  seguimiento_fecha: cierreSegFecha,
                },
              }
            : undefined,
        diagnosticos_atencion:
          diagnosticosCreate.length > 0
            ? {
                create: diagnosticosCreate,
              }
            : undefined,
        hc_ssr_atencion: hcSsrTrim ? { create: { contenido: hcSsrTrim } } : undefined,
        hc_habitos_atencion: habitosData ? { create: habitosData } : undefined,
        hc_tamizajes_atencion: hcTamizajesTrim ? { create: { contenido: hcTamizajesTrim } } : undefined,
        hc_examen_fisico_atencion: hcExamenFisicoTrim ? { create: { contenido: hcExamenFisicoTrim } } : undefined,
        hc_valoracion_sistemas_atencion: hcValoracionSistemasTrim ? { create: { contenido: hcValoracionSistemasTrim } } : undefined,
      } as any,
    });

    // Actualizar estado de la historia según el seguimiento
    const resolvedEstado = (() => {
      const opt = String(cierreSegOpcionTrim ?? "").trim().toUpperCase();
      if (!opt) return null;
      if (opt === "NO_APLICA") return "Finalizado";
      if (cierreSegCierre === true) return "Finalizado";
      if (cierreSegCierre === false) return "Seguimiento";
      return null;
    })();

    // Si hay historia vinculada, la historia actual queda en seguimiento
    const estadoFinal = historia.id_historia_vinculada ? "Seguimiento" : resolvedEstado;

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

    return NextResponse.json({ historia, atencion }, { status: 201 });
  } catch (error) {
    console.error("Error registrando atención sin cita", error);

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
      { message: "Error registrando atención sin cita" },
      { status: 500 },
    );
  }
}
