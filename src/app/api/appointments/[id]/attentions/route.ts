import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const idCita = Number(resolvedParams.id);

    if (!Number.isInteger(idCita) || idCita <= 0) {
      return NextResponse.json({ message: "ID de cita inválido" }, { status: 400 });
    }

    const body = await request.json();
    const {
      anamnesis_motivo_consulta,
      anamnesis_enfermedad_actual,
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

    // Regla de negocio: id_tipo_historia debe corresponder al tipo de cita.
    // Si no existe ese id en tipos_historia_clinica, se usa un fallback para no romper el flujo.
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

    let historia = await prisma.historias_clinicas.findFirst({
      where: {
        id_paciente: cita.id_paciente,
        id_tipo_historia: tipoHistoria.id_tipo_historia,
        estado: "activa",
      },
    });

    if (!historia) {
      historia = await prisma.historias_clinicas.create({
        data: {
          id_paciente: cita.id_paciente,
          id_tipo_historia: tipoHistoria.id_tipo_historia,
          id_profesional_responsable: cita.id_profesional,
          motivo_consulta: anamnesisMotivoTrimEarly || null,
        },
      });
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

    const diagnosticosArray = Array.isArray(diagnosticos) ? diagnosticos : [];
    const diagnosticosCreateRaw = diagnosticosArray
      .map((item: any) => {
        const codigoTrim = String(item?.codigo_cie10 ?? "").trim();
        if (!codigoTrim) return null;

        const esPrincipal = item?.es_principal === true;
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
        };
      })
      .filter(Boolean) as Array<{
      codigo_cie10: string;
      es_principal: boolean;
      id_tipo_confirmacion: number | null;
    }>;

    // Solo un diagnóstico puede quedar como principal
    const diagnosticosCreate = (() => {
      if (diagnosticosCreateRaw.length === 0) return [];
      const idxPrincipal = diagnosticosCreateRaw.findIndex((d) => d.es_principal);
      if (idxPrincipal < 0) return diagnosticosCreateRaw;
      return diagnosticosCreateRaw.map((d, idx) => ({ ...d, es_principal: idx === idxPrincipal }));
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

      if (Object.keys(historiaUpdateData).length > 0) {
        historia = await prisma.historias_clinicas.update({
          where: { id_historia: historia.id_historia },
          data: historiaUpdateData,
        });
      }
    } catch (e) {
      console.error("Error actualizando resumen de historia clinica", e);
      // No interrumpimos el guardado de la atención
    }

    const hcSsrTrim = String(hc_ssr_contenido ?? "").trim();
    const hcTamizajesTrim = String(hc_tamizajes_contenido ?? "").trim();
    const hcExamenFisicoTrim = String(hc_examen_fisico_contenido ?? "").trim();
    const hcValoracionSistemasTrim = String(hc_valoracion_sistemas_contenido ?? "").trim();

    const cierreRaw = hc_atencion_cierre && typeof hc_atencion_cierre === "object" ? hc_atencion_cierre : null;
    const cierreRecomendacionesTrim = String(cierreRaw?.recomendaciones ?? "").trim();
    const cierreCertRecomTrim = String(cierreRaw?.certificado_recomendaciones ?? "").trim();
    const cierreSegOpcionTrim = String(cierreRaw?.seguimiento_opcion ?? "").trim();
    const cierreSegFechaRaw = (cierreRaw as any)?.seguimiento_fecha;
    const cierreSegFecha = (() => {
      if (cierreSegFechaRaw === null || cierreSegFechaRaw === undefined) return null;

      if (cierreSegFechaRaw instanceof Date) {
        return Number.isNaN(cierreSegFechaRaw.getTime()) ? null : cierreSegFechaRaw;
      }

      const rawTrim = String(cierreSegFechaRaw).trim();
      if (!rawTrim || rawTrim === "undefined" || rawTrim === "null") return null;

      const parsed = new Date(rawTrim);
      if (!(parsed instanceof Date) || typeof (parsed as any).getTime !== "function") return null;
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    })();
    const hasCierre = !!(
      cierreRecomendacionesTrim ||
      cierreCertRecomTrim ||
      cierreSegOpcionTrim ||
      cierreSegFecha
    );

    const atencion = await prisma.atenciones_salud.create({
      data: {
        id_historia: historia.id_historia,
        id_cita: cita.id_cita,
        id_profesional: cita.id_profesional,
        id_tipo_atencion: idTipoAtencionNum,
        id_modalidad_atencion: cita.id_modalidad_atencion ?? null,
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
                  recomendaciones: cierreRecomendacionesTrim || null,
                  certificado_recomendaciones: cierreCertRecomTrim || null,
                  seguimiento_opcion: cierreSegOpcionTrim || null,
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
        hc_tamizajes_atencion: hcTamizajesTrim ? { create: { contenido: hcTamizajesTrim } } : undefined,
        hc_examen_fisico_atencion: hcExamenFisicoTrim
          ? { create: { contenido: hcExamenFisicoTrim } }
          : undefined,
        hc_valoracion_sistemas_atencion: hcValoracionSistemasTrim
          ? { create: { contenido: hcValoracionSistemasTrim } }
          : undefined,
      } as any,
    });

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

    return NextResponse.json({ historia, atencion }, { status: 201 });
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
