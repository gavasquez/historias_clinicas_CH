"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Swal from "sweetalert2";
import { AppShell } from "@/components/layout/app-shell";
import { getPatientById } from "@/services/patients";
import { apiClient } from "@/lib/api";
import {
  fetchModalidadesAtencion,
  fetchSedes,
  fetchTiposAtencion,
  type Sede,
} from "@/services/catalogs";
import {
  AttentionDiagnosesSection,
  type DiagnosisDraft,
} from "@/app/appointments/[id]/attend/components/AttentionDiagnosesSection";

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

export default function NewAttentionRecordDirectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const idPaciente = params?.id;
  const { data: session } = useSession();

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

  type SimpleSelectOption = { value: string; label: string };
  type SelectOption = { value: number; label: string };

  type MiniTabKey = "NOTA_ATENCION" | "DIAGNOSTICOS";

  const [fechaHora, setFechaHora] = useState<string>(() => toDatetimeLocalValue(new Date()));

  const [idTipoAtencion, setIdTipoAtencion] = useState<string>("");
  const [idModalidadAtencion, setIdModalidadAtencion] = useState<string>("");
  const [idSede, setIdSede] = useState<string>("");

  const [motivoAtencion, setMotivoAtencion] = useState<string>("");
  const [observacionAnalisis, setObservacionAnalisis] = useState<string>("");
  const [analisis, setAnalisis] = useState<string>("");
  const [planManejo, setPlanManejo] = useState<string>("");

  const [haceParteSeguimiento, setHaceParteSeguimiento] = useState<"" | "SI" | "NO">("");
  const [seguimiento, setSeguimiento] = useState<"" | "SI" | "NO">("");

  const [seguimientoOpcion, setSeguimientoOpcion] = useState<string>("");
  const [seguimientoEfectivo, setSeguimientoEfectivo] = useState<"" | "SI" | "NO">("");
  const [cierreSeguimiento, setCierreSeguimiento] = useState<"" | "SI" | "NO">("");
  const [seguimientoFecha, setSeguimientoFecha] = useState<string>("");
  const [seguimientoObservaciones, setSeguimientoObservaciones] = useState<string>("");
  const [idHistoriaVinculada, setIdHistoriaVinculada] = useState<string>("");

  const [diagnosticosDraft, setDiagnosticosDraft] = useState<DiagnosisDraft[]>([]);

  const [activeTab, setActiveTab] = useState<MiniTabKey>("NOTA_ATENCION");

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: pacienteData, isLoading: loadingPaciente, isError: errorPaciente } = useQuery<any>({
    queryKey: ["new-attention-record-patient", idPaciente],
    enabled: !!idPaciente,
    queryFn: () => getPatientById(String(idPaciente)),
  });

  const { data: tiposAtencionData } = useQuery<any[]>({
    queryKey: ["new-attention-record-tipos-atencion"],
    queryFn: fetchTiposAtencion,
  });

  const { data: modalidadesAtencionData } = useQuery<any[]>({
    queryKey: ["new-attention-record-modalidades-atencion"],
    queryFn: fetchModalidadesAtencion,
  });

  const { data: sedesData } = useQuery<Sede[]>({
    queryKey: ["new-attention-record-sedes"],
    queryFn: fetchSedes,
  });

  const { data: profesionalData } = useQuery<any>({
    queryKey: ["new-attention-record-profesional"],
    queryFn: async () => {
      const res = await apiClient.get("/me/professional");
      return res.data?.data ?? null;
    },
  });

  const shouldRequireHistoriaVinculada = haceParteSeguimiento === "SI";

  useEffect(() => {
    if (!shouldRequireHistoriaVinculada && idHistoriaVinculada) {
      setIdHistoriaVinculada("");
    }
  }, [shouldRequireHistoriaVinculada, idHistoriaVinculada]);

  useEffect(() => {
    if (seguimientoOpcion === "NO_APLICA" || seguimientoOpcion === "") {
      setSeguimientoObservaciones("");
      setSeguimientoFecha("");
    }
  }, [seguimientoOpcion]);

  const { data: followupRecordsData } = useQuery<any[]>({
    queryKey: ["new-attention-record-followup-records", idPaciente],
    enabled: !!idPaciente && shouldRequireHistoriaVinculada,
    queryFn: async () => {
      const res = await apiClient.get(`/patients/${idPaciente}/records`);
      return (res.data?.data ?? []) as any[];
    },
  });

  const followupRecordsFiltered = useMemo(() => {
    const rows = Array.isArray(followupRecordsData) ? followupRecordsData : [];
    return rows.filter((r: any) => {
      const estadoOk = String(r?.estado ?? "").trim() === "Seguimiento";
      const tipoCodigo = String(r?.tipo_historia_codigo ?? "").trim();
      const tipoOk = tipoCodigo === "REG_ATENCION_SALUD";
      return estadoOk && tipoOk;
    });
  }, [followupRecordsData]);

  const followupRecordsOptions = useMemo<SelectOption[]>(() => {
    const rows = Array.isArray(followupRecordsFiltered) ? followupRecordsFiltered : [];
    return rows
      .map((r: any) => {
        const fecha = String(r?.fecha_apertura ?? "");
        const estado = String(r?.estado ?? "").trim();
        const label = [
          fecha ? fecha.slice(0, 10) : "",
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
  }, [followupRecordsFiltered]);

  const selectedFollowupRecord = useMemo(() => {
    const target = idHistoriaVinculada ? Number(idHistoriaVinculada) : NaN;
    if (!Number.isInteger(target) || target <= 0) return null;
    return followupRecordsFiltered.find((r: any) => Number(r?.id_historia) === target) ?? null;
  }, [followupRecordsFiltered, idHistoriaVinculada]);

  const sedeDescripcion = useMemo(() => {
    const rows = Array.isArray(sedesData) ? sedesData : [];
    const target = idSede ? Number(idSede) : NaN;
    if (!Number.isInteger(target) || target <= 0) return "";
    return rows.find((s) => Number(s?.id_sede) === target)?.nombre ?? "";
  }, [idSede, sedesData]);

  const canSubmit =
    fechaHora.trim().length > 0 &&
    idSede.trim().length > 0 &&
    idTipoAtencion.trim().length > 0 &&
    idModalidadAtencion.trim().length > 0 &&
    haceParteSeguimiento.trim().length > 0 &&
    seguimiento.trim().length > 0 &&
    motivoAtencion.trim().length > 0 &&
    observacionAnalisis.trim().length > 0 &&
    analisis.trim().length > 0 &&
    planManejo.trim().length > 0 &&
    (seguimiento !== "SI" || seguimientoOpcion.trim().length > 0) &&
    (!shouldRequireHistoriaVinculada || idHistoriaVinculada.trim().length > 0) &&
    diagnosticosDraft.length > 0;

  const canGoBack = activeTab === "DIAGNOSTICOS";
  const canGoNext = activeTab === "NOTA_ATENCION";

  const handleNav = (direction: "back" | "next") => {
    if (direction === "back") {
      setError(null);
      setActiveTab("NOTA_ATENCION");
      return;
    }

    const metaErrors: string[] = [];

    const dt = new Date(fechaHora);
    if (Number.isNaN(dt.getTime())) metaErrors.push("Fecha de atención inválida.");
    if (!idSede.trim()) metaErrors.push("Debe seleccionar la sede.");
    if (!idTipoAtencion.trim()) metaErrors.push("Debe seleccionar el tipo de atención.");
    if (!idModalidadAtencion.trim()) metaErrors.push("Debe seleccionar la modalidad de atención.");
    if (!seguimiento.trim()) metaErrors.push("Debe seleccionar si es seguimiento.");

    if (metaErrors.length > 0) {
      setError(metaErrors[0]);
      return;
    }

    if (!motivoAtencion.trim()) {
      setError("Debe diligenciar el motivo de atención.");
      return;
    }

    if (!observacionAnalisis.trim()) {
      setError("Debe diligenciar la observación.");
      return;
    }

    if (!planManejo.trim()) {
      setError("Debe diligenciar el plan de manejo.");
      return;
    }

    if (seguimiento === "SI" && !seguimientoOpcion.trim()) {
      setError("Debe seleccionar el tipo de seguimiento.");
      return;
    }

    if (shouldRequireHistoriaVinculada) {
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
    setActiveTab("DIAGNOSTICOS");
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!idPaciente) return;

      setError(null);
      setSuccessMessage(null);

      const dt = new Date(fechaHora);
      if (Number.isNaN(dt.getTime())) {
        throw new Error("Fecha de atención inválida");
      }

      // 1) Crear historia clínica (tipo: REG_ATENCION_SALUD)
      const tiposHistoriaRes = await apiClient.get("/catalogs/history-types");
      const tiposHistoria = (tiposHistoriaRes.data?.data ?? tiposHistoriaRes.data ?? []) as any[];
      const found = tiposHistoria.find((t) => String(t?.codigo ?? "") === "REG_ATENCION_SALUD");
      const idTipoHistoria = found?.id_tipo_historia;
      if (!idTipoHistoria) {
        throw new Error("No se encontró el tipo de historia REG_ATENCION_SALUD en el catálogo");
      }

      const payload = {
        id_tipo_historia: Number(idTipoHistoria),
        id_profesional_responsable: profesionalData?.id_profesional
          ? Number(profesionalData.id_profesional)
          : undefined,
        id_historia_vinculada: shouldRequireHistoriaVinculada
          ? Number(idHistoriaVinculada)
          : undefined,
        motivo_consulta: motivoAtencion,
      };

      const historiaRes = await apiClient.post(`/patients/${idPaciente}/records`, payload);

      const historia = historiaRes.data;
      const idHistoria = historia?.id_historia;
      if (!idHistoria) {
        throw new Error("No se pudo crear la historia clínica (id_historia inválido)");
      }

      // 2) Crear atención (sin cita) con fecha/hora indicada
      await apiClient.post(`/histories/${idHistoria}/attentions`, {
        fecha_hora: dt.toISOString(),
        id_tipo_atencion: Number(idTipoAtencion),
        id_modalidad_atencion: Number(idModalidadAtencion),
        id_sede: idSede ? Number(idSede) : null,
        motivo_atencion: motivoAtencion,
        observacion_analisis: observacionAnalisis,
        analisis,
        plan_manejo: planManejo,
        seguimiento_opcion: seguimiento === "SI" ? seguimientoOpcion || null : "NO_APLICA",
        seguimiento_efectivo:
          seguimiento === "SI" && seguimientoEfectivo === "SI" ? true : seguimiento === "SI" && seguimientoEfectivo === "NO" ? false : null,
        cierre_seguimiento:
          seguimiento === "SI" && cierreSeguimiento === "SI" ? true : seguimiento === "SI" && cierreSeguimiento === "NO" ? false : null,
        seguimiento_fecha: seguimiento === "SI" ? seguimientoFecha || null : null,
        seguimiento_observaciones: seguimientoObservaciones || null,
        diagnosticos: diagnosticosDraft.map((d) => ({
          codigo_cie10: d.codigo_cie10,
          es_principal: d.es_principal,
        })),
      });

      return { idHistoria };
    },
    onSuccess: (res: any) => {
      setError(null);
      setSuccessMessage("Atención registrada correctamente.");
      router.push(`/patients/${idPaciente}/records`);
    },
    onError: (err: any) => {
      const msg = err?.message || "No se pudo registrar la atención.";
      setError(msg);
    },
  });

  useEffect(() => {
    if (!idPaciente) return;
    if (didAttemptPrefillRef.current) return;
    if (createMutation.isPending) return;

    didAttemptPrefillRef.current = true;

    const hasAnyTargetValue = motivoAtencion.trim() || observacionAnalisis.trim() || analisis.trim() || planManejo.trim();
    if (hasAnyTargetValue) return;

    (async () => {
      try {
        const resRecords = await apiClient.get<{ data: any[] }>(`/patients/${idPaciente}/records`);
        const records = Array.isArray(resRecords.data?.data) ? resRecords.data.data : [];
        const targetHistory =
          records.find(
            (r) =>
              Number(r?.attention_count) > 0 &&
              String(r?.tipo_historia_codigo ?? "").trim() === "REG_ATENCION_SALUD",
          ) ?? null;
        const idHistoria = targetHistory?.id_historia ? Number(targetHistory.id_historia) : null;
        if (!idHistoria || !Number.isInteger(idHistoria) || idHistoria <= 0) return;

        const modalResult = await Swal.fire({
          title: "Precargar información clínica",
          text: "Se encontraron atenciones previas del paciente. ¿Deseas precargar datos clínicos (motivo, observación, análisis y plan de manejo)?",
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

        const nextMotivo = String(lastAttention?.hc_anamnesis_atencion?.motivo_consulta ?? "");
        const nextObservacionAnalisis = String(lastAttention?.observacion_analisis ?? "");
        // nextAnalisis no se usa - el análisis no debe precargarse desde atenciones anteriores
        const nextPlan = String(lastAttention?.hc_atencion_cierre?.conducta_plan_estudio_manejo ?? "");
        const nextSeguimientoOpcion = String(lastAttention?.hc_atencion_cierre?.seguimiento_opcion ?? "");
        const nextSeguimientoObservaciones = String(lastAttention?.hc_atencion_cierre?.seguimiento_observaciones ?? "");
        const nextIdHistoriaVinculada = lastAttention?.historia?.id_historia_vinculada;

        setMotivoAtencion((prev) => (prev.trim() ? prev : nextMotivo));
        setObservacionAnalisis((prev) => (prev.trim() ? prev : nextObservacionAnalisis));
        // analisis no se precarga - el profesional debe ingresarlo manualmente
        setPlanManejo((prev) => (prev.trim() ? prev : nextPlan));
        setHaceParteSeguimiento((prev) => {
          if (prev.trim()) return prev;
          if (nextIdHistoriaVinculada) return "SI";
          return "";
        });
        setSeguimiento((prev) => {
          if (prev.trim()) return prev;
          if (nextSeguimientoOpcion && nextSeguimientoOpcion !== "NO_APLICA") return "SI";
          return "";
        });
        setSeguimientoOpcion((prev) => (prev.trim() ? prev : nextSeguimientoOpcion === "NO_APLICA" ? "" : nextSeguimientoOpcion));
        setSeguimientoObservaciones((prev) => (prev.trim() ? prev : nextSeguimientoObservaciones));
        setSeguimientoEfectivo((prev) =>
          prev || (
            lastAttention?.hc_atencion_cierre?.seguimiento_efectivo === true
              ? "SI"
              : lastAttention?.hc_atencion_cierre?.seguimiento_efectivo === false
                ? "NO"
                : ""
          ),
        );
        setCierreSeguimiento((prev) =>
          prev || (
            lastAttention?.hc_atencion_cierre?.cierre_seguimiento === true
              ? "SI"
              : lastAttention?.hc_atencion_cierre?.cierre_seguimiento === false
                ? "NO"
                : ""
          ),
        );
        setSeguimientoFecha((prev) =>
          prev.trim()
            ? prev
            : lastAttention?.hc_atencion_cierre?.seguimiento_fecha
              ? String(lastAttention.hc_atencion_cierre.seguimiento_fecha).slice(0, 10)
              : "",
        );
      } catch {
        // ignore
      }
    })();
  }, [observacionAnalisis, analisis, createMutation.isPending, idPaciente, motivoAtencion, planManejo]);

  const pacienteNombreCompleto = useMemo(() => {
    const nombres = pacienteData?.nombres ?? "";
    const apellidos = pacienteData?.apellidos ?? "";
    return `${nombres} ${apellidos}`.trim();
  }, [pacienteData?.apellidos, pacienteData?.nombres]);

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

  const profesionalNombre =
    profesionalData?.usuarios?.nombre_completo ?? profesionalData?.nombre_completo ?? "";
  const profesionalEmail = profesionalData?.usuarios?.email ?? "";
  const profesionalSede = profesionalData?.sedes?.nombre ?? "";
  const profesionalEspecialidad = profesionalData?.especialidades?.nombre ?? "";

  const roleName = (session?.user as any)?.role as string | undefined;
  const profesionalTitle = roleName === "enfermera" ? "Enfermera" : "Profesional";

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

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Registro de atención de salud</h1>
            <p className="mt-1 text-sm text-slate-600">Diligenciamiento directo</p>
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
                  <span className="font-semibold">Condición particular:</span>{" "}
                  {pacienteCondicionParticular || "No registrada"}
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
            <p className="text-xs font-semibold text-slate-800">Datos de la atención</p>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-700">Sede</label>
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
                <label className="text-[11px] font-semibold text-slate-700">Fecha y hora</label>
                <input
                  type="datetime-local"
                  value={fechaHora}
                  onChange={(e) => setFechaHora(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">
                  Tipo de atención <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <Select
                    isClearable
                    isSearchable
                    classNamePrefix="react-select"
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition="fixed"
                    styles={selectStyles}
                    placeholder="Seleccione..."
                    options={((tiposAtencionData ?? []) as any[])
                      .map((t: any) => ({
                        value: String(t.id_tipo_atencion),
                        label: String(t.descripcion ?? ""),
                      }))
                      .filter((o: any) => String(o.value ?? "").trim() !== "")}
                    value={(() => {
                      if (!idTipoAtencion) return null;
                      const rows = ((tiposAtencionData ?? []) as any[]) ?? [];
                      const found = rows.find((t: any) => String(t?.id_tipo_atencion) === String(idTipoAtencion));
                      if (!found) return null;
                      return {
                        value: String(found.id_tipo_atencion),
                        label: String(found.descripcion ?? ""),
                      } as SimpleSelectOption;
                    })()}
                    onChange={(opt: any) => {
                      const selected = opt as SimpleSelectOption | null;
                      setIdTipoAtencion(selected ? String(selected.value) : "");
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">
                  Modalidad de la atención <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <Select
                    isClearable
                    isSearchable
                    classNamePrefix="react-select"
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition="fixed"
                    styles={selectStyles}
                    placeholder="Seleccione..."
                    options={((modalidadesAtencionData ?? []) as any[])
                      .map((m: any) => ({
                        value: String(m.id_modalidad_atencion),
                        label: String(m.descripcion ?? ""),
                      }))
                      .filter((o: any) => String(o.value ?? "").trim() !== "")}
                    value={(() => {
                      if (!idModalidadAtencion) return null;
                      const rows = ((modalidadesAtencionData ?? []) as any[]) ?? [];
                      const found = rows.find(
                        (m: any) => String(m?.id_modalidad_atencion) === String(idModalidadAtencion),
                      );
                      if (!found) return null;
                      return {
                        value: String(found.id_modalidad_atencion),
                        label: String(found.descripcion ?? ""),
                      } as SimpleSelectOption;
                    })()}
                    onChange={(opt: any) => {
                      const selected = opt as SimpleSelectOption | null;
                      setIdModalidadAtencion(selected ? String(selected.value) : "");
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">
                  Hace parte de un seguimiento? <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <Select
                    isClearable
                    isSearchable
                    classNamePrefix="react-select"
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition="fixed"
                    styles={selectStyles}
                    placeholder="Seleccione..."
                    options={[
                      { value: "SI", label: "Sí" },
                      { value: "NO", label: "No" },
                    ]}
                    value={(() => {
                      if (!haceParteSeguimiento) return null;
                      return haceParteSeguimiento === "SI"
                        ? ({ value: "SI", label: "Sí" } as SimpleSelectOption)
                        : ({ value: "NO", label: "No" } as SimpleSelectOption);
                    })()}
                    onChange={(opt: any) => {
                      const selected = opt as SimpleSelectOption | null;
                      const next = (selected ? selected.value : "") as "" | "SI" | "NO";
                      setHaceParteSeguimiento(next);
                      if (next !== "SI") {
                        setIdHistoriaVinculada("");
                      }
                    }}
                  />
                </div>
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
                      return followupRecordsOptions.find((o: SelectOption) => o.value === target) ?? null;
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
                                  case "NO_APLICA":
                                    return "No Aplica";
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
            </div>

            <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-800">{profesionalTitle}</p>
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

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              disabled
              className={
                activeTab === "NOTA_ATENCION"
                  ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
                  : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 opacity-70 cursor-default"
              }
            >
              Nota de atención
            </button>
            <button
              type="button"
              disabled
              className={
                activeTab === "DIAGNOSTICOS"
                  ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
                  : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 opacity-70 cursor-default"
              }
            >
              Diagnósticos (CIE-10)
            </button>
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}

          {successMessage && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {successMessage}
            </p>
          )}

          {activeTab === "NOTA_ATENCION" && (
            <div className="space-y-3">
              <div className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">NOTA DE ATENCIÓN</div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Motivo de atención</label>
                <input
                  type="text"
                  value={motivoAtencion}
                  onChange={(e) => setMotivoAtencion(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                  placeholder="Motivo de atención"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Observación</label>
                <textarea
                  value={observacionAnalisis}
                  onChange={(e) => setObservacionAnalisis(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-xs shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Plan de manejo</label>
                <textarea
                  value={planManejo}
                  onChange={(e) => setPlanManejo(e.target.value)}
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
                    value={seguimiento}
                    onChange={(e) => {
                      const next = e.target.value as "" | "SI" | "NO";
                      setSeguimiento(next);
                      if (next !== "SI") {
                        setSeguimientoOpcion("");
                        setSeguimientoEfectivo("");
                        setCierreSeguimiento("");
                        setSeguimientoFecha("");
                      }
                    }}
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                  >
                    <option value="">Seleccione...</option>
                    <option value="SI">Sí</option>
                    <option value="NO">No</option>
                  </select>
                </div>

                {seguimiento === "SI" && (
                  <>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700">
                        Tipo de seguimiento <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={seguimientoOpcion}
                        onChange={(e) => {
                          const next = e.target.value;
                          setSeguimientoOpcion(next);
                          if (next !== "CONDICIONES_CRONICAS" && next !== "SITUACION_EN_SALUD") {
                            setSeguimientoEfectivo("");
                            setCierreSeguimiento("");
                          }
                        }}
                        className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                      >
                        <option value="">Seleccione...</option>
                        <option value="CONDICIONES_CRONICAS">CONDICIONES CRÓNICAS</option>
                        <option value="SITUACION_EN_SALUD">SITUACIÓN EN SALUD</option>
                        <option value="NO_APLICA">NO APLICA</option>
                      </select>
                    </div>

                    {(seguimientoOpcion === "CONDICIONES_CRONICAS" || seguimientoOpcion === "SITUACION_EN_SALUD") && (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold text-slate-700">Seguimiento efectivo</p>
                          <div className="flex flex-wrap gap-4 text-xs text-slate-700">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="radio"
                                name="seguimiento_efectivo_direct"
                                checked={seguimientoEfectivo === "SI"}
                                onChange={() => setSeguimientoEfectivo("SI")}
                                className="h-3 w-3"
                              />
                              <span>Sí</span>
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="radio"
                                name="seguimiento_efectivo_direct"
                                checked={seguimientoEfectivo === "NO"}
                                onChange={() => setSeguimientoEfectivo("NO")}
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
                                name="cierre_seguimiento_direct"
                                checked={cierreSeguimiento === "SI"}
                                onChange={() => setCierreSeguimiento("SI")}
                                className="h-3 w-3"
                              />
                              <span>Sí</span>
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="radio"
                                name="cierre_seguimiento_direct"
                                checked={cierreSeguimiento === "NO"}
                                onChange={() => setCierreSeguimiento("NO")}
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
                            value={seguimientoFecha}
                            onChange={(e) => setSeguimientoFecha(e.target.value)}
                            className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-700">Observación</label>
                          <textarea
                            value={seguimientoObservaciones}
                            onChange={(e) => setSeguimientoObservaciones(e.target.value)}
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
            <div className="space-y-3">
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px]">
                <div className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">ANÁLISIS</div>
                <textarea
                  value={analisis}
                  onChange={(e) => setAnalisis(e.target.value)}
                  rows={6}
                  className="min-h-[140px] w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-[11px] shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Escriba el análisis clínico"
                />
              </div>
              <AttentionDiagnosesSection
                diagnosticosDraft={diagnosticosDraft}
                setDiagnosticosDraft={setDiagnosticosDraft}
                setError={setError}
                setSuccessMessage={setSuccessMessage}
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => handleNav("back")}
              disabled={!canGoBack || createMutation.isPending}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Atrás
            </button>

            {canGoNext ? (
              <button
                type="button"
                onClick={() => handleNav("next")}
                disabled={createMutation.isPending}
                className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                disabled={!canSubmit || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Guardar
              </button>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
