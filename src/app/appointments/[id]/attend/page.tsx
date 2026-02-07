"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
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
   observacionAntecedentesPersonal: string;
   observacionAntecedentesFamiliar: string;
   antecedentesTraumaticos: AntecedentesTraumaticosState;
   diagnosticosDraft: DiagnosisDraft[];
 };

 function validateAttendForm(input: {
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
     if (form.notificacion_otro && !form.notificacion_otro_cual.trim()) {
       return "Debe especificar cuál en Notificación - Otro.";
     }
   }

   return null;
 }

 function buildAttendPayload(input: AttendPayloadInput) {
   const {
     citaData,
     form,
     observacionAntecedentesPersonal,
     observacionAntecedentesFamiliar,
     antecedentesTraumaticos,
     diagnosticosDraft,
   } = input;

   if (!citaData?.id_tipo_cita) {
     throw new Error("La cita no tiene tipo de cita para determinar el tipo de atención.");
   }

   const llegaPorSusMediosBool = form.llega_por_sus_medios === "SI";
   const casoBool = form.caso_accidente_intoxicacion_violencia === "SI";

   const hasCierre =
     form.atencion_recomendaciones.trim() ||
     form.certificado_recomendaciones.trim() ||
     form.seguimiento_opcion.trim() ||
     form.seguimiento_fecha.trim();

   const hasAntecedentes =
     observacionAntecedentesPersonal.trim() || observacionAntecedentesFamiliar.trim();

   const hasTraumaticos =
     antecedentesTraumaticos.naturaleza_lesion.trim() ||
     antecedentesTraumaticos.fecha_ocurrencia.trim() ||
     antecedentesTraumaticos.secuelas.trim();

   return {
     anamnesis_motivo_consulta: form.anamnesis_motivo_consulta || undefined,
     anamnesis_enfermedad_actual: form.anamnesis_enfermedad_actual || undefined,
     hc_atencion_cierre: hasCierre
       ? {
           recomendaciones: form.atencion_recomendaciones || undefined,
           certificado_recomendaciones: form.certificado_recomendaciones || undefined,
           seguimiento_opcion: form.seguimiento_opcion || undefined,
           seguimiento_fecha: form.seguimiento_fecha || undefined,
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
     notificacion_policia: casoBool ? form.notificacion_policia : undefined,
     notificacion_cti: casoBool ? form.notificacion_cti : undefined,
     notificacion_acudiente: casoBool ? form.notificacion_acudiente : undefined,
     notificacion_otro: casoBool ? form.notificacion_otro : undefined,
     notificacion_otro_cual:
       casoBool && form.notificacion_otro ? form.notificacion_otro_cual || undefined : undefined,
   };
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
  atencion_recomendaciones: string;
  certificado_recomendaciones: string;
  seguimiento_opcion: string;
  seguimiento_fecha: string;
  anamnesis_motivo_consulta: string;
  anamnesis_enfermedad_actual: string;
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
  notificacion_policia: boolean;
  notificacion_cti: boolean;
  notificacion_acudiente: boolean;
  notificacion_otro: boolean;
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

  const draftStorageKey = id ? `attend-draft:${id}` : null;
  const didRestoreDraftRef = useRef(false);

  const [isClient, setIsClient] = useState(false);
  const [attentionId, setAttentionId] = useState<number | null>(null);
  const [form, setForm] = useState<AttentionFormState>({
    atencion_recomendaciones: "",
    certificado_recomendaciones: "",
    seguimiento_opcion: "",
    seguimiento_fecha: "",
    anamnesis_motivo_consulta: "",
    anamnesis_enfermedad_actual: "",
    hc_ssr_contenido: "",
    hc_tamizajes_contenido: "",
    hc_examen_fisico_contenido: "",
    hc_valoracion_sistemas_contenido: "",
    llega_por_sus_medios: "",
    llega_por_sus_medios_cual: "",
    estado_a_la_llegada: "",
    caso_accidente_intoxicacion_violencia: "",
    fecha_ocurrencia_evento: "",
    lugar_ocurrencia_evento: "",
    notificacion_policia: false,
    notificacion_cti: false,
    notificacion_acudiente: false,
    notificacion_otro: false,
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
  });
  const [tamizajesForm, setTamizajesForm] = useState<TamizajeRowState[]>(DEFAULT_TAMIZAJES);
  const [activeTab, setActiveTab] = useState<AttendTabKey>("INGRESO");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    if (!draftStorageKey) return;
    if (attentionId) return;
    if (didRestoreDraftRef.current) return;

    didRestoreDraftRef.current = true;

    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;

      const nextForm = (parsed as any).form;
      if (nextForm && typeof nextForm === "object") {
        setForm((prev) => ({ ...prev, ...(nextForm as any) }));
      }

      if (typeof (parsed as any).observacionAntecedentesPersonal === "string") {
        setObservacionAntecedentesPersonal((parsed as any).observacionAntecedentesPersonal);
      }
      if (typeof (parsed as any).observacionAntecedentesFamiliar === "string") {
        setObservacionAntecedentesFamiliar((parsed as any).observacionAntecedentesFamiliar);
      }

      const tra = (parsed as any).antecedentesTraumaticos;
      if (tra && typeof tra === "object") {
        setAntecedentesTraumaticos({
          naturaleza_lesion: String(tra.naturaleza_lesion ?? ""),
          fecha_ocurrencia: String(tra.fecha_ocurrencia ?? ""),
          secuelas: String(tra.secuelas ?? ""),
        });
      }

      const dx = (parsed as any).diagnosticosDraft;
      if (Array.isArray(dx)) {
        const restored = (dx as any[])
          .filter((d) => d && typeof d === "object")
          .map((d) => ({
            codigo_cie10: String(d.codigo_cie10 ?? ""),
            cie10_nombre: d.cie10_nombre != null ? String(d.cie10_nombre) : null,
            cie10_descripcion: d.cie10_descripcion != null ? String(d.cie10_descripcion) : null,
            es_principal: d.es_principal === true,
          }))
          .filter((d) => d.codigo_cie10.trim().length > 0) as DiagnosisDraft[];

        if (restored.length > 0) {
          const idxPrincipal = restored.findIndex((d) => d.es_principal);
          const normalized =
            idxPrincipal < 0
              ? restored
              : restored.map((d, idx) => ({ ...d, es_principal: idx === idxPrincipal }));
          setDiagnosticosDraft(normalized);
        }
      }

      const tab = (parsed as any).activeTab;
      if (typeof tab === "string") {
        setActiveTab(tab as AttendTabKey);
      }
    } catch {
      // ignore
    }
  }, [attentionId, draftStorageKey, isClient]);

  useEffect(() => {
    if (!isClient) return;
    if (!draftStorageKey) return;

    if (attentionId) {
      try {
        window.localStorage.removeItem(draftStorageKey);
      } catch {
        // ignore
      }
      return;
    }

    try {
      const payload = {
        form,
        observacionAntecedentesPersonal,
        observacionAntecedentesFamiliar,
        antecedentesTraumaticos,
        diagnosticosDraft,
        activeTab,
      };
      window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [
    activeTab,
    antecedentesTraumaticos,
    diagnosticosDraft,
    draftStorageKey,
    form,
    isClient,
    attentionId,
    observacionAntecedentesFamiliar,
    observacionAntecedentesPersonal,
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

  const { data: citaData, isLoading: loadingCita, isError: errorCita } = useQuery<AppointmentDetail>(
    {
      queryKey: ["appointment-attend", id],
      enabled: !!id,
      queryFn: () => getAppointmentById(String(id)),
    },
  );

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
        observacionAntecedentesPersonal,
        observacionAntecedentesFamiliar,
        antecedentesTraumaticos,
        diagnosticosDraft,
      });

      return apiClient.post(`/appointments/${id}/attentions`, payload);
    },
    onSuccess: (response: any) => {
      setError(null);
      setSuccessMessage("Atención registrada correctamente. Ahora puede registrar los diagnósticos CIE-10.");
      const createdAttention = response?.data?.atencion;
      if (createdAttention?.id_atencion) {
        setAttentionId(createdAttention.id_atencion);
      }
      setDiagnosticosDraft([]);

      if (draftStorageKey) {
        try {
          window.localStorage.removeItem(draftStorageKey);
        } catch {
          // ignore
        }
      }

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

    const validationError = validateAttendForm({ citaData, form });
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
            </div>

            <div className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 text-[11px] shadow-md">
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
                  <span className="font-semibold">Dirección:</span> {contactoEmergencia?.direccion || "No registrada"}
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
          <AttendTabs activeTab={activeTab} setActiveTab={setActiveTab} />

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

            {activeTab === "DIAGNOSTICOS" && (
              <DiagnosticosTab
                attentionId={attentionId}
                diagnosticosDraft={diagnosticosDraft}
                setDiagnosticosDraft={setDiagnosticosDraft}
                setError={setError}
                setSuccessMessage={setSuccessMessage}
              />
            )}

            {activeTab === "ATENCION" && <AtencionTab form={form} setForm={setForm} />}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? "Cerrando historia Clinica..." : "Cerrar historia Clinica"}
            </button>
          </div>
        </form>

      </section>
    </AppShell>
  );
}
