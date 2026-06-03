"use client";

import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Swal from "sweetalert2";

import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/lib/api";
import { getPatientById } from "@/services/patients";
import {
  fetchModalidadesAtencion,
  fetchSedes,
  fetchTiposAtencion,
  type ModalidadAtencion,
  type Sede,
} from "@/services/catalogs";

import { IngresoTab } from "@/app/appointments/[id]/attend/components/IngresoTab";
import { AnamnesisTab } from "@/app/appointments/[id]/attend/components/AnamnesisTab";
import { AntecedentesTab } from "@/app/appointments/[id]/attend/components/AntecedentesTab";
import { DiagnosticosTab } from "@/app/appointments/[id]/attend/components/DiagnosticosTab";
import { AntecedentesSsrTab } from "@/app/appointments/[id]/attend/components/AntecedentesSsrTab";
import { AtencionTab } from "@/app/appointments/[id]/attend/components/AtencionTab";
import { ExamenFisicoTab } from "@/app/appointments/[id]/attend/components/ExamenFisicoTab";
import { RevisionPorSistemasTab } from "@/app/appointments/[id]/attend/components/RevisionPorSistemasTab";
import { AttendTabs, type AttendTabKey, type SimpleAttendTabKey } from "@/app/appointments/[id]/attend/components/Tabs";
import type { DiagnosisDraft } from "@/app/appointments/[id]/attend/components/AttentionDiagnosesSection";

const Select = dynamic(() => import("react-select"), { ssr: false });

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

type AttentionFormState = {
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
  seguimiento_observaciones: string;
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
};

type SelectOption = {
  value: number;
  label: string;
};

type AntecedentesTraumaticosState = {
  naturaleza_lesion: string;
  fecha_ocurrencia: string;
  secuelas: string;
};

type SsrFormState = {
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
};

type TamizajeRowState = {
  key: "CCU_PROSTATA" | "SENO_TESTICULO" | "ITS" | "OTROS";
  label: string;
  estado: "" | "SI" | "NO" | "NA";
  tipo: string;
  fecha: string;
  resultado: string;
};

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

const defaultTamizajesSerialized = JSON.stringify(DEFAULT_TAMIZAJES);

