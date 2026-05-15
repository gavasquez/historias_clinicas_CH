import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function normalizeDateOnly(input: unknown): Date | null {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (!raw || raw === "undefined" || raw === "null") return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
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
    const prismaAny = prisma as any;
    const resolvedParams = await (context as any).params;
    const idCita = Number(resolvedParams.id);

    if (!Number.isInteger(idCita) || idCita <= 0) {
      return NextResponse.json({ message: "ID de cita inválido" }, { status: 400 });
    }

    const body = await request.json();
    const {
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
    } = body;

    const cita = await prisma.citas.findUnique({
      where: { id_cita: idCita },
    });

    if (!cita) {
      return NextResponse.json({ message: "Cita no encontrada" }, { status: 404 });
    }

    const idTipoAtencionNum = cita.id_tipo_cita ? Number(cita.id_tipo_cita) : NaN;
    if (!Number.isInteger(idTipoAtencionNum) || idTipoAtencionNum <= 0) {
      return NextResponse.json(
        { message: "La cita no tiene tipo de cita para determinar el tipo de atención." },
        { status: 400 },
      );
    }

    const anamnesisMotivoTrimEarly = String(anamnesis_motivo_consulta ?? "").trim();

    // Regla de negocio: toda atención desde cita debe guardarse sobre
    // historia clínica de consulta externa.
    const tipoHistoria = await prisma.tipos_historia_clinica.findFirst({
      where: { codigo: "HC_CONSULTA_EXTERNA" },
    });

    if (!tipoHistoria) {
      return NextResponse.json(
        {
          message:
            "No está configurado el tipo de historia clínica HC_CONSULTA_EXTERNA.",
        },
        { status: 500 },
      );
    }

    const existingAttention = await prisma.atenciones_salud.findFirst({
      where: { id_cita: cita.id_cita },
      orderBy: { id_atencion: "desc" },
      select: { id_atencion: true, id_historia: true },
    });

    let historia = existingAttention?.id_historia
      ? await prisma.historias_clinicas.findUnique({
          where: { id_historia: existingAttention.id_historia },
        })
      : null;

    if (!historia) {
      historia = await prismaAny.historias_clinicas.create({
        data: {
          id_paciente: cita.id_paciente,
          id_tipo_historia: tipoHistoria.id_tipo_historia,
          id_profesional_responsable: cita.id_profesional,
          estado: "Finalizado",
          id_historia_vinculada: (cita as any)?.id_historia_vinculada ?? null,
          motivo_consulta: anamnesisMotivoTrimEarly || null,
        },
      });
    }

    if (!historia?.id_historia) {
      return NextResponse.json(
        { message: "No se pudo resolver la historia clínica para registrar la atención." },
        { status: 500 },
      );
    }

    const tipoAtencion = await prisma.tipos_atencion.findUnique({
      where: { id_tipo_atencion: idTipoAtencionNum },
    });

    if (!tipoAtencion) {
      return NextResponse.json({ message: "Tipo de atención inválido" }, { status: 400 });
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
      if (fecha_ocurrencia_evento) {
        const parsed = new Date(fecha_ocurrencia_evento);
        if (!Number.isNaN(parsed.getTime())) {
          fechaOcurrencia = parsed;
        }
      }

      if (!fechaOcurrencia) {
        return NextResponse.json(
          { message: "La fecha_ocurrencia_evento es obligatoria cuando el caso es Sí" },
          { status: 400 },
        );
      }

      if (!lugarOcurrenciaTrim) {
        return NextResponse.json(
          { message: "El lugar_ocurrencia_evento es obligatorio cuando el caso es Sí" },
          { status: 400 },
        );
      }
    }

    const notificacionOtroCualTrim = String(notificacion_otro_cual ?? "").trim();
    if (notificacion_otro === true && !notificacionOtroCualTrim) {
      return NextResponse.json(
        { message: "Debe especificar notificacion_otro_cual cuando notificacion_otro está marcado" },
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
        { message: "Debe diligenciar antecedentes personales o familiares" },
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

    const antecedentesTraumaticosRaw = antecedentes_traumaticos && typeof antecedentes_traumaticos === "object"
      ? antecedentes_traumaticos
      : null;
    const naturalezaLesionTrim = String(antecedentesTraumaticosRaw?.naturaleza_lesion ?? "").trim();
    const secuelasTrim = String(antecedentesTraumaticosRaw?.secuelas ?? "").trim();
    const fechaOcurrenciaTraumaRaw = (antecedentesTraumaticosRaw as any)?.fecha_ocurrencia;
    const fechaOcurrenciaTrauma = (() => {
      if (fechaOcurrenciaTraumaRaw === null || fechaOcurrenciaTraumaRaw === undefined) return null;

      if (fechaOcurrenciaTraumaRaw instanceof Date) {
        return Number.isNaN(fechaOcurrenciaTraumaRaw.getTime()) ? null : fechaOcurrenciaTraumaRaw;
      }

      const rawTrim = String(fechaOcurrenciaTraumaRaw).trim();
      if (!rawTrim || rawTrim === "undefined" || rawTrim === "null") return null;

      const parsed = new Date(rawTrim);
      if (!(parsed instanceof Date) || typeof (parsed as any).getTime !== "function") return null;
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    })();
    const hasAntecedentesTraumaticos = !!(naturalezaLesionTrim || secuelasTrim || fechaOcurrenciaTrauma);

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
            codigoConfirmacionTrim === "CN" || codigoConfirmacionTrim === "CR" || codigoConfirmacionTrim === "ID"
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
      const map = new Map(found.map((f) => [String(f.codigo).trim().toUpperCase(), f.id_tipo_confirmacion]));

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

    // Solo un diagnóstico puede quedar como principal
    const diagnosticosCreate = (() => {
      if (resolvedDiagnosticosCreateRaw.length === 0) return [];
      const idxPrincipal = resolvedDiagnosticosCreateRaw.findIndex((d) => d.es_principal);
      if (idxPrincipal < 0) return resolvedDiagnosticosCreateRaw;
      return resolvedDiagnosticosCreateRaw.map((d, idx) => ({ ...d, es_principal: idx === idxPrincipal }));
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

    // Guardar también resumen en historias_clinicas (lo que se muestra en /patients/[id]/records)
    // Solo actualiza campos cuando se envían con contenido.
    try {
      const historiaUpdateData: Record<string, any> = {};

      const historiaMotivoActual = String((historia as any)?.motivo_consulta ?? "").trim();
      if (!historiaMotivoActual && anamnesisMotivoTrim) {
        historiaUpdateData.motivo_consulta = anamnesisMotivoTrim;
      }

      if (anamnesisEnfActualTrim) historiaUpdateData.enfermedad_actual = anamnesisEnfActualTrim;
      if (antecedentesPersonalObsTrim) {
        historiaUpdateData.antecedentes_personales = antecedentesPersonalObsTrim;
      }
      if (antecedentesFamiliarObsTrim) {
        historiaUpdateData.antecedentes_familiares = antecedentesFamiliarObsTrim;
      }

      const cierreRawForEstado =
        hc_atencion_cierre && typeof hc_atencion_cierre === "object" ? hc_atencion_cierre : null;
      const cierreSegOpcionTrimForEstado = String(
        (cierreRawForEstado as any)?.seguimiento_opcion ?? "",
      ).trim();
      const cierreSegEfectivoForEstado = normalizeOptionalBoolean(
        (cierreRawForEstado as any)?.seguimiento_efectivo,
      );
      const cierreSegCierreForEstado = normalizeOptionalBoolean(
        (cierreRawForEstado as any)?.cierre_seguimiento,
      );

      const resolvedEstado = resolveHistoriaEstadoFromSeguimiento({
        seguimientoOpcion: cierreSegOpcionTrimForEstado,
        seguimientoEfectivo: cierreSegEfectivoForEstado,
        cierreSeguimiento: cierreSegCierreForEstado,
      });
      if (resolvedEstado) {
        historiaUpdateData.estado = resolvedEstado;
      }

      if (Object.keys(historiaUpdateData).length > 0) {
        historia = await prisma.historias_clinicas.update({
          where: { id_historia: historia.id_historia },
          data: historiaUpdateData,
        });

        // Si la historia actual está vinculada a otra, actualizamos ambas
        if (historia.id_historia_vinculada) {
          const idHistoriaVinculada = Number(historia.id_historia_vinculada);
          if (Number.isInteger(idHistoriaVinculada) && idHistoriaVinculada > 0) {
            try {
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
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (e) {
      console.error("Error actualizando resumen de historia clinica", e);
      // No interrumpimos el guardado de la atención
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
    const cierreRecomendacionesTrim = String(cierreRaw?.recomendaciones ?? "").trim();
    const cierreCertRecomTrim = String(cierreRaw?.certificado_recomendaciones ?? "").trim();
    const cierreCertEmitidoRaw = (cierreRaw as any)?.certificado_emitido;
    const cierreCertEmitido =
      cierreCertEmitidoRaw === true ? true : cierreCertEmitidoRaw === false ? false : null;
    const cierreCertOpcionTrim = String((cierreRaw as any)?.certificado_opcion ?? "").trim();
    const cierreNotifEmitidaRaw = (cierreRaw as any)?.notificacion_emitida;
    const cierreNotifEmitida =
      cierreNotifEmitidaRaw === true ? true : cierreNotifEmitidaRaw === false ? false : null;
    const cierreSegNotifTrim = String((cierreRaw as any)?.seguimiento_notificacion ?? "").trim();
    const cierreNotifObsTrim = String((cierreRaw as any)?.notificacion_observaciones ?? "").trim();
    const cierreSegOpcionTrim = String(cierreRaw?.seguimiento_opcion ?? "").trim();
    const cierreSegEfectivo = normalizeOptionalBoolean((cierreRaw as any)?.seguimiento_efectivo);
    const cierreSegCierre = normalizeOptionalBoolean((cierreRaw as any)?.cierre_seguimiento);
    const cierreSegFechaRaw = (cierreRaw as any)?.seguimiento_fecha;
    const cierreSegFecha = cierreSegFechaRaw ? normalizeDateOnly(cierreSegFechaRaw) : null;

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

    const atencion = existingAttention?.id_atencion
      ? await prisma.atenciones_salud.update({
          where: { id_atencion: existingAttention.id_atencion },
          data: {
            id_historia: historia.id_historia,
            id_cita: cita.id_cita,
            id_profesional: cita.id_profesional,
            id_tipo_atencion: idTipoAtencionNum,
            id_modalidad_atencion: cita.id_modalidad_atencion ?? null,
            analisis: analisisTrim || null,
            llega_por_sus_medios: llega_por_sus_medios,
            llega_por_sus_medios_cual:
              llega_por_sus_medios === false ? llegaPorSusMediosCualTrim : null,
            estado_a_la_llegada: estadoLlegada,
            caso_accidente_intoxicacion_violencia: caso_accidente_intoxicacion_violencia,
            fecha_ocurrencia_evento:
              caso_accidente_intoxicacion_violencia === true ? fechaOcurrencia : null,
            lugar_ocurrencia_evento:
              caso_accidente_intoxicacion_violencia === true ? lugarOcurrenciaTrim : null,
            notificacion_policia:
              caso_accidente_intoxicacion_violencia === true ? notificacion_policia === true : null,
            notificacion_cti:
              caso_accidente_intoxicacion_violencia === true ? notificacion_cti === true : null,
            notificacion_acudiente:
              caso_accidente_intoxicacion_violencia === true ? notificacion_acudiente === true : null,
            notificacion_otro:
              caso_accidente_intoxicacion_violencia === true ? notificacion_otro === true : null,
            notificacion_otro_cual:
              caso_accidente_intoxicacion_violencia === true && notificacion_otro === true
                ? notificacionOtroCualTrim
                : null,
          } as any,
        })
      : await prisma.atenciones_salud.create({
          data: {
            id_historia: historia.id_historia,
            id_cita: cita.id_cita,
            id_profesional: cita.id_profesional,
            id_tipo_atencion: idTipoAtencionNum,
            id_modalidad_atencion: cita.id_modalidad_atencion ?? null,
            analisis: analisisTrim || null,
            llega_por_sus_medios: llega_por_sus_medios,
            llega_por_sus_medios_cual:
              llega_por_sus_medios === false ? llegaPorSusMediosCualTrim : null,
            estado_a_la_llegada: estadoLlegada,
            caso_accidente_intoxicacion_violencia: caso_accidente_intoxicacion_violencia,
            fecha_ocurrencia_evento:
              caso_accidente_intoxicacion_violencia === true ? fechaOcurrencia : null,
            lugar_ocurrencia_evento:
              caso_accidente_intoxicacion_violencia === true ? lugarOcurrenciaTrim : null,
            notificacion_policia:
              caso_accidente_intoxicacion_violencia === true ? notificacion_policia === true : null,
            notificacion_cti:
              caso_accidente_intoxicacion_violencia === true ? notificacion_cti === true : null,
            notificacion_acudiente:
              caso_accidente_intoxicacion_violencia === true ? notificacion_acudiente === true : null,
            notificacion_otro:
              caso_accidente_intoxicacion_violencia === true ? notificacion_otro === true : null,
            notificacion_otro_cual:
              caso_accidente_intoxicacion_violencia === true && notificacion_otro === true
                ? notificacionOtroCualTrim
                : null,
          } as any,
        });

    const idAtencion = atencion.id_atencion;

    await prisma.hc_anamnesis_atencion.upsert({
      where: { id_atencion: idAtencion },
      create: {
        id_atencion: idAtencion,
        motivo_consulta: anamnesisMotivoTrim || null,
        enfermedad_actual: anamnesisEnfActualTrim || null,
      },
      update: {
        motivo_consulta: anamnesisMotivoTrim || null,
        enfermedad_actual: anamnesisEnfActualTrim || null,
      },
    });

    await prisma.hc_ssr_atencion.upsert({
      where: { id_atencion: idAtencion },
      create: { id_atencion: idAtencion, contenido: hcSsrTrim },
      update: { contenido: hcSsrTrim },
    });

    await prisma.hc_tamizajes_atencion.upsert({
      where: { id_atencion: idAtencion },
      create: { id_atencion: idAtencion, contenido: hcTamizajesTrim },
      update: { contenido: hcTamizajesTrim },
    });

    await prisma.hc_examen_fisico_atencion.upsert({
      where: { id_atencion: idAtencion },
      create: { id_atencion: idAtencion, contenido: hcExamenFisicoTrim },
      update: { contenido: hcExamenFisicoTrim },
    });

    await prisma.hc_valoracion_sistemas_atencion.upsert({
      where: { id_atencion: idAtencion },
      create: { id_atencion: idAtencion, contenido: hcValoracionSistemasTrim },
      update: { contenido: hcValoracionSistemasTrim },
    });

    if (habitosData) {
      await prisma.hc_habitos_atencion.upsert({
        where: { id_atencion: idAtencion },
        create: { id_atencion: idAtencion, ...habitosData } as any,
        update: habitosData as any,
      });
    }

    await prisma.hc_atencion_cierre.upsert({
      where: { id_atencion: idAtencion },
      create: {
        id_atencion: idAtencion,
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
      } as any,
      update: {
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
      } as any,
    });

    await prisma.hc_antecedentes_atencion.deleteMany({ where: { id_atencion: idAtencion } });
    if (antecedentesCreate.length > 0) {
      await prisma.hc_antecedentes_atencion.createMany({
        data: (antecedentesCreate as any[]).map((row: any) => ({ ...row, id_atencion: idAtencion })),
      });
    }

    await prisma.hc_antecedentes_traumaticos_atencion.upsert({
      where: { id_atencion: idAtencion },
      create: {
        id_atencion: idAtencion,
        naturaleza_lesion: naturalezaLesionTrim || null,
        fecha_ocurrencia: fechaOcurrenciaTrauma,
        secuelas: secuelasTrim || null,
      },
      update: {
        naturaleza_lesion: naturalezaLesionTrim || null,
        fecha_ocurrencia: fechaOcurrenciaTrauma,
        secuelas: secuelasTrim || null,
      },
    });

    await prisma.diagnosticos_atencion.deleteMany({ where: { id_atencion: idAtencion } });
    if (diagnosticosCreate.length > 0) {
      await prisma.diagnosticos_atencion.createMany({
        data: (diagnosticosCreate as any[]).map((row: any) => ({ ...row, id_atencion: idAtencion })),
      });
    }

    // Actualizar estado de la cita según si se cerró la atención.
    // - Si hay cierre: REALIZADA
    // - Si no hay cierre: ATENDIDA
    try {
      const targetCodigo = hasCierre ? "REALIZADA" : "ATENDIDA";
      const targetEstado = await prisma.estados_cita.findFirst({
        where: {
          codigo: {
            equals: targetCodigo,
            mode: "insensitive",
          },
        },
        select: { id_estado_cita: true },
      });

      if (targetEstado?.id_estado_cita) {
        await prisma.citas.update({
          where: { id_cita: cita.id_cita },
          data: { id_estado_cita: targetEstado.id_estado_cita },
        });
      }
    } catch (e) {
      console.error("Error actualizando estado de la cita tras registrar atención", e);
      // No interrumpimos la creación de la atención si falla el update del estado
    }

    return NextResponse.json(
      { historia, atencion },
      { status: existingAttention?.id_atencion ? 200 : 201 },
    );
  } catch (error) {
    console.error("Error registrando atención de la cita", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2021") {
        let diagnostics: any = undefined;
        try {
          const row = await prisma.$queryRaw<
            Array<{
              db: string | null;
              schema: string | null;
              search_path: string | null;
              atenciones_salud: string | null;
              hc_anamnesis_atencion: string | null;
              hc_antecedentes_atencion: string | null;
              hc_antecedentes_traumaticos_atencion: string | null;
              hc_atencion_cierre: string | null;
              hc_ssr_atencion: string | null;
              hc_tamizajes_atencion: string | null;
              hc_examen_fisico_atencion: string | null;
              hc_valoracion_sistemas_atencion: string | null;
              diagnosticos_atencion: string | null;
              historias_clinicas: string | null;
              citas: string | null;
            }>
          >`
            SELECT
              current_database()::text as db,
              current_schema()::text as schema,
              current_setting('search_path')::text as search_path,
              to_regclass('public.atenciones_salud')::text as atenciones_salud,
              to_regclass('public.hc_anamnesis_atencion')::text as hc_anamnesis_atencion,
              to_regclass('public.hc_antecedentes_atencion')::text as hc_antecedentes_atencion,
              to_regclass('public.hc_antecedentes_traumaticos_atencion')::text as hc_antecedentes_traumaticos_atencion,
              to_regclass('public.hc_atencion_cierre')::text as hc_atencion_cierre,
              to_regclass('public.hc_ssr_atencion')::text as hc_ssr_atencion,
              to_regclass('public.hc_tamizajes_atencion')::text as hc_tamizajes_atencion,
              to_regclass('public.hc_examen_fisico_atencion')::text as hc_examen_fisico_atencion,
              to_regclass('public.hc_valoracion_sistemas_atencion')::text as hc_valoracion_sistemas_atencion,
              to_regclass('public.diagnosticos_atencion')::text as diagnosticos_atencion,
              to_regclass('public.historias_clinicas')::text as historias_clinicas,
              to_regclass('public.citas')::text as citas
          `;
          diagnostics = row?.[0] ?? undefined;
        } catch (e) {
          console.error("No se pudieron obtener diagnósticos de conexión (P2021)", e);
        }

        const metaTable = (error.meta as any)?.table ? String((error.meta as any).table) : null;

        const missingTables = (() => {
          if (!diagnostics || typeof diagnostics !== "object") return [] as string[];
          const candidates = [
            "atenciones_salud",
            "hc_anamnesis_atencion",
            "hc_antecedentes_atencion",
            "hc_antecedentes_traumaticos_atencion",
            "hc_atencion_cierre",
            "hc_ssr_atencion",
            "hc_tamizajes_atencion",
            "hc_examen_fisico_atencion",
            "hc_valoracion_sistemas_atencion",
            "diagnosticos_atencion",
            "historias_clinicas",
            "citas",
          ];

          return candidates.filter((k) => (diagnostics as any)[k] === null);
        })();

        const friendlyMissing = missingTables.length > 0 ? missingTables.join(", ") : null;

        return NextResponse.json(
          {
            message: friendlyMissing
              ? `No se pudo guardar la atención porque falta(n) la(s) tabla(s): ${friendlyMissing}. Debes crear/aplicar las migraciones en la BD.`
              : "No se pudo guardar la atención porque la API está conectada a una base de datos donde no existe la tabla requerida. Verifica que el DATABASE_URL apunte a la BD correcta y que el esquema/migraciones estén aplicados.",
            code: error.code,
            table: metaTable,
            diagnostics,
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          message: "No se pudo guardar la atención por un error de base de datos.",
          code: error.code,
        },
        { status: 500 },
      );
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          message:
            "No se pudo conectar a la base de datos. Verifica el DATABASE_URL y que el servidor de BD esté disponible.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Error registrando atención de la cita" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const prismaAny = prisma as any;
    const resolvedParams = await (context as any).params;
    const idCita = Number(resolvedParams.id);

    if (!Number.isInteger(idCita) || idCita <= 0) {
      return NextResponse.json({ message: "ID de cita inválido" }, { status: 400 });
    }

    const body = await request.json();
    const {
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
      notificacion_otro_cual,
    } = body ?? {};

    const cita = await prisma.citas.findUnique({ where: { id_cita: idCita } });
    if (!cita) {
      return NextResponse.json({ message: "Cita no encontrada" }, { status: 404 });
    }

    const idTipoAtencionNum = cita.id_tipo_cita ? Number(cita.id_tipo_cita) : NaN;
    if (!Number.isInteger(idTipoAtencionNum) || idTipoAtencionNum <= 0) {
      return NextResponse.json(
        { message: "La cita no tiene tipo de cita para determinar el tipo de atención." },
        { status: 400 },
      );
    }

    let tipoHistoria = await prisma.tipos_historia_clinica.findUnique({
      where: { id_tipo_historia: idTipoAtencionNum },
    });

    if (!tipoHistoria) {
      tipoHistoria = await prisma.tipos_historia_clinica.findFirst({
        where: { codigo: "HC_CONSULTA_EXTERNA" },
      });
    }

    if (!tipoHistoria) {
      return NextResponse.json(
        {
          message:
            "No está configurado el tipo de historia clínica (no existe tipo por id_tipo_cita y tampoco HC_CONSULTA_EXTERNA).",
        },
        { status: 500 },
      );
    }

    const existingAttention = await prisma.atenciones_salud.findFirst({
      where: { id_cita: idCita },
      orderBy: { id_atencion: "desc" },
      select: { id_atencion: true },
    });

    let historia = null as any;

    if (existingAttention?.id_atencion) {
      const foundAttention = await prisma.atenciones_salud.findUnique({
        where: { id_atencion: existingAttention.id_atencion },
        select: { id_historia: true },
      });

      if (foundAttention?.id_historia) {
        historia = await prisma.historias_clinicas.findUnique({
          where: { id_historia: foundAttention.id_historia },
        });
      }
    }

    if (!historia) {
      const motivoTrim = String(anamnesis_motivo_consulta ?? "").trim();
      historia = await prismaAny.historias_clinicas.create({
        data: {
          id_paciente: cita.id_paciente,
          id_tipo_historia: tipoHistoria.id_tipo_historia,
          id_profesional_responsable: cita.id_profesional,
          estado: "Finalizado",
          id_historia_vinculada: (cita as any)?.id_historia_vinculada ?? null,
          motivo_consulta: motivoTrim || null,
        },
      });
    }

    const scalarUpdate: Prisma.atenciones_saludUncheckedUpdateInput = {};

    if (analisis !== undefined) scalarUpdate.analisis = String(analisis || "") || null;
    if (typeof llega_por_sus_medios === "boolean") scalarUpdate.llega_por_sus_medios = llega_por_sus_medios;
    if (typeof llega_por_sus_medios_cual === "string") {
      scalarUpdate.llega_por_sus_medios_cual = llega_por_sus_medios_cual.trim() || null;
    }
    if (typeof estado_a_la_llegada === "string") {
      scalarUpdate.estado_a_la_llegada = estado_a_la_llegada.trim() || null;
    }
    if (typeof caso_accidente_intoxicacion_violencia === "boolean") {
      scalarUpdate.caso_accidente_intoxicacion_violencia = caso_accidente_intoxicacion_violencia;
    }
    if (fecha_ocurrencia_evento !== undefined) {
      scalarUpdate.fecha_ocurrencia_evento = normalizeDateOnly(fecha_ocurrencia_evento);
    }
    if (typeof lugar_ocurrencia_evento === "string") {
      scalarUpdate.lugar_ocurrencia_evento = lugar_ocurrencia_evento.trim() || null;
    }
    if (typeof notificacion_otro_cual === "string") {
      scalarUpdate.notificacion_otro_cual = notificacion_otro_cual.trim() || null;
    }

    const atencion = existingAttention
      ? await prisma.atenciones_salud.update({
          where: { id_atencion: existingAttention.id_atencion },
          data: scalarUpdate,
        })
      : await prisma.atenciones_salud.create({
          data: {
            id_historia: historia.id_historia,
            id_profesional: cita.id_profesional,
            id_tipo_atencion: idTipoAtencionNum,
            id_modalidad_atencion: cita.id_modalidad_atencion,
            id_cita: idCita,
            ...scalarUpdate,
          } as any,
        });

    const idAtencion = atencion.id_atencion;

    if (anamnesis_motivo_consulta !== undefined || anamnesis_enfermedad_actual !== undefined) {
      await prisma.hc_anamnesis_atencion.upsert({
        where: { id_atencion: idAtencion },
        create: {
          id_atencion: idAtencion,
          motivo_consulta: String(anamnesis_motivo_consulta ?? "").trim() || null,
          enfermedad_actual: String(anamnesis_enfermedad_actual ?? "").trim() || null,
        },
        update: {
          ...(anamnesis_motivo_consulta !== undefined
            ? { motivo_consulta: String(anamnesis_motivo_consulta ?? "").trim() || null }
            : {}),
          ...(anamnesis_enfermedad_actual !== undefined
            ? { enfermedad_actual: String(anamnesis_enfermedad_actual ?? "").trim() || null }
            : {}),
        },
      });
    }

    if (hc_ssr_contenido !== undefined) {
      await prisma.hc_ssr_atencion.upsert({
        where: { id_atencion: idAtencion },
        create: { id_atencion: idAtencion, contenido: String(hc_ssr_contenido || "") },
        update: { contenido: String(hc_ssr_contenido || "") },
      });
    }

    if (hc_tamizajes_contenido !== undefined) {
      await prisma.hc_tamizajes_atencion.upsert({
        where: { id_atencion: idAtencion },
        create: { id_atencion: idAtencion, contenido: String(hc_tamizajes_contenido || "") },
        update: { contenido: String(hc_tamizajes_contenido || "") },
      });
    }

    if (hc_examen_fisico_contenido !== undefined) {
      await prisma.hc_examen_fisico_atencion.upsert({
        where: { id_atencion: idAtencion },
        create: { id_atencion: idAtencion, contenido: String(hc_examen_fisico_contenido || "") },
        update: { contenido: String(hc_examen_fisico_contenido || "") },
      });
    }

    if (hc_valoracion_sistemas_contenido !== undefined) {
      await prisma.hc_valoracion_sistemas_atencion.upsert({
        where: { id_atencion: idAtencion },
        create: { id_atencion: idAtencion, contenido: String(hc_valoracion_sistemas_contenido || "") },
        update: { contenido: String(hc_valoracion_sistemas_contenido || "") },
      });
    }

    if (hc_atencion_cierre !== undefined) {
      const cierre = hc_atencion_cierre && typeof hc_atencion_cierre === "object" ? hc_atencion_cierre : {};
      await prisma.hc_atencion_cierre.upsert({
        where: { id_atencion: idAtencion },
        create: {
          id_atencion: idAtencion,
          conducta_plan_estudio_manejo: String((cierre as any).conducta_plan_estudio_manejo ?? "").trim() || null,
          recomendaciones: String((cierre as any).recomendaciones ?? "").trim() || null,
          certificado_recomendaciones: String((cierre as any).certificado_recomendaciones ?? "").trim() || null,
          certificado_emitido:
            typeof (cierre as any).certificado_emitido === "boolean" ? (cierre as any).certificado_emitido : null,
          certificado_opcion: String((cierre as any).certificado_opcion ?? "").trim() || null,
          notificacion_emitida:
            typeof (cierre as any).notificacion_emitida === "boolean" ? (cierre as any).notificacion_emitida : null,
          seguimiento_notificacion: String((cierre as any).seguimiento_notificacion ?? "").trim() || null,
          notificacion_observaciones: String((cierre as any).notificacion_observaciones ?? "").trim() || null,
          seguimiento_opcion: String((cierre as any).seguimiento_opcion ?? "").trim() || null,
          seguimiento_efectivo: normalizeOptionalBoolean((cierre as any).seguimiento_efectivo),
          cierre_seguimiento: normalizeOptionalBoolean((cierre as any).cierre_seguimiento),
          seguimiento_fecha: (cierre as any).seguimiento_fecha
            ? normalizeDateOnly((cierre as any).seguimiento_fecha)
            : null,
        },
        update: {
          conducta_plan_estudio_manejo:
            (cierre as any).conducta_plan_estudio_manejo !== undefined
              ? String((cierre as any).conducta_plan_estudio_manejo ?? "").trim() || null
              : undefined,
          recomendaciones:
            (cierre as any).recomendaciones !== undefined
              ? String((cierre as any).recomendaciones ?? "").trim() || null
              : undefined,
          certificado_recomendaciones:
            (cierre as any).certificado_recomendaciones !== undefined
              ? String((cierre as any).certificado_recomendaciones ?? "").trim() || null
              : undefined,
          certificado_emitido:
            typeof (cierre as any).certificado_emitido === "boolean"
              ? (cierre as any).certificado_emitido
              : (cierre as any).certificado_emitido === null
                ? null
                : undefined,
          certificado_opcion:
            (cierre as any).certificado_opcion !== undefined
              ? String((cierre as any).certificado_opcion ?? "").trim() || null
              : undefined,
          notificacion_emitida:
            typeof (cierre as any).notificacion_emitida === "boolean"
              ? (cierre as any).notificacion_emitida
              : (cierre as any).notificacion_emitida === null
                ? null
                : undefined,
          seguimiento_notificacion:
            (cierre as any).seguimiento_notificacion !== undefined
              ? String((cierre as any).seguimiento_notificacion ?? "").trim() || null
              : undefined,
          notificacion_observaciones:
            (cierre as any).notificacion_observaciones !== undefined
              ? String((cierre as any).notificacion_observaciones ?? "").trim() || null
              : undefined,
          seguimiento_opcion:
            (cierre as any).seguimiento_opcion !== undefined
              ? String((cierre as any).seguimiento_opcion ?? "").trim() || null
              : undefined,
          seguimiento_efectivo:
            (cierre as any).seguimiento_efectivo !== undefined
              ? normalizeOptionalBoolean((cierre as any).seguimiento_efectivo)
              : undefined,
          cierre_seguimiento:
            (cierre as any).cierre_seguimiento !== undefined
              ? normalizeOptionalBoolean((cierre as any).cierre_seguimiento)
              : undefined,
          seguimiento_fecha: (cierre as any).seguimiento_fecha
            ? normalizeDateOnly((cierre as any).seguimiento_fecha)
            : (cierre as any).seguimiento_fecha === null
              ? null
              : undefined,
        },
      });
    }

    if (antecedentes !== undefined) {
      const antecedentesArray = Array.isArray(antecedentes) ? antecedentes : [];
      await prisma.hc_antecedentes_atencion.deleteMany({ where: { id_atencion: idAtencion } });
      const createRows = antecedentesArray
        .map((item: any) => {
          const diagnosticoTrim = String(item?.diagnostico ?? "").trim();
          const tipoTrim = String(item?.tipo_antecedente ?? "").trim();
          const observacionTrim = String(item?.observacion ?? "").trim();
          const isEmpty = !diagnosticoTrim && !tipoTrim && !observacionTrim;
          if (isEmpty) return null;
          return {
            id_atencion: idAtencion,
            diagnostico: diagnosticoTrim || null,
            tipo_antecedente: tipoTrim || null,
            observacion: observacionTrim || null,
          };
        })
        .filter(Boolean) as any[];
      if (createRows.length > 0) {
        await prisma.hc_antecedentes_atencion.createMany({ data: createRows });
      }
    }

    if (antecedentes_traumaticos !== undefined) {
      const raw = antecedentes_traumaticos && typeof antecedentes_traumaticos === "object" ? antecedentes_traumaticos : {};
      await prisma.hc_antecedentes_traumaticos_atencion.upsert({
        where: { id_atencion: idAtencion },
        create: {
          id_atencion: idAtencion,
          naturaleza_lesion: String((raw as any).naturaleza_lesion ?? "").trim() || null,
          fecha_ocurrencia: (raw as any).fecha_ocurrencia
            ? normalizeDateOnly((raw as any).fecha_ocurrencia)
            : null,
          secuelas: String((raw as any).secuelas ?? "").trim() || null,
        },
        update: {
          naturaleza_lesion:
            (raw as any).naturaleza_lesion !== undefined
              ? String((raw as any).naturaleza_lesion ?? "").trim() || null
              : undefined,
          fecha_ocurrencia:
            (raw as any).fecha_ocurrencia
              ? normalizeDateOnly((raw as any).fecha_ocurrencia)
              : (raw as any).fecha_ocurrencia === null
                ? null
                : undefined,
          secuelas:
            (raw as any).secuelas !== undefined
              ? String((raw as any).secuelas ?? "").trim() || null
              : undefined,
        },
      });
    }

    if (diagnosticos !== undefined) {
      const diagnosticosArray = Array.isArray(diagnosticos) ? diagnosticos : [];
      await prisma.diagnosticos_atencion.deleteMany({ where: { id_atencion: idAtencion } });
      const dxCreate = diagnosticosArray
        .map((d: any) => {
          const codigoTrim = String(d?.codigo_cie10 ?? "").trim();
          if (!codigoTrim) return null;
          return {
            id_atencion: idAtencion,
            codigo_cie10: codigoTrim,
            es_principal: d?.es_principal === true,
            id_tipo_confirmacion:
              d?.id_tipo_confirmacion === null || d?.id_tipo_confirmacion === undefined
                ? null
                : Number(d?.id_tipo_confirmacion) || null,
          };
        })
        .filter(Boolean) as any[];
      if (dxCreate.length > 0) {
        await prisma.diagnosticos_atencion.createMany({ data: dxCreate });
      }
    }

    return NextResponse.json({ ok: true, atencion }, { status: 200 });
  } catch (error) {
    console.error("Error guardando borrador de atención", error);
    return NextResponse.json(
      { message: "No se pudo guardar el borrador de la atención" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const idCita = Number(resolvedParams.id);

    if (!Number.isInteger(idCita) || idCita <= 0) {
      return NextResponse.json({ message: "ID de cita inválido" }, { status: 400 });
    }

    const atencion = await prisma.atenciones_salud.findFirst({
      where: { id_cita: idCita },
      orderBy: { id_atencion: "desc" },
      include: {
        hc_anamnesis_atencion: true,
        hc_atencion_cierre: true,
        hc_ssr_atencion: true,
        hc_tamizajes_atencion: true,
        hc_examen_fisico_atencion: true,
        hc_valoracion_sistemas_atencion: true,
        hc_antecedentes_atencion: true,
        hc_antecedentes_traumaticos_atencion: true,
        diagnosticos_atencion: true,
      },
    });

    return NextResponse.json({ data: atencion ?? null }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo borrador de atención", error);
    return NextResponse.json(
      { message: "No se pudo obtener la atención" },
      { status: 500 },
    );
  }
}
