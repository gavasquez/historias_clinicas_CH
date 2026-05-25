"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { AppShell } from "@/components/layout/app-shell";
import { getAppointmentById, type AppointmentDetail } from "@/services/appointments";
import { getPatientById } from "@/services/patients";
import { getProfessionalById } from "@/services/professionals";
import { getCompanionsByPatient } from "@/services/companions";
import {
  fetchTiposAtencion,
  fetchModalidadesAtencion,
  fetchSedes,
  fetchTiposCita,
  fetchEstadosCita,
  fetchProgramasSalud,
  fetchTiposHistoriaClinica,
  type ModalidadAtencion,
} from "@/services/catalogs";
import { apiClient } from "@/lib/api";
import { getEstadoCitaBadgeClasses } from "@/lib/appointment-status";

import { IngresoTab } from "./components/IngresoTab";
import { AnamnesisTab } from "./components/AnamnesisTab";
import { AntecedentesTab } from "./components/AntecedentesTab";
import { DiagnosticosTab } from "./components/DiagnosticosTab";
import { AntecedentesSsrTab } from "./components/AntecedentesSsrTab";
import { AtencionTab } from "./components/AtencionTab";
import { ExamenFisicoTab } from "./components/ExamenFisicoTab";
import { RevisionPorSistemasTab } from "./components/RevisionPorSistemasTab";
import { AttendTabs } from "./components/Tabs";

type AttendPayloadInput = {
  citaData: AppointmentDetail | undefined;
  form: AttentionFormState;
  simpleForm: {
    motivoAtencion: string;
    observacionAnalisis: string;
    planManejo: string;
    seguimiento: string;
    seguimientoOpcion: string;
    seguimientoEfectivo: string;
    cierreSeguimiento: string;
    seguimientoFecha: string;
    seguimientoObservaciones: string;
  };
  isRegAtencionSalud: boolean;
  observacionAntecedentesPersonal: string;
  observacionAntecedentesFamiliar: string;
  antecedentesTraumaticos: AntecedentesTraumaticosState;
  diagnosticosDraft: DiagnosisDraft[];
};

function validateAttendForm(input: {
  citaData: AppointmentDetail | undefined;
  form: AttentionFormState;
  isRegAtencionSalud: boolean;
}): string | null {
  const { citaData, form, isRegAtencionSalud } = input;

  if (!citaData?.id_tipo_cita) {
    return "La cita no tiene tipo de cita para determinar el tipo de atención.";
  }

  // En modo REG_ATENCION_SALUD (flujo simplificado), no validar campos del flujo completo
  if (isRegAtencionSalud) {
    return null;
  }

  // Validaciones solo para flujo completo
  if (form.llega_por_sus_medios !== "SI" && form.llega_por_sus_medios !== "NO") {
    return "Debe indicar si el paciente llega por sus propios medios.";
  }

  if (form.llega_por_sus_medios === "NO" && !form.llega_por_sus_medios_cual.trim()) {
    return "Debe especificar cuál cuando el paciente no llega por sus propios medios.";
  }

  if (
    form.estado_a_la_llegada !== "CONSCIENTE" &&
    form.estado_a_la_llegada !== "INCONSCIENTE" &&
    form.estado_a_la_llegada !== "MUERTO"
  ) {
    return "Debe seleccionar el estado a la llegada.";
  }

  if (
    form.caso_accidente_intoxicacion_violencia !== "SI" &&
    form.caso_accidente_intoxicacion_violencia !== "NO"
  ) {
    return "Debe indicar si es caso de accidente, intoxicación o violencia.";
  }

  if (form.caso_accidente_intoxicacion_violencia === "SI") {
    if (!form.fecha_ocurrencia_evento.trim()) {
      return "Debe diligenciar la fecha de ocurrencia del evento.";
    }
    if (!form.lugar_ocurrencia_evento.trim()) {
      return "Debe diligenciar el lugar de ocurrencia del evento.";
    }
  }

  if (!form.seguimiento_opcion.trim()) {
    return "Debe seleccionar el tipo de seguimiento.";
  }

  return null;
}

function validateIngresoTab(input: {
  citaData: AppointmentDetail | undefined;
  form: AttentionFormState;
}): string | null {
  const { citaData, form } = input;

  if (!citaData?.id_tipo_cita) {
    return "La cita no tiene tipo de cita para determinar el tipo de atención.";
  }

  if (form.llega_por_sus_medios !== "SI" && form.llega_por_sus_medios !== "NO") {
    return "Debe indicar si el paciente llega por sus propios medios.";
  }

  if (form.llega_por_sus_medios === "NO" && !form.llega_por_sus_medios_cual.trim()) {
    return "Debe especificar cuál cuando el paciente no llega por sus propios medios.";
  }

  if (
    form.estado_a_la_llegada !== "CONSCIENTE" &&
    form.estado_a_la_llegada !== "INCONSCIENTE" &&
    form.estado_a_la_llegada !== "MUERTO"
  ) {
    return "Debe seleccionar el estado a la llegada.";
  }

  return null;
}