function safeJsonParse(input: string | null | undefined): unknown {
  if (!input) return null;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function validateIngreso(form: AttentionFormState): string | null {
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

  if (form.caso_accidente_intoxicacion_violencia !== "SI" && form.caso_accidente_intoxicacion_violencia !== "NO") {
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

  return null;
}

function isTabComplete(input: {
  activeTab: AttendTabKey;
  form: AttentionFormState;
  observacionAntecedentesPersonal: string;
  observacionAntecedentesFamiliar: string;
  antecedentesTraumaticos: AntecedentesTraumaticosState;
  diagnosticosDraft: DiagnosisDraft[];
  attentionId: number | null;
}): { ok: boolean; message?: string } {
  const {
    activeTab,
    form,
    observacionAntecedentesPersonal,
    observacionAntecedentesFamiliar,
    antecedentesTraumaticos,
    diagnosticosDraft,
    attentionId,
  } = input;

  if (activeTab === "INGRESO") {
    const msg = validateIngreso(form);
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

    if (!hasAntecedentes) {
      return { ok: false, message: "Debe diligenciar antecedentes personales o familiares." };
    }

    if (!hasTraumaticos) {
      return { ok: false, message: "Debe diligenciar antecedentes traumáticos." };
    }

    if (!tamizajesHasMeaningfulValue) {
      return { ok: false, message: "Debe diligenciar los tamizajes." };
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
    if (!attentionId && diagnosticosDraft.length === 0) {
      return { ok: false, message: "Debe agregar al menos un diagnóstico." };
    }
    return { ok: true };
  }

  if (activeTab === "ATENCION") {
    if (!form.conducta_plan_estudio_manejo.trim()) {
      return { ok: false, message: "Debe diligenciar la conducta / plan de manejo." };
    }
    if (!form.seguimiento_opcion.trim()) {
      return { ok: false, message: "Debe seleccionar el tipo de seguimiento." };
    }
    return { ok: true };
  }

  return { ok: true };
}

export default function OutpatientAttendPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const idPaciente = params?.id;

  const didAttemptPrefillRef = useRef(false);

  const selectMenuPortalTarget = typeof document !== "undefined" ? document.body : null;
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: 36,
      height: 36,
      borderColor: state.isFocused ? "#94a3b8" : "#cbd5e1",
      boxShadow: state.isFocused ? "0 0 0 1px #94a3b8" : "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      borderRadius: 6,
      backgroundColor: "#fff",
      fontSize: 12,
    }),
    valueContainer: (base: any) => ({ ...base, padding: "0 8px", height: 36 }),
    input: (base: any) => ({ ...base, margin: 0, padding: 0, fontSize: 12 }),
    placeholder: (base: any) => ({ ...base, color: "#64748b", fontSize: 12 }),
    singleValue: (base: any) => ({ ...base, color: "#0f172a", fontSize: 12 }),
    indicatorsContainer: (base: any) => ({ ...base, height: 36 }),
    dropdownIndicator: (base: any) => ({ ...base, padding: 6 }),
    clearIndicator: (base: any) => ({ ...base, padding: 6 }),
    indicatorSeparator: () => ({ display: "none" }),
    menuPortal: (base: any) => ({ ...base, zIndex: 60 }),
    menu: (base: any) => ({ ...base, zIndex: 60, fontSize: 12 }),
    option: (base: any) => ({ ...base, color: "#000", fontSize: 12 }),
  };

  const [attentionId, setAttentionId] = useState<number | null>(null);

  const [idTipoAtencion, setIdTipoAtencion] = useState<string>("");
  const [idModalidadAtencion, setIdModalidadAtencion] = useState<string>("");
  const [idSede, setIdSede] = useState<string>("");
  const [fechaHora, setFechaHora] = useState<string>(() => toDatetimeLocalValue(new Date()));
  const [seguimiento, setSeguimiento] = useState<"SI" | "NO">("NO");
  const [canalRecordatorio, setCanalRecordatorio] = useState<string>("");

  const [idHistoriaVinculada, setIdHistoriaVinculada] = useState<string>("");

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
    seguimiento_observaciones: "",
    anamnesis_motivo_consulta: "",
    anamnesis_enfermedad_actual: "",
    analisis: "",
    hc_ssr_contenido: "",
    hc_tamizajes_contenido: JSON.stringify(DEFAULT_TAMIZAJES),
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

  const [activeTab, setActiveTab] = useState<AttendTabKey>("INGRESO");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: pacienteData, isLoading: loadingPaciente, isError: errorPaciente } = useQuery<any>({
    queryKey: ["outpatient-attend-patient", idPaciente],
    enabled: !!idPaciente,
    queryFn: () => getPatientById(String(idPaciente)),
  });

  const { data: tiposAtencionData } = useQuery<any[]>({
    queryKey: ["outpatient-attend-tipos-atencion"],
    queryFn: fetchTiposAtencion,
  });

  const { data: modalidadesAtencionData } = useQuery<ModalidadAtencion[]>({
    queryKey: ["outpatient-attend-modalidades"],
    queryFn: fetchModalidadesAtencion,
  });

  const { data: sedesData } = useQuery<Sede[]>({
    queryKey: ["outpatient-attend-sedes"],
    queryFn: fetchSedes,
  });

  const { data: profesionalData } = useQuery<any>({
    queryKey: ["outpatient-attend-profesional"],
    queryFn: async () => {
      const res = await apiClient.get("/me/professional");
      return res.data?.data ?? null;
    },
  });

  const shouldRequireHistoriaVinculada = seguimiento === "SI";

  useEffect(() => {
    if (!shouldRequireHistoriaVinculada) {
      setIdHistoriaVinculada("");
    }
  }, [shouldRequireHistoriaVinculada]);

  const { data: followupRecordsData } = useQuery<any[]>({
    queryKey: ["outpatient-followup-records", idPaciente],
    enabled: !!idPaciente && shouldRequireHistoriaVinculada,
    queryFn: async () => {
      const res = await apiClient.get(`/patients/${idPaciente}/records`);
      return (res.data?.data ?? []) as any[];
    },
  });

  const followupRecordsOptions = useMemo<SelectOption[]>(() => {
    const rows = Array.isArray(followupRecordsData) ? followupRecordsData : [];
    return rows
      .filter((r: any) => {
        const estadoOk = String(r?.estado ?? "").trim() === "Seguimiento";
        const tipoCodigo = String(r?.tipo_historia_codigo ?? "").trim();
        const tipoOk = tipoCodigo === "HC_CONSULTA_EXTERNA" || tipoCodigo === "REG_ATENCION_SALUD";
        return estadoOk && tipoOk;
      })
      .map((r: any) => {
        const fecha = String(r?.fecha_apertura ?? "");
        const estado = String(r?.estado ?? "").trim();
        const tipo = String(r?.tipo_historia ?? "").trim();
        const label = [
          fecha ? fecha.slice(0, 10) : "",
          tipo ? `Tipo: ${tipo}` : "",
          String(r?.profesional_responsable ?? "").trim()
            ? `Prof: ${String(r?.profesional_responsable ?? "").trim()}`
            : "",
          String(r?.last_attention_tipo ?? "").trim()
            ? `Atn: ${String(r?.last_attention_tipo ?? "").trim()}`
            : "Atn: (sin atenciones)",
          String(r?.last_attention_modalidad ?? "").trim()
            ? `Mod: ${String(r?.last_attention_modalidad ?? "").trim()}`
            : "",
          estado ? `Estado: ${estado}` : "",
        ]
          .filter(Boolean)
          .join(" | ");
        return { value: Number(r.id_historia), label };
      })
      .filter((o) => Number.isInteger(o.value) && o.value > 0);
  }, [followupRecordsData]);

  const selectedFollowupRecord = useMemo(() => {
    const rows = Array.isArray(followupRecordsData) ? followupRecordsData : [];
    const target = idHistoriaVinculada ? Number(idHistoriaVinculada) : NaN;
    if (!Number.isInteger(target) || target <= 0) return null;
    return rows.find((r: any) => Number(r?.id_historia) === target) ?? null;
  }, [followupRecordsData, idHistoriaVinculada]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!idPaciente) return;

      const dt = new Date(fechaHora);
      if (Number.isNaN(dt.getTime())) {
        throw new Error("Fecha de atención inválida");
      }

      const payload: any = {
        fecha_hora: dt.toISOString(),
        id_tipo_atencion: Number(idTipoAtencion),
        id_modalidad_atencion: idModalidadAtencion ? Number(idModalidadAtencion) : null,
        id_sede: idSede ? Number(idSede) : null,
        seguimiento: seguimiento === "SI",
        canal_recordatorio: canalRecordatorio || null,
        anamnesis_motivo_consulta: form.anamnesis_motivo_consulta || undefined,
        anamnesis_enfermedad_actual: form.anamnesis_enfermedad_actual || undefined,
        analisis: form.analisis || undefined,
        hc_atencion_cierre: {
          conducta_plan_estudio_manejo: form.conducta_plan_estudio_manejo || undefined,
          atencion_recomendaciones: form.atencion_recomendaciones || undefined,
          certificado_emitido: form.certificado_emitido || undefined,
          certificado_opcion: form.certificado_opcion || undefined,
          certificado_recomendaciones: form.certificado_recomendaciones || undefined,
          notificacion_emitida: form.notificacion_emitida || undefined,
          seguimiento_notificacion: form.seguimiento_notificacion || undefined,
          notificacion_observaciones: form.notificacion_observaciones || undefined,
          seguimiento_opcion: form.seguimiento_opcion || undefined,
          seguimiento_efectivo:
            form.seguimiento_efectivo === "SI"
              ? true
              : form.seguimiento_efectivo === "NO"
                ? false
                : undefined,
          cierre_seguimiento:
            form.cierre_seguimiento === "SI"
              ? true
              : form.cierre_seguimiento === "NO"
                ? false
                : undefined,
          seguimiento_fecha: form.seguimiento_fecha || undefined,
          seguimiento_observaciones: form.seguimiento_observaciones || undefined,
        },
        id_historia_vinculada:
          shouldRequireHistoriaVinculada && idHistoriaVinculada.trim()
            ? Number(idHistoriaVinculada)
            : undefined,
        antecedentes: [
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
        ],
        antecedentes_traumaticos: {
          naturaleza_lesion: antecedentesTraumaticos.naturaleza_lesion || undefined,
          fecha_ocurrencia: antecedentesTraumaticos.fecha_ocurrencia || undefined,
          secuelas: antecedentesTraumaticos.secuelas || undefined,
        },
        diagnosticos:
          diagnosticosDraft.length > 0
            ? diagnosticosDraft.map((d) => ({
                codigo_cie10: d.codigo_cie10,
                es_principal: d.es_principal,
                codigo_confirmacion: d.codigo_confirmacion ?? undefined,
                id_tipo_confirmacion: undefined,
              }))
            : undefined,
        hc_ssr_contenido: form.hc_ssr_contenido || undefined,
        hc_tamizajes_contenido: form.hc_tamizajes_contenido || undefined,
        hc_examen_fisico_contenido: form.hc_examen_fisico_contenido || undefined,
        hc_valoracion_sistemas_contenido: form.hc_valoracion_sistemas_contenido || undefined,
        llega_por_sus_medios: form.llega_por_sus_medios === "SI",
        llega_por_sus_medios_cual:
          form.llega_por_sus_medios === "NO" ? form.llega_por_sus_medios_cual || undefined : undefined,
        estado_a_la_llegada: form.estado_a_la_llegada || undefined,
        caso_accidente_intoxicacion_violencia: form.caso_accidente_intoxicacion_violencia === "SI",
        fecha_ocurrencia_evento:
          form.caso_accidente_intoxicacion_violencia === "SI" ? form.fecha_ocurrencia_evento || undefined : undefined,
        lugar_ocurrencia_evento:
          form.caso_accidente_intoxicacion_violencia === "SI" ? form.lugar_ocurrencia_evento || undefined : undefined,
        notificacion_otro_cual: form.notificacion_otro_cual || undefined,
      };

      return apiClient.post(`/patients/${idPaciente}/outpatient-attentions`, payload);
    },
    onSuccess: async (response: any) => {
      setError(null);
      setSuccessMessage("Atención registrada correctamente.");

      const createdAttention = response?.data?.atencion;
      if (createdAttention?.id_atencion) {
        setAttentionId(createdAttention.id_atencion);
      }

      setDiagnosticosDraft([]);

      await Swal.fire({
        title: "Atención registrada",
        text: "Se registró la atención sin cita correctamente.",
        icon: "success",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#2563eb",
      });

      router.push(`/patients/${idPaciente}/records`);
    },
    onError: async (err: any) => {
      const backendMessage = err?.response?.data?.message;
      const msg =
        typeof backendMessage === "string" && backendMessage.trim().length > 0
          ? backendMessage.trim()
          : err?.message || "No se pudo registrar la atención. Intente de nuevo.";

      setError(msg);

      await Swal.fire({
        title: "No se pudo guardar",
        text: msg,
        icon: "error",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#2563eb",
      });
    },
  });

  const tabsOrder: AttendTabKey[] = [
    "INGRESO",
    "ANAMNESIS",
    "ANTECEDENTES",
    "REVISION_SISTEMAS",
    "EXAMEN_FISICO",
    "DIAGNOSTICOS",
    "ATENCION",
  ];

  const canGoBack = tabsOrder.indexOf(activeTab) > 0;
  const canGoNext =
    tabsOrder.indexOf(activeTab) >= 0 && tabsOrder.indexOf(activeTab) < tabsOrder.length - 1;

  const activeTabCompletion = isTabComplete({
    activeTab,
    form,
    observacionAntecedentesPersonal,
    observacionAntecedentesFamiliar,
    antecedentesTraumaticos,
    diagnosticosDraft,
    attentionId,
  });

  const handleWizardNav = async (direction: "back" | "next") => {
    const idx = tabsOrder.indexOf(activeTab);
    const nextIdx = direction === "next" ? idx + 1 : idx - 1;
    const targetTab = tabsOrder[nextIdx];
    if (!targetTab) return;

    if (direction === "next") {
      if (activeTab === "ATENCION" && shouldRequireHistoriaVinculada) {
        if (followupRecordsOptions.length === 0) {
          setError("El paciente no tiene historias en estado Seguimiento para vincular.");
          return;
        }
        if (!idHistoriaVinculada.trim()) {
          setError("Debe seleccionar una historia en seguimiento para vincular.");
          return;
        }
      }

      const completion = isTabComplete({
        activeTab,
        form,
        observacionAntecedentesPersonal,
        observacionAntecedentesFamiliar,
        antecedentesTraumaticos,
        diagnosticosDraft,
        attentionId,
      });

      if (!completion.ok) {
        setError(completion.message ?? "Debes completar la sección antes de continuar.");
        return;
      }
    }

    setError(null);
    setActiveTab(targetTab);
  };

  const handleFinalize = () => {
    if (mutation.isPending) return;

    const metaError = (() => {
      const dt = new Date(fechaHora);
      if (Number.isNaN(dt.getTime())) {
        return "Fecha de atención inválida.";
      }
      if (!idSede.trim()) {
        return "Debe seleccionar la sede.";
      }
      const idTipoAtencionNum = Number(idTipoAtencion);
      if (!Number.isInteger(idTipoAtencionNum) || idTipoAtencionNum <= 0) {
        return "Debe seleccionar el tipo de atención.";
      }
      const idModalidadAtencionNum = Number(idModalidadAtencion);
      if (!Number.isInteger(idModalidadAtencionNum) || idModalidadAtencionNum <= 0) {
        return "Debe seleccionar la modalidad de atención.";
      }
      if (!seguimiento.trim()) {
        return "Debe seleccionar si es seguimiento.";
      }
      return null;
    })();

    if (metaError) {
      setError(metaError);
      return;
    }

    const completion = isTabComplete({
      activeTab,
      form,
      observacionAntecedentesPersonal,
      observacionAntecedentesFamiliar,
      antecedentesTraumaticos,
      diagnosticosDraft,
      attentionId,
    });

    if (!completion.ok) {
      setError(completion.message ?? "Debes completar la sección antes de finalizar.");
      return;
    }

    if (activeTab === "ATENCION" && shouldRequireHistoriaVinculada) {
      if (followupRecordsOptions.length === 0) {
        setError("El paciente no tiene historias en estado Seguimiento para vincular.");
        return;
      }
      if (!idHistoriaVinculada.trim()) {
        setError("Debe seleccionar una historia en seguimiento para vincular.");
        return;
      }
    }

    setError(null);
    mutation.mutate();
  };

  useEffect(() => {
    if (!successMessage) return;
    const t = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(t);
  }, [successMessage]);

  useEffect(() => {
    const parsed = safeJsonParse(form.hc_ssr_contenido);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      setSsrForm((prev) => ({ ...prev, ...(parsed as any) }));
    }
  }, [form.hc_ssr_contenido]);

  useEffect(() => {
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
  }, [form.hc_tamizajes_contenido]);

  useEffect(() => {
    if (!idPaciente) return;
    if (attentionId) return;
    if (mutation.isPending) return;
    if (didAttemptPrefillRef.current) return;

    didAttemptPrefillRef.current = true;

    const tamizajesHasMeaningfulValue =
      form.hc_tamizajes_contenido.trim() && form.hc_tamizajes_contenido !== defaultTamizajesSerialized;

    const hasAnyTargetValue =
      form.analisis.trim() ||
      form.hc_ssr_contenido.trim() ||
      tamizajesHasMeaningfulValue ||
      form.hc_examen_fisico_contenido.trim() ||
      form.hc_valoracion_sistemas_contenido.trim();

    if (hasAnyTargetValue) return;

    (async () => {
      try {
        const resRecords = await apiClient.get<{ data: any[] }>(`/patients/${idPaciente}/records`);
        const records = Array.isArray(resRecords.data?.data) ? resRecords.data.data : [];
        const targetHistory =
          records.find(
            (r) =>
              Number(r?.attention_count) > 0 &&
              String(r?.tipo_historia_codigo ?? "").trim() === "HC_CONSULTA_EXTERNA",
          ) ?? null;
        const idHistoria = targetHistory?.id_historia ? Number(targetHistory.id_historia) : null;
        if (!idHistoria || !Number.isInteger(idHistoria) || idHistoria <= 0) return;

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

        const nextConductaPlan = String(lastAttention?.hc_atencion_cierre?.conducta_plan_estudio_manejo ?? "");
        const nextRecomendaciones = String(lastAttention?.hc_atencion_cierre?.recomendaciones ?? "");
        const nextSeguimientoObservaciones = String(lastAttention?.hc_atencion_cierre?.seguimiento_observaciones ?? "");
        const nextSsr = String(lastAttention?.hc_ssr_atencion?.contenido ?? "");
        const nextTamizajes = String(lastAttention?.hc_tamizajes_atencion?.contenido ?? "");
        const nextExamenFisico = String(lastAttention?.hc_examen_fisico_atencion?.contenido ?? "");
        const nextValoracion = String(lastAttention?.hc_valoracion_sistemas_atencion?.contenido ?? "");

        setForm((prev) => ({
          ...prev,
          anamnesis_motivo_consulta: prev.anamnesis_motivo_consulta.trim()
            ? prev.anamnesis_motivo_consulta
            : nextMotivoConsulta,
          anamnesis_enfermedad_actual: prev.anamnesis_enfermedad_actual.trim()
            ? prev.anamnesis_enfermedad_actual
            : nextEnfermedadActual,
          // No precargar análisis para HC_CONSULTA_EXTERNA
          analisis: prev.analisis.trim() ? prev.analisis : "",
          conducta_plan_estudio_manejo: prev.conducta_plan_estudio_manejo.trim()
            ? prev.conducta_plan_estudio_manejo
            : nextConductaPlan,
          atencion_recomendaciones: prev.atencion_recomendaciones.trim()
            ? prev.atencion_recomendaciones
            : nextRecomendaciones,
          seguimiento_observaciones: prev.seguimiento_observaciones.trim()
            ? prev.seguimiento_observaciones
            : nextSeguimientoObservaciones,
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
      } catch {
        // ignore
      }
    })();
  }, [
    attentionId,
    form.analisis,
    form.anamnesis_enfermedad_actual,
    form.anamnesis_motivo_consulta,
    form.atencion_recomendaciones,
    form.conducta_plan_estudio_manejo,
    form.hc_examen_fisico_contenido,
    form.hc_ssr_contenido,
    form.hc_tamizajes_contenido,
    form.hc_valoracion_sistemas_contenido,
    idPaciente,
    mutation.isPending,
    observacionAntecedentesFamiliar,
    observacionAntecedentesPersonal,
  ]);

  const headerCitaLikeData = useMemo(() => {
    return {
      fecha_hora_inicio: new Date().toISOString(),
    };
  }, []);

  if (loadingPaciente) {
    return (
      <AppShell>
        <section className="space-y-4">
          <p className="text-sm text-slate-500">Cargando información del paciente...</p>
        </section>
      </AppShell>
    );
  }

  if (errorPaciente || !pacienteData) {
    return (
      <AppShell>
        <section className="space-y-4">
          <p className="text-sm text-red-600">No se pudo cargar la información del paciente.</p>
        </section>
      </AppShell>
    );
  }

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
    if (activo === true)
      return "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800";
    if (activo === false)
      return "inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800";
    return "inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700";
  };

  const modalidadDescripcion = (() => {
    const idNum = Number(idModalidadAtencion);
    if (!Number.isInteger(idNum) || idNum <= 0) return "No registrada";
    const found = (modalidadesAtencionData ?? []).find((m) => m.id_modalidad_atencion === idNum);
    return found?.descripcion ?? "No registrada";
  })();

  const tipoAtencionDescripcion = (() => {
    const idNum = Number(idTipoAtencion);
    if (!Number.isInteger(idNum) || idNum <= 0) return "No registrada";
    const found = (tiposAtencionData ?? []).find((t: any) => t.id_tipo_atencion === idNum);
    return found?.descripcion ?? "No registrada";
  })();

  const sedeDescripcion = (() => {
    const idNum = Number(idSede);
    if (!Number.isInteger(idNum) || idNum <= 0) return "No registrada";
    const found = (sedesData ?? []).find((s) => s.id_sede === idNum);
    return found?.nombre ?? "No registrada";
  })();

  const profesionalNombre =
    profesionalData?.usuarios?.nombre_completo ?? profesionalData?.nombre_completo ?? "";
  const profesionalEmail = profesionalData?.usuarios?.email ?? "";
  const profesionalSede = profesionalData?.sedes?.nombre ?? "";
  const profesionalEspecialidad = profesionalData?.especialidades?.nombre ?? "";

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Consulta externa sin cita</h1>
            <p className="mt-1 text-sm text-slate-600">Registre una atención de consulta externa sin cita previa.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/patients/${idPaciente}/records`)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Volver
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 text-[11px] shadow-md">
            <p className="text-xs font-semibold text-slate-800">Datos del paciente</p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <div className="flex items-center">
                  <span className="text-slate-700">
                    <span className="font-semibold">Estado:</span>
                  </span>
                  <span className={getPacienteStatusBadgeClasses(pacienteActivo)}>
                    {pacienteActivo === true ? "Activo" : pacienteActivo === false ? "Inactivo" : "Sin estado"}
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
                  {pacienteFechaNacimiento ? new Date(pacienteFechaNacimiento).toLocaleDateString() : "No registrada"}
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
                  <span className="font-semibold">Condición particular:</span> {pacienteCondicionParticular || "No registrada"}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Programa académico:</span> {pacienteProgramaAcademico || "No registrado"}
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

          <div className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 text-[11px] shadow-md">
            <p className="text-xs font-semibold text-slate-800">Clasificación de la atención</p>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-700">Sede <span className="text-red-500">*</span></label>
                <select
                  value={idSede}
                  onChange={(e) => setIdSede(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                >
                  <option value="">Seleccione...</option>
                  {(sedesData ?? []).map((s) => (
                    <option key={s.id_sede} value={String(s.id_sede)}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-500">Seleccionada: {sedeDescripcion}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Fecha y hora <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={fechaHora}
                  onChange={(e) => setFechaHora(e.target.value)}
                  disabled
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Tipo de atención <span className="text-red-500">*</span></label>
                <select
                  value={idTipoAtencion}
                  onChange={(e) => setIdTipoAtencion(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                >
                  <option value="">Seleccione...</option>
                  {(tiposAtencionData ?? []).map((t: any) => (
                    <option key={t.id_tipo_atencion} value={String(t.id_tipo_atencion)}>
                      {t.descripcion}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-500">Seleccionado: {tipoAtencionDescripcion}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Modalidad de atención <span className="text-red-500">*</span></label>
                <select
                  value={idModalidadAtencion}
                  onChange={(e) => setIdModalidadAtencion(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                >
                  <option value="">Seleccione...</option>
                  {(modalidadesAtencionData ?? []).map((m) => (
                    <option key={m.id_modalidad_atencion} value={String(m.id_modalidad_atencion)}>
                      {m.descripcion}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-500">Seleccionada: {modalidadDescripcion}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Hace parte de un seguimiento? <span className="text-red-500">*</span></label>
                <select
                  value={seguimiento}
                  onChange={(e) => setSeguimiento(e.target.value as any)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                >
                  <option value="NO">No</option>
                  <option value="SI">Sí</option>
                </select>
              </div>

              {shouldRequireHistoriaVinculada && (
                <div className="md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Historia en seguimiento a vincular <span className="text-red-500">*</span>
                  </label>
                  <Select
                    isClearable
                    isSearchable
                    classNamePrefix="react-select"
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition="fixed"
                    styles={selectStyles}
                    placeholder={
                      followupRecordsOptions.length > 0
                        ? "Seleccione la historia"
                        : "No hay historias en Seguimiento"
                    }
                    options={followupRecordsOptions}
                    value={(() => {
                      if (!idHistoriaVinculada) return null;
                      const target = Number(idHistoriaVinculada);
                      if (!Number.isInteger(target) || target <= 0) return null;
                      return (
                        followupRecordsOptions.find((o: SelectOption) => o.value === target) ??
                        null
                      );
                    })()}
                    onChange={(option: any) => {
                      const selected = option as SelectOption | null;
                      setIdHistoriaVinculada(selected ? String(selected.value) : "");
                    }}
                  />

                  {selectedFollowupRecord && (
                    <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                      <div className="grid gap-1 md:grid-cols-2">
                        <div>
                          <span className="font-semibold">Fecha apertura:</span>{" "}
                          {String(selectedFollowupRecord?.fecha_apertura ?? "").slice(0, 10) || "-"}
                        </div>
                        <div>
                          <span className="font-semibold">Estado:</span>{" "}
                          {String(selectedFollowupRecord?.estado ?? "") || "-"}
                        </div>
                        <div>
                          <span className="font-semibold">Tipo:</span>{" "}
                          {String(selectedFollowupRecord?.tipo_historia ?? "") || "-"}
                        </div>
                        <div>
                          <span className="font-semibold">Profesional:</span>{" "}
                          {String(selectedFollowupRecord?.profesional_responsable ?? "") || "-"}
                        </div>
                        <div>
                          <span className="font-semibold">Última atención:</span>{" "}
                          {String(selectedFollowupRecord?.last_attention_tipo ?? "") || "-"}
                        </div>
                        <div>
                          <span className="font-semibold">Modalidad:</span>{" "}
                          {String(selectedFollowupRecord?.last_attention_modalidad ?? "") || "-"}
                        </div>
                        <div>
                          <span className="font-semibold">Fecha última atención:</span>{" "}
                          {selectedFollowupRecord?.last_attention_fecha_hora
                            ? String(selectedFollowupRecord.last_attention_fecha_hora)
                                .replace("T", " ")
                                .slice(0, 16)
                            : "-"}
                        </div>
                        <div>
                          <span className="font-semibold">Motivo de consulta:</span>{" "}
                          {selectedFollowupRecord?.last_attention_motivo_consulta
                            ? String(selectedFollowupRecord.last_attention_motivo_consulta)
                            : "-"}
                        </div>
                        <div>
                          <span className="font-semibold">Tipo de seguimiento:</span>{" "}
                          {selectedFollowupRecord?.last_attention_seguimiento_opcion
                            ? (() => {
                                const opcion = String(selectedFollowupRecord.last_attention_seguimiento_opcion);
                                switch (opcion) {
                                  case "CONDICIONES_CRONICAS":
                                    return "Condiciones Crónicas";
                                  case "SITUACION_SALUD":
                                    return "Situación de Salud";
                                  case "SITUACION_EN_SALUD":
                                    return "Situación en Salud";
                                  default:
                                    return opcion;
                                }
                              })()
                            : "-"}
                        </div>
                        <div>
                          <span className="font-semibold">Dx principal:</span>{" "}
                          {selectedFollowupRecord?.last_attention_principal_cie10_codigo
                            ? `${String(selectedFollowupRecord.last_attention_principal_cie10_codigo)} - ${String(selectedFollowupRecord?.last_attention_principal_cie10_nombre ?? "")}`
                            : "-"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="md:col-span-2">
                <label className="text-[11px] font-semibold text-slate-700">Canal de recordatorio</label>
                <input
                  type="text"
                  value={canalRecordatorio}
                  onChange={(e) => setCanalRecordatorio(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                  placeholder="Ej: WhatsApp, llamada, correo"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-800">Profesional</p>
              <div className="grid gap-2 md:grid-cols-2">
                <p className="text-slate-700">
                  <span className="font-semibold">Nombre:</span> {profesionalNombre || "No registrado"}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Email:</span> {profesionalEmail || "No registrado"}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Sede:</span> {profesionalSede || "No registrada"}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Especialidad:</span> {profesionalEspecialidad || "No registrada"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          onSubmit={(e) => e.preventDefault()}
        >
          <AttendTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab as Dispatch<SetStateAction<AttendTabKey | SimpleAttendTabKey>>}
            allowDirectNav={false}
          />

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}

          {successMessage && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {successMessage}
            </p>
          )}

          <div className="min-h-[520px]">
            {activeTab === "INGRESO" && <IngresoTab citaData={headerCitaLikeData} form={form} setForm={setForm} />}
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

            {activeTab === "REVISION_SISTEMAS" && <RevisionPorSistemasTab form={form} setForm={setForm} />}
            {activeTab === "EXAMEN_FISICO" && <ExamenFisicoTab form={form} setForm={setForm} />}

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
              disabled={mutation.isPending || (canGoNext ? !activeTabCompletion.ok : false)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? "Guardando..." : canGoNext ? "Siguiente" : "Finalizar"}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