function buildAttendPayload(input: AttendPayloadInput) {
  const {
    citaData,
    form,
    simpleForm,
    isRegAtencionSalud,
    observacionAntecedentesPersonal,
    observacionAntecedentesFamiliar,
    antecedentesTraumaticos,
    diagnosticosDraft,
  } = input;

  if (!citaData?.id_tipo_cita) {
    throw new Error("La cita no tiene tipo de cita para determinar el tipo de atención.");
  }

  // En el flujo simplificado, usar datos de simpleForm, si no, usar form
  const analisisValue = form.analisis;
  const planManejoValue = isRegAtencionSalud ? simpleForm.planManejo : form.conducta_plan_estudio_manejo;
  const seguimientoOpcionValue = isRegAtencionSalud ? simpleForm.seguimientoOpcion : form.seguimiento_opcion;
  const seguimientoEfectivoValue = isRegAtencionSalud ? simpleForm.seguimientoEfectivo : form.seguimiento_efectivo;
  const cierreSeguimientoValue = isRegAtencionSalud ? simpleForm.cierreSeguimiento : form.cierre_seguimiento;
  const seguimientoFechaValue = isRegAtencionSalud ? simpleForm.seguimientoFecha : form.seguimiento_fecha;

  const llegaPorSusMediosBool = form.llega_por_sus_medios === "SI";
  const casoBool = form.caso_accidente_intoxicacion_violencia === "SI";

  const hasCierre =
    planManejoValue.trim() ||
    form.atencion_recomendaciones.trim() ||
    form.certificado_recomendaciones.trim() ||
    form.certificado_emitido.trim() ||
    form.certificado_opcion.trim() ||
    form.notificacion_emitida.trim() ||
    form.notificacion_observaciones.trim() ||
    form.seguimiento_notificacion.trim() ||
    seguimientoOpcionValue.trim() ||
    seguimientoEfectivoValue.trim() ||
    cierreSeguimientoValue.trim() ||
    seguimientoFechaValue.trim();

  const hasAntecedentes =
    observacionAntecedentesPersonal.trim() || observacionAntecedentesFamiliar.trim();

  const hasTraumaticos =
    antecedentesTraumaticos.naturaleza_lesion.trim() ||
    antecedentesTraumaticos.fecha_ocurrencia.trim() ||
    antecedentesTraumaticos.secuelas.trim();

  return {
    anamnesis_motivo_consulta: isRegAtencionSalud ? simpleForm.motivoAtencion : form.anamnesis_motivo_consulta || undefined,
    anamnesis_enfermedad_actual: form.anamnesis_enfermedad_actual || undefined,
    analisis: analisisValue || undefined,
    observacion_analisis: isRegAtencionSalud ? simpleForm.observacionAnalisis || undefined : undefined,
    hc_atencion_cierre: hasCierre
      ? {
          conducta_plan_estudio_manejo: planManejoValue || undefined,
          recomendaciones: form.atencion_recomendaciones || undefined,
          certificado_recomendaciones: form.certificado_recomendaciones || undefined,
          certificado_emitido:
            form.certificado_emitido === "SI"
              ? true
              : form.certificado_emitido === "NO"
                ? false
                : undefined,
          certificado_opcion:
            form.certificado_emitido === "SI" ? form.certificado_opcion || undefined : undefined,
          notificacion_emitida:
            form.notificacion_emitida === "SI"
              ? true
              : form.notificacion_emitida === "NO"
                ? false
                : undefined,
          seguimiento_notificacion:
            form.notificacion_emitida === "SI" ? form.seguimiento_notificacion || undefined : undefined,
          notificacion_observaciones: isRegAtencionSalud ? simpleForm.seguimientoObservaciones || undefined : form.notificacion_observaciones || undefined,
          seguimiento_opcion: seguimientoOpcionValue || undefined,
          seguimiento_efectivo:
            seguimientoEfectivoValue === "SI"
              ? true
              : seguimientoEfectivoValue === "NO"
                ? false
                : undefined,
          cierre_seguimiento:
            cierreSeguimientoValue === "SI"
              ? true
              : cierreSeguimientoValue === "NO"
                ? false
                : undefined,
          seguimiento_fecha: seguimientoFechaValue || undefined,
        }
      : undefined,
    antecedentes: hasAntecedentes
      ? ([
          {
            diagnostico: null,
            tipo_antecedente: "PERSONAL",
            observacion: observacionAntecedentesPersonal || null,
          },
          {
            diagnostico: null,
            tipo_antecedente: "FAMILIAR",
            observacion: observacionAntecedentesFamiliar || null,
          },
        ] as any[])
      : undefined,
    antecedentes_traumaticos: hasTraumaticos
      ? {
          naturaleza_lesion: antecedentesTraumaticos.naturaleza_lesion || undefined,
          fecha_ocurrencia: antecedentesTraumaticos.fecha_ocurrencia || undefined,
          secuelas: antecedentesTraumaticos.secuelas || undefined,
        }
      : undefined,
    diagnosticos:
      diagnosticosDraft.length > 0
        ? diagnosticosDraft.map((d) => ({
            codigo_cie10: d.codigo_cie10,
            es_principal: d.es_principal,
            codigo_confirmacion: d.codigo_confirmacion ?? undefined,
          }))
        : undefined,
    hc_ssr_contenido: form.hc_ssr_contenido || undefined,
    hc_tamizajes_contenido: form.hc_tamizajes_contenido || undefined,
    hc_examen_fisico_contenido: form.hc_examen_fisico_contenido || undefined,
    hc_valoracion_sistemas_contenido: form.hc_valoracion_sistemas_contenido || undefined,
    llega_por_sus_medios: llegaPorSusMediosBool,
    llega_por_sus_medios_cual:
      form.llega_por_sus_medios === "NO" ? form.llega_por_sus_medios_cual || undefined : undefined,
    estado_a_la_llegada: form.estado_a_la_llegada || undefined,
    caso_accidente_intoxicacion_violencia: casoBool,
    fecha_ocurrencia_evento: casoBool ? form.fecha_ocurrencia_evento || undefined : undefined,
    lugar_ocurrencia_evento: casoBool ? form.lugar_ocurrencia_evento || undefined : undefined,
  };
}

function isTabComplete(input: {
  activeTab: AttendTabKey | "NOTA_ATENCION";
  citaData: AppointmentDetail | undefined;
  form: AttentionFormState;
  simpleForm: {
    motivoAtencion: string;
    observacionAnalisis: string;
    planManejo: string;
    seguimiento: string;
    seguimientoOpcion: string;
    seguimientoEfectivo: string;
    cierreSeguimiento: string;
    seguimientoFecha: string;
    seguimientoObservaciones: string;
  };
  isRegAtencionSalud: boolean;
  observacionAntecedentesPersonal: string;
  observacionAntecedentesFamiliar: string;
  antecedentesTraumaticos: AntecedentesTraumaticosState;
  diagnosticosDraft: DiagnosisDraft[];
}): { ok: boolean; message?: string } {
  const {
    activeTab,
    citaData,
    form,
    simpleForm,
    isRegAtencionSalud,
    observacionAntecedentesPersonal,
    observacionAntecedentesFamiliar,
    antecedentesTraumaticos,
    diagnosticosDraft,
  } = input;

  // Si es flujo simplificado, no validar pestañas del flujo completo
  if (isRegAtencionSalud && activeTab !== "NOTA_ATENCION" && activeTab !== "DIAGNOSTICOS") {
    return { ok: true };
  }

  // Si es flujo completo, no validar pestañas del flujo simplificado
  if (!isRegAtencionSalud && activeTab === "NOTA_ATENCION") {
    return { ok: true };
  }

  if (activeTab === "NOTA_ATENCION") {
    if (!simpleForm.motivoAtencion.trim()) {
      return { ok: false, message: "Debe diligenciar el motivo de atención." };
    }
    if (!simpleForm.observacionAnalisis.trim()) {
      return { ok: false, message: "Debe diligenciar la observación / análisis." };
    }
    if (!simpleForm.planManejo.trim()) {
      return { ok: false, message: "Debe diligenciar el plan de manejo." };
    }
    if (!simpleForm.seguimiento.trim()) {
      return { ok: false, message: "Debe seleccionar si es seguimiento." };
    }
    if (simpleForm.seguimiento === "SI" && !simpleForm.seguimientoOpcion.trim()) {
      return { ok: false, message: "Debe seleccionar el tipo de seguimiento." };
    }
    return { ok: true };
  }

  if (activeTab === "INGRESO") {
    const msg = validateIngresoTab({ citaData, form });
    return msg ? { ok: false, message: msg } : { ok: true };
  }

  if (activeTab === "ANAMNESIS") {
    if (!form.anamnesis_motivo_consulta.trim()) {
      return { ok: false, message: "Debe diligenciar el motivo de consulta." };
    }
    if (!form.anamnesis_enfermedad_actual.trim()) {
      return { ok: false, message: "Debe diligenciar la enfermedad actual." };
    }
    return { ok: true };
  }

  if (activeTab === "ANTECEDENTES") {
    const hasAntecedentes =
      observacionAntecedentesPersonal.trim() || observacionAntecedentesFamiliar.trim();

    const hasTraumaticos =
      antecedentesTraumaticos.naturaleza_lesion.trim() ||
      antecedentesTraumaticos.fecha_ocurrencia.trim() ||
      antecedentesTraumaticos.secuelas.trim();

    const tamizajesHasMeaningfulValue = (() => {
      const raw = form.hc_tamizajes_contenido.trim();
      if (!raw) return false;

      const parsed = safeJsonParse(raw);
      if (!Array.isArray(parsed)) return false;

      return parsed.some((r: any) => {
        const estado = String(r?.estado ?? "").trim();
        const tipo = String(r?.tipo ?? "").trim();
        const fecha = String(r?.fecha ?? "").trim();
        const resultado = String(r?.resultado ?? "").trim();
        return !!(estado || tipo || fecha || resultado);
      });
    })();

    const habitosHasMeaningfulValue = (() => {
      const raw = form.hc_ssr_contenido.trim();
      if (!raw) return false;
      const parsed = safeJsonParse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;

      const candidates = [
        "habitos_tabaco_cigarrillo",
        "habitos_alcohol",
        "habitos_sustancias_psicoactivas",
        "habitos_otros",
        "habitos_actividad_fisica",
        "habitos_alimentacion",
        "habitos_otras_actividades",
      ];

      return candidates.some((k) => String((parsed as any)[k] ?? "").trim().length > 0);
    })();

    if (!hasAntecedentes) {
      return { ok: false, message: "Debe diligenciar antecedentes personales o familiares." };
    }

    if (!hasTraumaticos) {
      return { ok: false, message: "Debe diligenciar antecedentes traumáticos." };
    }

    // SSR clínico es opcional, pero Tamizajes y Hábitos sí son obligatorios.
    if (!tamizajesHasMeaningfulValue) {
      return { ok: false, message: "Debe diligenciar los tamizajes." };
    }

    if (!habitosHasMeaningfulValue) {
      return { ok: false, message: "Debe diligenciar los hábitos." };
    }

    return { ok: true };
  }

  if (activeTab === "REVISION_SISTEMAS") {
    if (!form.hc_valoracion_sistemas_contenido.trim()) {
      return { ok: false, message: "Debe diligenciar el examen por sistema." };
    }
    return { ok: true };
  }

  if (activeTab === "EXAMEN_FISICO") {
    if (!form.hc_examen_fisico_contenido.trim()) {
      return { ok: false, message: "Debe diligenciar el examen físico." };
    }
    return { ok: true };
  }

  if (activeTab === "DIAGNOSTICOS") {
    if (!form.analisis.trim()) {
      return { ok: false, message: "Debe diligenciar el análisis." };
    }

    if (diagnosticosDraft.length === 0) {
      return { ok: false, message: "Debe agregar al menos un diagnóstico." };
    }

    return { ok: true };
  }

  if (activeTab === "ATENCION") {
    if (!form.conducta_plan_estudio_manejo.trim()) {
      return { ok: false, message: "Debe diligenciar la conducta / plan de manejo." };
    }
    return { ok: true };
  }

  return { ok: true };
}

function safeJsonParse(input: string | null | undefined): unknown {
  if (!input) return null;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

interface AttentionFormState {
  conducta_plan_estudio_manejo: string;
  atencion_recomendaciones: string;
  certificado_recomendaciones: string;
  certificado_emitido: "" | "SI" | "NO";
  certificado_opcion: "" | "CON_RESTRICCIONES" | "CON_RECOMENDACIONES" | "SIN_RESTRICCIONES";
  notificacion_emitida: "" | "SI" | "NO";
  notificacion_observaciones: string;
  seguimiento_notificacion: string;
  seguimiento_opcion: string;
  seguimiento_efectivo: "" | "SI" | "NO";
  cierre_seguimiento: "" | "SI" | "NO";
  seguimiento_fecha: string;
  anamnesis_motivo_consulta: string;
  anamnesis_enfermedad_actual: string;
  analisis: string;
  hc_ssr_contenido: string;
  hc_tamizajes_contenido: string;
  hc_examen_fisico_contenido: string;
  hc_valoracion_sistemas_contenido: string;
  llega_por_sus_medios: "" | "SI" | "NO";
  llega_por_sus_medios_cual: string;
  estado_a_la_llegada: "" | "CONSCIENTE" | "INCONSCIENTE" | "MUERTO";
  caso_accidente_intoxicacion_violencia: "" | "SI" | "NO";
  fecha_ocurrencia_evento: string;
  lugar_ocurrencia_evento: string;
  notificacion_otro_cual: string;
}

interface AntecedenteDraft {
  diagnostico: string;
  tipo_antecedente: string;
  observacion: string;
}

interface AntecedentesTraumaticosState {
  naturaleza_lesion: string;
  fecha_ocurrencia: string;
  secuelas: string;
}

interface DiagnosisDraft {
  codigo_cie10: string;
  cie10_nombre?: string | null;
  cie10_descripcion?: string | null;
  es_principal: boolean;
  codigo_confirmacion?: "CN" | "CR" | "ID" | null;
}

type YesNoNa = "SI" | "NO" | "NA" | "";

interface SsrFormState {
  menarquia: string;
  ciclos: string;
  fum: string;
  g: string;
  p: string;
  c: string;
  v: string;
  a: string;
  e: string;
  m: string;
  fup: string;
  anticoncepcion: "SI" | "NO" | "PAREJA" | "";
  anticoncepcion_cual: string;
  observaciones: string;
  habitos_tabaco_cigarrillo: string;
  habitos_alcohol: string;
  habitos_sustancias_psicoactivas: string;
  habitos_otros: string;
  habitos_actividad_fisica: string;
  habitos_alimentacion: string;
  habitos_otras_actividades: string;
}

interface TamizajeRowState {
  key: "CCU_PROSTATA" | "SENO_TESTICULO" | "ITS" | "OTROS";
  label: string;
  estado: "" | "SI" | "NO" | "NA";
  tipo: string;
  fecha: string;
  resultado: string;
}

const DEFAULT_TAMIZAJES: TamizajeRowState[] = [
  {
    key: "CCU_PROSTATA",
    label: "CÁNCER CERVICOUTERINO/PRÓSTATA",
    estado: "",
    tipo: "",
    fecha: "",
    resultado: "",
  },
  {
    key: "SENO_TESTICULO",
    label: "CÁNCER DE SENO / TESTÍCULO",
    estado: "",
    tipo: "",
    fecha: "",
    resultado: "",
  },
  {
    key: "ITS",
    label: "INFECCIONES TRANSMISIÓN SEXUAL",
    estado: "",
    tipo: "",
    fecha: "",
    resultado: "",
  },
  {
    key: "OTROS",
    label: "OTROS",
    estado: "",
    tipo: "",
    fecha: "",
    resultado: "",
  },
];

type AttendTabKey =
  | "INGRESO"
  | "ANAMNESIS"
  | "ANTECEDENTES"
  | "EXAMEN_FISICO"
  | "REVISION_SISTEMAS"
  | "DIAGNOSTICOS"
  | "ATENCION";

export default function AttendAppointmentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const didAttemptPrefillRef = useRef(false);

  const [isClient, setIsClient] = useState(false);
  const [form, setForm] = useState<AttentionFormState>({
    conducta_plan_estudio_manejo: "",
    atencion_recomendaciones: "",
    certificado_recomendaciones: "",
    certificado_emitido: "",
    certificado_opcion: "",
    notificacion_emitida: "",
    notificacion_observaciones: "",
    seguimiento_notificacion: "",
    seguimiento_opcion: "",
    seguimiento_efectivo: "",
    cierre_seguimiento: "",
    seguimiento_fecha: "",
    anamnesis_motivo_consulta: "",
    anamnesis_enfermedad_actual: "",
    analisis: "",
    hc_ssr_contenido: "",
    hc_tamizajes_contenido: "",
    hc_examen_fisico_contenido: "",
    hc_valoracion_sistemas_contenido: "",
    llega_por_sus_medios: "SI",
    llega_por_sus_medios_cual: "",
    estado_a_la_llegada: "CONSCIENTE",
    caso_accidente_intoxicacion_violencia: "NO",
    fecha_ocurrencia_evento: "",
    lugar_ocurrencia_evento: "",
    notificacion_otro_cual: "",
  });

  // Estados para el formulario simplificado (REG_ATENCION_SALUD)
  const [simpleForm, setSimpleForm] = useState({
    motivoAtencion: "",
    observacionAnalisis: "",
    planManejo: "",
    seguimiento: "",
    seguimientoOpcion: "",
    seguimientoEfectivo: "",
    cierreSeguimiento: "",
    seguimientoFecha: "",
    seguimientoObservaciones: "",
  });

  useEffect(() => {
    if (simpleForm.seguimientoOpcion === "NO_APLICA" || simpleForm.seguimientoOpcion === "") {
      setSimpleForm((prev) => ({ ...prev, seguimientoObservaciones: "", seguimientoFecha: "" }));
    }
  }, [simpleForm.seguimientoOpcion]);

  const handleWizardNav = (direction: "back" | "next") => {
    if (mutation.isPending) return;
    const idx = tabsOrder.indexOf(activeTab as any);
    const nextIdx = direction === "next" ? idx + 1 : idx - 1;
    const targetTab = tabsOrder[nextIdx];
    if (!targetTab) return;

    if (direction === "next") {
      const completion = isTabComplete({
        activeTab: activeTab as any,
        citaData,
        form,
        simpleForm,
        isRegAtencionSalud,
        observacionAntecedentesPersonal,
        observacionAntecedentesFamiliar,
        antecedentesTraumaticos,
        diagnosticosDraft,
      });

      if (!completion.ok) {
        setError(completion.message ?? "Debes completar la sección antes de continuar.");
        return;
      }

      if (isRegAtencionSalud && activeTab === "NOTA_ATENCION" && targetTab === "DIAGNOSTICOS") {
        setForm((prev) => ({
          ...prev,
          conducta_plan_estudio_manejo: simpleForm.planManejo,
          seguimiento_opcion: simpleForm.seguimientoOpcion,
          seguimiento_efectivo: (simpleForm.seguimientoEfectivo || "") as AttentionFormState["seguimiento_efectivo"],
          cierre_seguimiento: (simpleForm.cierreSeguimiento || "") as AttentionFormState["cierre_seguimiento"],
          seguimiento_fecha: simpleForm.seguimientoFecha,
        } as AttentionFormState));
      }
    }

    setError(null);
    setActiveTab(targetTab);
  };

  const handleFinalize = () => {
    if (mutation.isPending) return;
    if (!activeTabCompletion.ok) {
      setError(activeTabCompletion.message ?? "Debes completar la sección antes de finalizar.");
      return;
    }
    setError(null);
    mutation.mutate();
  };

  const [observacionAntecedentesPersonal, setObservacionAntecedentesPersonal] = useState("");
  const [observacionAntecedentesFamiliar, setObservacionAntecedentesFamiliar] = useState("");
  const [antecedentesTraumaticos, setAntecedentesTraumaticos] = useState<AntecedentesTraumaticosState>({
    naturaleza_lesion: "",
    fecha_ocurrencia: "",
    secuelas: "",
  });
  const [diagnosticosDraft, setDiagnosticosDraft] = useState<DiagnosisDraft[]>([]);
  const [ssrForm, setSsrForm] = useState<SsrFormState>({
    menarquia: "",
    ciclos: "",
    fum: "",
    g: "",
    p: "",
    c: "",
    v: "",
    a: "",
    e: "",
    m: "",
    fup: "",
    anticoncepcion: "",
    anticoncepcion_cual: "",
    observaciones: "",
    habitos_tabaco_cigarrillo: "",
    habitos_alcohol: "",
    habitos_sustancias_psicoactivas: "",
    habitos_otros: "",
    habitos_actividad_fisica: "",
    habitos_alimentacion: "",
    habitos_otras_actividades: "",
  });
  const [tamizajesForm, setTamizajesForm] = useState<TamizajeRowState[]>(DEFAULT_TAMIZAJES);
  const [activeTab, setActiveTab] = useState<AttendTabKey | "NOTA_ATENCION">("INGRESO");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const tabsOrderFull: AttendTabKey[] = [
    "INGRESO",
    "ANAMNESIS",
    "ANTECEDENTES",
    "REVISION_SISTEMAS",
    "EXAMEN_FISICO",
    "DIAGNOSTICOS",
    "ATENCION",
  ];

  const tabsOrderSimple: ("NOTA_ATENCION" | "DIAGNOSTICOS")[] = [
    "NOTA_ATENCION",
    "DIAGNOSTICOS",
  ];

  const [tabsOrder, setTabsOrder] = useState<(AttendTabKey | "NOTA_ATENCION")[]>(tabsOrderFull);

  const canGoBack = tabsOrder.indexOf(activeTab as any) > 0;
  const canGoNext = tabsOrder.indexOf(activeTab as any) >= 0 && tabsOrder.indexOf(activeTab as any) < tabsOrder.length - 1;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const t = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
    return () => {
      window.clearTimeout(t);
    };
  }, [successMessage]);

  const { data: citaData, isLoading: loadingCita, isError: errorCita } = useQuery<AppointmentDetail>(
    {
      queryKey: ["appointment-attend", id],
      enabled: !!id,
      queryFn: () => getAppointmentById(String(id)),
    },
  );

  useEffect(() => {
    if (!isClient) return;
    if (!citaData?.id_paciente) return;
    if (didAttemptPrefillRef.current) return;

    didAttemptPrefillRef.current = true;

    const defaultTamizajesSerialized = JSON.stringify(DEFAULT_TAMIZAJES);
    const tamizajesHasMeaningfulValue =
      form.hc_tamizajes_contenido.trim() && form.hc_tamizajes_contenido !== defaultTamizajesSerialized;

    const hasAnyTargetValue =
      form.analisis.trim() ||
      simpleForm.motivoAtencion.trim() ||
      simpleForm.observacionAnalisis.trim() ||
      simpleForm.planManejo.trim() ||
      form.hc_ssr_contenido.trim() ||
      tamizajesHasMeaningfulValue ||
      form.hc_examen_fisico_contenido.trim() ||
      form.hc_valoracion_sistemas_contenido.trim();

    if (hasAnyTargetValue) return;

    (async () => {
      try {
        const resRecords = await apiClient.get<{ data: any[] }>(
          `/patients/${citaData.id_paciente}/records`,
        );

        const records = Array.isArray(resRecords.data?.data) ? resRecords.data.data : [];
        const currentHistoryTypeId = citaData?.id_tipo_historia ? Number(citaData.id_tipo_historia) : NaN;
        const targetHistory =
          records.find(
            (r) =>
              Number(r?.attention_count) > 0 &&
              Number(r?.id_tipo_historia) === currentHistoryTypeId,
          ) ?? null;
        const idHistoria = targetHistory?.id_historia ? Number(targetHistory.id_historia) : null;
        if (!idHistoria || !Number.isInteger(idHistoria) || idHistoria <= 0) return;
        const isRegAtencionSaludPrefill =
          String(targetHistory?.tipo_historia_codigo ?? "").trim() === "REG_ATENCION_SALUD";

        const modalResult = await Swal.fire({
          title: "Precargar información clínica",
          text: "Se encontraron atenciones previas del paciente. ¿Deseas precargar datos clínicos (anamnesis, antecedentes, análisis, plan de manejo, SSR, tamizajes, examen físico y examen por sistema)?",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Sí, precargar",
          cancelButtonText: "No, continuar",
          confirmButtonColor: "#2563eb",
          cancelButtonColor: "#64748b",
          reverseButtons: true,
          allowOutsideClick: false,
        });

        if (!modalResult.isConfirmed) return;

        const resHistory = await apiClient.get<{ data: any }>(`/histories/${idHistoria}`);
        const historia = resHistory.data?.data;
        const atenciones = Array.isArray(historia?.atenciones_salud) ? historia.atenciones_salud : [];
        const lastAttention = atenciones[0] ?? null;
        if (!lastAttention) return;

        const nextAnalisis = String(lastAttention?.analisis ?? "");
        const nextMotivoConsulta = String(lastAttention?.hc_anamnesis_atencion?.motivo_consulta ?? "");
        const nextEnfermedadActual = String(lastAttention?.hc_anamnesis_atencion?.enfermedad_actual ?? "");

        const antecedentesRows = Array.isArray(lastAttention?.hc_antecedentes_atencion)
          ? lastAttention.hc_antecedentes_atencion
          : [];

        const nextAntecedentePersonal = String(
          (antecedentesRows.find(
            (r: any) => String(r?.tipo_antecedente ?? "").trim().toUpperCase() === "PERSONAL",
          ) as any)?.observacion ?? "",
        );

        const nextAntecedenteFamiliar = String(
          (antecedentesRows.find(
            (r: any) => String(r?.tipo_antecedente ?? "").trim().toUpperCase() === "FAMILIAR",
          ) as any)?.observacion ?? "",
        );

        const nextTraumaticos = lastAttention?.hc_antecedentes_traumaticos_atencion;
        const nextNaturalezaLesion = String(nextTraumaticos?.naturaleza_lesion ?? "");
        const nextFechaOcurrencia = nextTraumaticos?.fecha_ocurrencia
          ? String(nextTraumaticos.fecha_ocurrencia).slice(0, 10)
          : "";
        const nextSecuelas = String(nextTraumaticos?.secuelas ?? "");

        const nextObservacionAnalisis = String(lastAttention?.observacion_analisis ?? "");
        const nextConductaPlan = String(
          lastAttention?.hc_atencion_cierre?.conducta_plan_estudio_manejo ?? "",
        );
        const nextRecomendaciones = String(lastAttention?.hc_atencion_cierre?.recomendaciones ?? "");
        const nextSsr = String(lastAttention?.hc_ssr_atencion?.contenido ?? "");
        const nextTamizajes = String(lastAttention?.hc_tamizajes_atencion?.contenido ?? "");
        const nextExamenFisico = String(lastAttention?.hc_examen_fisico_atencion?.contenido ?? "");
        const nextValoracion = String(lastAttention?.hc_valoracion_sistemas_atencion?.contenido ?? "");

        if (isRegAtencionSaludPrefill) {
          setSimpleForm((prev) => ({
            ...prev,
            motivoAtencion: prev.motivoAtencion.trim() ? prev.motivoAtencion : nextMotivoConsulta,
            observacionAnalisis: prev.observacionAnalisis.trim()
              ? prev.observacionAnalisis
              : nextObservacionAnalisis,
            planManejo: prev.planManejo.trim() ? prev.planManejo : nextConductaPlan,
            seguimientoOpcion: prev.seguimientoOpcion.trim()
              ? prev.seguimientoOpcion
              : String(lastAttention?.hc_atencion_cierre?.seguimiento_opcion ?? ""),
            seguimientoEfectivo: prev.seguimientoEfectivo || (
              lastAttention?.hc_atencion_cierre?.seguimiento_efectivo === true
                ? "SI"
                : lastAttention?.hc_atencion_cierre?.seguimiento_efectivo === false
                  ? "NO"
                  : ""
            ),
            cierreSeguimiento: prev.cierreSeguimiento || (
              lastAttention?.hc_atencion_cierre?.cierre_seguimiento === true
                ? "SI"
                : lastAttention?.hc_atencion_cierre?.cierre_seguimiento === false
                  ? "NO"
                  : ""
            ),
            seguimientoFecha: prev.seguimientoFecha.trim()
              ? prev.seguimientoFecha
              : lastAttention?.hc_atencion_cierre?.seguimiento_fecha
                ? String(lastAttention.hc_atencion_cierre.seguimiento_fecha).slice(0, 10)
                : "",
            seguimientoObservaciones: prev.seguimientoObservaciones.trim()
              ? prev.seguimientoObservaciones
              : String(lastAttention?.hc_atencion_cierre?.seguimiento_observaciones ?? ""),
          }));
        } else {
          setForm((prev) => ({
            ...prev,
            anamnesis_motivo_consulta: prev.anamnesis_motivo_consulta.trim()
              ? prev.anamnesis_motivo_consulta
              : nextMotivoConsulta,
            anamnesis_enfermedad_actual: prev.anamnesis_enfermedad_actual.trim()
              ? prev.anamnesis_enfermedad_actual
              : nextEnfermedadActual,
            // analisis no se precarga - el profesional debe ingresarlo manualmente
            conducta_plan_estudio_manejo: prev.conducta_plan_estudio_manejo.trim()
              ? prev.conducta_plan_estudio_manejo
              : nextConductaPlan,
            atencion_recomendaciones: prev.atencion_recomendaciones.trim()
              ? prev.atencion_recomendaciones
              : nextRecomendaciones,
            hc_ssr_contenido: prev.hc_ssr_contenido.trim() ? prev.hc_ssr_contenido : nextSsr,
            hc_tamizajes_contenido: prev.hc_tamizajes_contenido.trim()
              ? prev.hc_tamizajes_contenido
              : nextTamizajes,
            hc_examen_fisico_contenido: prev.hc_examen_fisico_contenido.trim()
              ? prev.hc_examen_fisico_contenido
              : nextExamenFisico,
            hc_valoracion_sistemas_contenido: prev.hc_valoracion_sistemas_contenido.trim()
              ? prev.hc_valoracion_sistemas_contenido
              : nextValoracion,
          }));

          if (!observacionAntecedentesPersonal.trim() && nextAntecedentePersonal.trim()) {
            setObservacionAntecedentesPersonal(nextAntecedentePersonal);
          }
          if (!observacionAntecedentesFamiliar.trim() && nextAntecedenteFamiliar.trim()) {
            setObservacionAntecedentesFamiliar(nextAntecedenteFamiliar);
          }

          setAntecedentesTraumaticos((prevTra) => ({
            naturaleza_lesion: prevTra.naturaleza_lesion.trim() ? prevTra.naturaleza_lesion : nextNaturalezaLesion,
            fecha_ocurrencia: prevTra.fecha_ocurrencia.trim() ? prevTra.fecha_ocurrencia : nextFechaOcurrencia,
            secuelas: prevTra.secuelas.trim() ? prevTra.secuelas : nextSecuelas,
          }));
        }
      } catch {
        // ignore
      }
    })();
  }, [
    citaData?.id_tipo_historia,
    citaData?.id_paciente,
    form.analisis,
    form.anamnesis_enfermedad_actual,
    form.anamnesis_motivo_consulta,
    form.atencion_recomendaciones,
    form.conducta_plan_estudio_manejo,
    form.hc_examen_fisico_contenido,
    form.hc_ssr_contenido,
    form.hc_tamizajes_contenido,
    form.hc_valoracion_sistemas_contenido,
    isClient,
    observacionAntecedentesFamiliar,
    observacionAntecedentesPersonal,
    simpleForm.observacionAnalisis,
    simpleForm.motivoAtencion,
    simpleForm.planManejo,
  ]);

  useEffect(() => {
    if (!isClient) return;
    const parsed = safeJsonParse(form.hc_ssr_contenido);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      setSsrForm((prev) => ({ ...prev, ...(parsed as any) }));
    }
  }, [isClient, form.hc_ssr_contenido]);

  useEffect(() => {
    if (!isClient) return;
    const parsed = safeJsonParse(form.hc_tamizajes_contenido);
    if (Array.isArray(parsed)) {
      const parsedRows = (parsed as any[])
        .filter((r: any) => r && typeof r === "object")
        .map((r: any) => ({
          key: String(r.key) as any,
          label: String(r.label ?? ""),
          estado: (String(r.estado ?? "") as any) || "",
          tipo: String(r.tipo ?? ""),
          fecha: String(r.fecha ?? ""),
          resultado: String(r.resultado ?? ""),
        })) as TamizajeRowState[];

      const byKey = new Map<string, TamizajeRowState>(parsedRows.map((r) => [String(r.key), r]));
      const merged = DEFAULT_TAMIZAJES.map((d) => ({
        ...d,
        ...(byKey.get(d.key) ?? {}),
        key: d.key,
        label: d.label,
      }));

      const nextSerialized = JSON.stringify(merged);
      setTamizajesForm(merged);
      if (form.hc_tamizajes_contenido !== nextSerialized) {
        setForm((p) => ({ ...p, hc_tamizajes_contenido: nextSerialized }));
      }
    } else if (!form.hc_tamizajes_contenido) {
      const nextSerialized = JSON.stringify(DEFAULT_TAMIZAJES);
      setTamizajesForm(DEFAULT_TAMIZAJES);
      setForm((p) => ({ ...p, hc_tamizajes_contenido: nextSerialized }));
    }
  }, [isClient, form.hc_tamizajes_contenido, setForm]);

  const { data: modalidadesAtencionData } = useQuery<ModalidadAtencion[]>({
    queryKey: ["modalidades-atencion"],
    queryFn: fetchModalidadesAtencion,
  });

  const { data: sedesData } = useQuery<any[]>({
    queryKey: ["sedes-select"],
    queryFn: fetchSedes,
  });

  const { data: tiposCitaData } = useQuery<any[]>({
    queryKey: ["tipos-cita-select"],
    queryFn: fetchTiposCita,
  });

  const { data: estadosCitaData } = useQuery<any[]>({
    queryKey: ["estados-cita-select"],
    queryFn: fetchEstadosCita,
  });

  const { data: programasSaludData } = useQuery<any[]>({
    queryKey: ["programas-salud-select"],
    queryFn: fetchProgramasSalud,
  });

  const { data: tiposHistoriaData } = useQuery<any[]>({
    queryKey: ["tipos-historia-clinica"],
    queryFn: fetchTiposHistoriaClinica,
  });

  // Determinar si la cita es de tipo REG_ATENCION_SALUD
  const isRegAtencionSalud = (() => {
    if (!citaData?.id_tipo_historia) return false;
    const tipoHistoria = (tiposHistoriaData ?? []).find(
      (t: any) => t.id_tipo_historia === citaData.id_tipo_historia
    );
    return tipoHistoria?.codigo === "REG_ATENCION_SALUD";
  })();

  // Cambiar al tab inicial según el tipo de historia
  useEffect(() => {
    if (isRegAtencionSalud && activeTab !== "NOTA_ATENCION" && activeTab !== "DIAGNOSTICOS") {
      setActiveTab("NOTA_ATENCION");
    } else if (!isRegAtencionSalud && activeTab === "NOTA_ATENCION") {
      setActiveTab("INGRESO");
    }
  }, [isRegAtencionSalud]);

  // Actualizar el orden de tabs según el tipo de historia
  useEffect(() => {
    if (isRegAtencionSalud) {
      setTabsOrder(tabsOrderSimple);
    } else {
      setTabsOrder(tabsOrderFull);
    }
  }, [isRegAtencionSalud]);

  const activeTabCompletion = isTabComplete({
    activeTab: activeTab as any,
    citaData,
    form,
    simpleForm,
    isRegAtencionSalud,
    observacionAntecedentesPersonal,
    observacionAntecedentesFamiliar,
    antecedentesTraumaticos,
    diagnosticosDraft,
  });

  const { data: pacienteData } = useQuery<any>({
    queryKey: ["appointment-attend-patient", citaData?.id_paciente],
    enabled: !!citaData?.id_paciente,
    queryFn: () => getPatientById(String(citaData?.id_paciente)),
  });

  const { data: companionsData } = useQuery<any[]>({
    queryKey: ["appointment-attend-companions", citaData?.id_paciente],
    enabled: !!citaData?.id_paciente,
    queryFn: () => getCompanionsByPatient(String(citaData?.id_paciente)),
  });

  const { data: profesionalData } = useQuery<any>({
    queryKey: ["appointment-attend-professional", citaData?.id_profesional],
    enabled: !!citaData?.id_profesional,
    queryFn: () => getProfessionalById(String(citaData?.id_profesional)),
  });

  const estadoCitaCodigo = (() => {
    if (!citaData?.id_estado_cita) return null;
    const found = (estadosCitaData ?? []).find(
      (e: any) => e.id_estado_cita === citaData.id_estado_cita,
    );
    return found?.codigo ? String(found.codigo).trim().toUpperCase() : null;
  })();

  const isAttendable = (() => {
    if (!estadoCitaCodigo) return true;
    return estadoCitaCodigo === "PROGRAMADA" || estadoCitaCodigo === "CONFIRMADA";
  })();

  // Si la cita ya no es atendible (ej: ATENDIDA/REALIZADA/CANCELADA/NO_ASISTE), redirigir al detalle
  useEffect(() => {
    if (!isClient || !citaData) return;
    if (!estadosCitaData) return;

    if (!isAttendable) {
      router.replace(`/appointments/${citaData.id_cita}/edit`);
    }
  }, [isClient, citaData, estadosCitaData, isAttendable, router]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!id) return;

      const payload = buildAttendPayload({
        citaData,
        form,
        simpleForm,
        isRegAtencionSalud,
        observacionAntecedentesPersonal,
        observacionAntecedentesFamiliar,
        antecedentesTraumaticos,
        diagnosticosDraft,
      });

      return apiClient.post(`/appointments/${id}/attentions`, payload);
    },
    onSuccess: (response: any) => {
      setError(null);
      setSuccessMessage("Atención registrada correctamente.");
      setDiagnosticosDraft([]);

      router.push("/appointments");
    },
    onError: (err: any) => {
      const backendMessage = err?.response?.data?.message;
      const backendCode = err?.response?.data?.code;

      const normalizedMessage =
        typeof backendMessage === "string" && backendMessage.trim().length > 0
          ? backendMessage.trim()
          : err?.message || "No se pudo registrar la atención. Intente de nuevo.";

      const codeSuffix =
        typeof backendCode === "string" && backendCode.trim().length > 0
          ? ` (${backendCode.trim()})`
          : "";

      setError(
        `${normalizedMessage}${codeSuffix}`,
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateAttendForm({ citaData, form, isRegAtencionSalud });
    if (validationError) {
      setError(validationError);
      return;
    }

    mutation.mutate();
  };

  if (!isClient || loadingCita) {
    return (
      <AppShell>
        <section className="space-y-4">
          <p className="text-sm text-slate-500">Cargando información de la cita...</p>
        </section>
      </AppShell>
    );
  }

  if (errorCita || !citaData) {
    return (
      <AppShell>
        <section className="space-y-4">
          <p className="text-sm text-red-600">No se pudo cargar la información de la cita.</p>
        </section>
      </AppShell>
    );
  }

  const modalidadDescripcion = (() => {
    if (!citaData.id_modalidad_atencion) return "No registrada";
    const found = (modalidadesAtencionData ?? []).find(
      (m) => m.id_modalidad_atencion === citaData.id_modalidad_atencion,
    );
    return found?.descripcion ?? "No registrada";
  })();

  const sedeDescripcion = (() => {
    if (!citaData.id_sede) return "No registrada";
    const found = (sedesData ?? []).find((s: any) => s.id_sede === citaData.id_sede);
    return found?.nombre ?? "No registrada";
  })();

  const tipoCitaDescripcion = (() => {
    if (!citaData.id_tipo_cita) return "No registrada";
    const found = (tiposCitaData ?? []).find((t: any) => t.id_tipo_cita === citaData.id_tipo_cita);
    return found?.descripcion ?? "No registrada";
  })();

  const tipoHistoriaDescripcion = (() => {
    if (!citaData.id_tipo_historia) return "No registrada";
    const found = (tiposHistoriaData ?? []).find(
      (t: any) => t.id_tipo_historia === citaData.id_tipo_historia
    );
    return found?.descripcion ?? "No registrada";
  })();

  const estadoCitaDescripcion = (() => {
    if (!citaData.id_estado_cita) return "No registrado";
    const found = (estadosCitaData ?? []).find(
      (e: any) => e.id_estado_cita === citaData.id_estado_cita,
    );
    return found?.descripcion ?? "No registrado";
  })();

  const programaTransversalDescripcion = (() => {
    if (!citaData.id_programa_salud) return "No registrado";
    const found = (programasSaludData ?? []).find(
      (p: any) => p.id_programa_salud === citaData.id_programa_salud,
    );
    return found?.nombre ?? "No registrado";
  })();

  const pacienteNombreCompleto = `${pacienteData?.nombres ?? ""} ${pacienteData?.apellidos ?? ""}`.trim();
  const pacienteDocumento = pacienteData?.numero_documento ?? "";
  const pacienteTipoDocumento =
    pacienteData?.tipos_documento?.descripcion ?? pacienteData?.tipos_documento?.codigo ?? "";

  const pacienteTelefono = pacienteData?.telefono ?? "";
  const pacienteEmail = pacienteData?.email ?? "";
  const pacienteGenero = pacienteData?.generos?.descripcion ?? "";
  const pacienteEps = pacienteData?.eps?.nombre ?? "";
  const pacienteTipoSangre =
    pacienteData?.tipos_sangre?.codigo ?? pacienteData?.tipos_sangre?.descripcion ?? "";
  const pacienteProgramaAcademico = pacienteData?.programas_academicos?.nombre ?? "";
  const pacienteFechaNacimiento = pacienteData?.fecha_nacimiento ?? "";
  const pacienteEstadoCivil = pacienteData?.estados_civiles?.descripcion ?? "";
  const pacienteDireccion = pacienteData?.direccion ?? "";
  const pacienteCondicionParticular = pacienteData?.condicion_particular ?? "";
  const pacienteCiudad = pacienteData?.ciudades?.nombre ?? pacienteData?.ciudad ?? "";
  const pacienteDepartamento = pacienteData?.departamento ?? "";
  const pacienteSede = pacienteData?.sedes?.nombre ?? "";
  const pacienteTipoUsuario = pacienteData?.tipos_usuario?.descripcion ?? "";
  const pacienteActivo = typeof pacienteData?.activo === "boolean" ? pacienteData.activo : null;
  const profesionalNombre =
    profesionalData?.usuarios?.nombre_completo ?? profesionalData?.nombre_completo ?? "";

  const contactoEmergencia = Array.isArray(companionsData) ? companionsData[0] : null;

  const pacienteEdad = (() => {
    if (!pacienteFechaNacimiento) return "";
    const d = new Date(pacienteFechaNacimiento);
    if (Number.isNaN(d.getTime())) return "";
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
      age -= 1;
    }
    return Number.isFinite(age) && age >= 0 ? String(age) : "";
  })();

  const getPacienteStatusBadgeClasses = (activo: boolean | null) => {
    if (activo === true) return "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800";
    if (activo === false) return "inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800";
    return "inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700";
  };

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Atender cita
            </h1>
            <span className="text-sm text-slate-800">Cita: No. { pacienteData?.numero_documento}</span>
            <p className="mt-1 text-sm text-slate-600">
              Registre los datos básicos de la atención realizada para esta cita.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/appointments")}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Volver al listado
            </button>
            <button
              type="button"
              onClick={() => router.push(`/appointments/${citaData.id_cita}/edit`)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Ver detalle de la cita
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 text-[11px] shadow-md">
              <p className="text-xs font-semibold text-slate-800">Datos del paciente</p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <span className="text-slate-700">
                      <span className="font-semibold">Estado:</span>
                    </span>
                    <span className={getPacienteStatusBadgeClasses(pacienteActivo)}>
                      {pacienteActivo === true
                        ? "Activo"
                        : pacienteActivo === false
                          ? "Inactivo"
                          : "Sin estado"}
                    </span>
                  </div>

                  <p className="text-slate-700">
                    <span className="font-semibold">Paciente:</span> {pacienteNombreCompleto || "No registrado"}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Documento:</span>{" "}
                    {pacienteTipoDocumento ? `${pacienteTipoDocumento} ` : ""}
                    {pacienteDocumento || "No registrado"}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Fecha de nacimiento:</span>{" "}
                    {pacienteFechaNacimiento
                      ? new Date(pacienteFechaNacimiento).toLocaleDateString()
                      : "No registrada"}
                    {pacienteEdad ? ` (${pacienteEdad} años)` : ""}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Género:</span> {pacienteGenero || "No registrado"}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Estado civil:</span> {pacienteEstadoCivil || "No registrado"}
                  </p>
                </div>

                <div className="grid gap-2">
                  <p className="text-slate-700">
                    <span className="font-semibold">Tipo de sangre:</span> {pacienteTipoSangre || "No registrado"}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Tipo de usuario:</span> {pacienteTipoUsuario || "No registrado"}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Sede:</span> {pacienteSede || "No registrada"}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Departamento:</span> {pacienteDepartamento || "No registrado"}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Ciudad:</span> {pacienteCiudad || "No registrada"}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Dirección:</span> {pacienteDireccion || "No registrada"}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Condición particular:</span>{" "}
                    {pacienteCondicionParticular || "No registrada"}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Programa académico:</span>{" "}
                    {pacienteProgramaAcademico || "No registrado"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-800">Contacto y salud</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <p className="text-slate-700">
                    <span className="font-semibold">Teléfono:</span> {pacienteTelefono || "No registrado"}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Email:</span> {pacienteEmail || "No registrado"}
                  </p>
                  <p className="text-slate-700 break-words">
                    <span className="font-semibold">Dirección:</span> {pacienteDireccion || "No registrada"}
                  </p>
                  <p className="text-slate-700 break-words">
                    <span className="font-semibold">EPS:</span> {pacienteEps || "No registrada"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 text-[11px] shadow-md">
              <p className="text-xs font-semibold text-slate-800">Datos de la cita</p>
              <div className="grid gap-2">
                <p className="text-slate-700">
                  <span className="font-semibold">Fecha y hora inicio:</span>{" "}
                  {new Date(citaData.fecha_hora_inicio).toLocaleString()}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Fin programado:</span>{" "}
                  {citaData.fecha_hora_fin
                    ? new Date(citaData.fecha_hora_fin).toLocaleString()
                    : "Duración estimada: 20 min"}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Estado:</span>{" "}
                  <span className={getEstadoCitaBadgeClasses(estadoCitaDescripcion)}>
                    {estadoCitaDescripcion}
                  </span>
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Sede:</span> {sedeDescripcion}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Tipo de cita:</span> {tipoCitaDescripcion}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Tipo de historia:</span> {tipoHistoriaDescripcion}
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 text-[11px] shadow-md">
              <p className="text-xs font-semibold text-slate-800">Atención y programa</p>
              <div className="grid gap-2 md:grid-cols-2">
                <p className="text-slate-700">
                  <span className="font-semibold">Profesional:</span> {profesionalNombre || "No registrado"}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Modalidad de atención:</span> {modalidadDescripcion}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Programa transversal:</span>{" "}
                  {programaTransversalDescripcion}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Seguimiento:</span> {citaData.seguimiento ? "Sí" : "No"}
                </p>
                {citaData.seguimiento && (
                  <p className="text-slate-700">
                    <span className="font-semibold">Tipo seguimiento:</span>{" "}
                    {citaData.tipo_seguimiento ?? "No registrado"}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 text-[11px] shadow-md">
              <p className="text-xs font-semibold text-slate-800">Contacto de Emergencia</p>
              <div className="grid gap-2 md:grid-cols-2">
                <p className="text-slate-700">
                  <span className="font-semibold">Relación:</span>{" "}
                  {contactoEmergencia?.relacion_con_paciente || "No registrada"}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Teléfono:</span> {contactoEmergencia?.telefono || "No registrado"}
                </p>
                <p className="text-slate-700 break-words">
                  <span className="font-semibold">Dirección:</span>{" "}
                  {contactoEmergencia?.direccion || "No registrada"}
                </p>
                <p className="text-slate-700 break-words">
                  <span className="font-semibold">Nombre:</span> {contactoEmergencia?.nombre || "No registrado"}
                </p>
              </div>
            </div>
          </div>
        </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <AttendTabs activeTab={activeTab} setActiveTab={setActiveTab} allowDirectNav={false} simpleMode={isRegAtencionSalud} />

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {successMessage}
          </p>
        )}

        <div className="min-h-[520px]">
          {activeTab === "INGRESO" && (
            <IngresoTab citaData={citaData} form={form} setForm={setForm} />
          )}

          {activeTab === "ANAMNESIS" && <AnamnesisTab form={form} setForm={setForm} />}

          {activeTab === "ANTECEDENTES" && (
            <div className="space-y-4">
              <AntecedentesTab
                observacionPersonal={observacionAntecedentesPersonal}
                setObservacionPersonal={setObservacionAntecedentesPersonal}
                observacionFamiliar={observacionAntecedentesFamiliar}
                setObservacionFamiliar={setObservacionAntecedentesFamiliar}
                antecedentesTraumaticos={antecedentesTraumaticos}
                setAntecedentesTraumaticos={setAntecedentesTraumaticos}
              />
              <AntecedentesSsrTab
                ssrForm={ssrForm}
                setSsrForm={setSsrForm}
                tamizajesForm={tamizajesForm}
                setTamizajesForm={setTamizajesForm}
                form={form}
                setForm={setForm}
              />
            </div>
          )}

          {activeTab === "EXAMEN_FISICO" && <ExamenFisicoTab form={form} setForm={setForm} />}

          {activeTab === "REVISION_SISTEMAS" && (
            <RevisionPorSistemasTab form={form} setForm={setForm} />
          )}

          {activeTab === "NOTA_ATENCION" && (
            <div className="space-y-3">
              <div className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">NOTA DE ATENCIÓN</div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Motivo de atención</label>
                <input
                  type="text"
                  value={simpleForm.motivoAtencion}
                  onChange={(e) => setSimpleForm({ ...simpleForm, motivoAtencion: e.target.value })}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                  placeholder="Motivo de atención"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Observación</label>
                <textarea
                  value={simpleForm.observacionAnalisis}
                  onChange={(e) => setSimpleForm({ ...simpleForm, observacionAnalisis: e.target.value })}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-xs shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Plan de manejo</label>
                <textarea
                  value={simpleForm.planManejo}
                  onChange={(e) => setSimpleForm({ ...simpleForm, planManejo: e.target.value })}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-xs shadow-sm"
                />
              </div>

              <div className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">SEGUIMIENTO</div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">
                    Va a iniciar o hace parte de un seguimiento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={simpleForm.seguimiento}
                    onChange={(e) => setSimpleForm({ ...simpleForm, seguimiento: e.target.value })}
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                  >
                    <option value="">Seleccione...</option>
                    <option value="SI">Sí</option>
                    <option value="NO">No</option>
                  </select>
                </div>

                {simpleForm.seguimiento === "SI" && (
                  <>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700">
                        Tipo de seguimiento <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={simpleForm.seguimientoOpcion}
                        onChange={(e) => setSimpleForm({ ...simpleForm, seguimientoOpcion: e.target.value })}
                        className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                      >
                        <option value="">Seleccione...</option>
                        <option value="CONDICIONES_CRONICAS">CONDICIONES CRÓNICAS</option>
                        <option value="SITUACION_EN_SALUD">SITUACIÓN EN SALUD</option>
                        <option value="NO_APLICA">NO APLICA</option>
                      </select>
                    </div>

                    {(simpleForm.seguimientoOpcion === "CONDICIONES_CRONICAS" || simpleForm.seguimientoOpcion === "SITUACION_EN_SALUD") && (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold text-slate-700">Seguimiento efectivo</p>
                          <div className="flex flex-wrap gap-4 text-xs text-slate-700">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="radio"
                                name="seguimiento_efectivo"
                                checked={simpleForm.seguimientoEfectivo === "SI"}
                                onChange={() => setSimpleForm({ ...simpleForm, seguimientoEfectivo: "SI" })}
                                className="h-3 w-3"
                              />
                              <span>Sí</span>
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="radio"
                                name="seguimiento_efectivo"
                                checked={simpleForm.seguimientoEfectivo === "NO"}
                                onChange={() => setSimpleForm({ ...simpleForm, seguimientoEfectivo: "NO" })}
                                className="h-3 w-3"
                              />
                              <span>No</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold text-slate-700">Cierre seguimiento</p>
                          <div className="flex flex-wrap gap-4 text-xs text-slate-700">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="radio"
                                name="cierre_seguimiento"
                                checked={simpleForm.cierreSeguimiento === "SI"}
                                onChange={() => setSimpleForm({ ...simpleForm, cierreSeguimiento: "SI" })}
                                className="h-3 w-3"
                              />
                              <span>Sí</span>
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="radio"
                                name="cierre_seguimiento"
                                checked={simpleForm.cierreSeguimiento === "NO"}
                                onChange={() => setSimpleForm({ ...simpleForm, cierreSeguimiento: "NO" })}
                                className="h-3 w-3"
                              />
                              <span>No</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-700">Fecha</label>
                          <input
                            type="date"
                            value={simpleForm.seguimientoFecha}
                            onChange={(e) => setSimpleForm({ ...simpleForm, seguimientoFecha: e.target.value })}
                            className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-700">Observación</label>
                          <textarea
                            value={simpleForm.seguimientoObservaciones || ""}
                            onChange={(e) => setSimpleForm({ ...simpleForm, seguimientoObservaciones: e.target.value })}
                            rows={3}
                            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-xs shadow-sm"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "DIAGNOSTICOS" && (
            <DiagnosticosTab
              diagnosticosDraft={diagnosticosDraft}
              setDiagnosticosDraft={setDiagnosticosDraft}
              form={form}
              setForm={setForm}
              setError={setError}
              setSuccessMessage={setSuccessMessage}
            />
          )}

          {activeTab === "ATENCION" && <AtencionTab form={form} setForm={setForm} />}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => handleWizardNav("back")}
            disabled={!canGoBack || mutation.isPending}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={() => (canGoNext ? handleWizardNav("next") : handleFinalize())}
            disabled={
              mutation.isPending ||
              (canGoNext ? !activeTabCompletion.ok : false)
            }
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending
              ? "Guardando..."
              : canGoNext
                ? "Siguiente"
                : "Finalizar"}
          </button>
        </div>
      </form>
    </section>
  </AppShell>
  );
}
