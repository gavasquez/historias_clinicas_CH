"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";
import { AppShell } from "@/components/layout/app-shell";
import { getPatientDetailById } from "@/services/patients";
import { fetchPatientRecords } from "@/services/patient-records";
import { fetchHistoryDetail } from "@/services/histories";
import {
  fetchModalidadesAtencion,
  fetchTiposAtencion,
  fetchTiposHistoriaClinica,
} from "@/services/catalogs";
import { apiClient } from "@/lib/api";
import {
  AttentionDiagnosesSection,
  type DiagnosisDraft,
} from "@/app/appointments/[id]/attend/components/AttentionDiagnosesSection";
import type { PacienteDetalle } from "@/types/patients";
import type { PatientClinicalRecordsResponse } from "@/types/patient-records";
import type { HistoryDetailResponse } from "@/types/histories";

export default function PatientRecordsPage() {
  const router = useRouter();
  const params = useParams<{ id: string; }>();
  const id = params?.id;
  const { data: session } = useSession();

  const queryClient = useQueryClient();

  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [expandedAttentions, setExpandedAttentions] = useState<Record<number, boolean>>({});
  const [expandedHistories, setExpandedHistories] = useState<Record<number, boolean>>({});

  const [recordsSearchText, setRecordsSearchText] = useState("");
  const [recordsFilterEstado, setRecordsFilterEstado] = useState<string>("");
  const [recordsFilterTipoHistoria, setRecordsFilterTipoHistoria] = useState<string>("");
  const [recordsFilterSede, setRecordsFilterSede] = useState<string>("");
  const [recordsFilterFechaDesde, setRecordsFilterFechaDesde] = useState<string>("");
  const [recordsFilterFechaHasta, setRecordsFilterFechaHasta] = useState<string>("");

  const [recordsPage, setRecordsPage] = useState(1);

  const [showNewHistoryModal, setShowNewHistoryModal] = useState(false);
  const [newHistoryStep, setNewHistoryStep] = useState<1 | 2>(1);
  const [selectedTipoHistoriaId, setSelectedTipoHistoriaId] = useState<number | null>(null);
  const [selectedNewHistoryTarget, setSelectedNewHistoryTarget] = useState<
    "ATTENTION_RECORD" | "OUTPATIENT" | null
  >(null);
  const [newHistoryWarning, setNewHistoryWarning] = useState<string | null>(null);

  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [evolutionTab, setEvolutionTab] = useState<"new" | "history">("new");
  const [evolutionForm, setEvolutionForm] = useState({
    id_tipo_atencion: "",
    id_modalidad_atencion: "",
    nota_atencion: "",
    analisis: "",
    plan_manejo: "",
  });
  const [diagnosticosDraft, setDiagnosticosDraft] = useState<DiagnosisDraft[]>([]);
  const [evolutionError, setEvolutionError] = useState<string | null>(null);
  const [evolutionSuccess, setEvolutionSuccess] = useState<string | null>(null);

  const isEvolutionFormValid =
    evolutionForm.id_tipo_atencion.trim().length > 0 &&
    evolutionForm.id_modalidad_atencion.trim().length > 0 &&
    evolutionForm.nota_atencion.trim().length > 0 &&
    evolutionForm.analisis.trim().length > 0 &&
    evolutionForm.plan_manejo.trim().length > 0 &&
    diagnosticosDraft.length > 0;

  const estadoBadge = (estado: string | null): { label: string; className: string } => {
    const normalized = String(estado ?? "").trim().toLowerCase();

    if (!normalized) {
      return {
        label: "No registrado",
        className: "bg-slate-100 text-slate-700 ring-slate-200",
      };
    }

    if (normalized === "finalizado") {
      return {
        label: "Finalizado",
        className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      };
    }

    if (normalized === "seguimiento") {
      return {
        label: "Seguimiento",
        className: "bg-amber-50 text-amber-800 ring-amber-200",
      };
    }

    if (normalized === "borrador") {
      return {
        label: "Borrador",
        className: "bg-sky-50 text-sky-700 ring-sky-200",
      };
    }

    return {
      label: estado ?? "No registrado",
      className: "bg-slate-100 text-slate-700 ring-slate-200",
    };
  };

  const { data, isLoading, isError } = useQuery<PacienteDetalle | null>( {
    queryKey: [ "patient-records", id ],
    enabled: !!id,
    queryFn: () => getPatientDetailById( String( id ) ),
  } );

  const {
    data: recordsData,
    isLoading: loadingRecords,
    isError: recordsError,
  } = useQuery<PatientClinicalRecordsResponse>( {
    queryKey: [ "patient-clinical-records", id ],
    enabled: !!id,
    queryFn: () => fetchPatientRecords( String( id ) ),
  } );

  const filteredRecords = useMemo(() => {
    const rows = (recordsData?.data ?? []) as any[];

    const q = recordsSearchText.trim().toLowerCase();
    const estado = recordsFilterEstado.trim().toLowerCase();
    const tipo = recordsFilterTipoHistoria.trim().toLowerCase();
    const sede = recordsFilterSede.trim().toLowerCase();
    const desde = recordsFilterFechaDesde.trim();
    const hasta = recordsFilterFechaHasta.trim();

    return rows.filter((h) => {
      const matchesEstado = !estado || String(h?.estado ?? "").trim().toLowerCase() === estado;
      const matchesTipo = !tipo || String(h?.tipo_historia ?? "").trim().toLowerCase() === tipo;
      const matchesSede = !sede || String(h?.last_attention_sede ?? "").trim().toLowerCase() === sede;

      const rawDate = h?.last_attention_fecha_hora ?? h?.fecha_apertura;
      const rowDate = rawDate ? String(rawDate).slice(0, 10) : "";
      const matchesDesde = !desde || (rowDate && rowDate >= desde);
      const matchesHasta = !hasta || (rowDate && rowDate <= hasta);
      const matchesFecha = matchesDesde && matchesHasta;

      if (!q) return matchesEstado && matchesTipo && matchesSede && matchesFecha;

      const haystack = [
        h?.last_attention_sede,
        h?.tipo_historia,
        h?.profesional_responsable,
        h?.profesional_registro,
        h?.estado,
        h?.last_attention_tipo,
        h?.last_attention_modalidad,
        h?.last_attention_seguimiento === true ? "si" : h?.last_attention_seguimiento === false ? "no" : "",
        h?.fecha_apertura,
        h?.last_attention_fecha_hora,
        (h as any)?.linked_history_summary?.tipo_historia,
        (h as any)?.linked_history_summary?.profesional_responsable,
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ");

      return matchesEstado && matchesTipo && matchesSede && matchesFecha && haystack.includes(q);
    });
  }, [
    recordsData?.data,
    recordsSearchText,
    recordsFilterEstado,
    recordsFilterTipoHistoria,
    recordsFilterSede,
    recordsFilterFechaDesde,
    recordsFilterFechaHasta,
  ]);

  // Agrupar historias para el acordeón: principales (sin vinculación) y sus hijas
  const groupedRecords = useMemo(() => {
    const rows = filteredRecords;

    // Función para obtener la fecha de ordenamiento (prioriza última atención, luego fecha apertura)
    const getSortDate = (h: any) => {
      return h.last_attention_fecha_hora || h.fecha_apertura;
    };

    // Función para determinar prioridad (seguimiento tiene prioridad)
    const getSortPriority = (h: any) => {
      const estado = String(h.estado ?? "").trim().toLowerCase();
      return estado === "seguimiento" ? 1 : 0;
    };

    // Identificar grupos de historias vinculadas
    // Cada grupo consiste en una historia principal y todas sus hijas
    const groups = new Map<number, Set<number>>();
    const processed = new Set<number>();

    rows.forEach(h => {
      const historyId = h.id_historia;
      const linkedId = h.id_historia_vinculada ? Number(h.id_historia_vinculada) : null;

      if (!processed.has(historyId)) {
        // Crear un nuevo grupo con esta historia
        const group = new Set<number>();
        group.add(historyId);
        processed.add(historyId);
        groups.set(historyId, group);

        // Si tiene una historia vinculada, agregarla al mismo grupo
        if (linkedId && !processed.has(linkedId)) {
          group.add(linkedId);
          processed.add(linkedId);

          // También buscar si la historia vinculada tiene otras hijas
          rows.forEach(other => {
            const otherLinkedId = other.id_historia_vinculada ? Number(other.id_historia_vinculada) : null;
            if (otherLinkedId === linkedId && !processed.has(other.id_historia)) {
              group.add(other.id_historia);
              processed.add(other.id_historia);
            }
          });
        }

        // Buscar hijas directas de esta historia
        rows.forEach(other => {
          const otherLinkedId = other.id_historia_vinculada ? Number(other.id_historia_vinculada) : null;
          if (otherLinkedId === historyId && !processed.has(other.id_historia)) {
            group.add(other.id_historia);
            processed.add(other.id_historia);
          }
        });
      }
    });

    // Para cada grupo, determinar cuál es el registro más reciente para ser el encabezado
    const groupArray = Array.from(groups.entries()).map(([rootId, memberIds]) => {
      const members = rows.filter(h => memberIds.has(h.id_historia));
      
      // Ordenar miembros del grupo por fecha (más reciente primero), luego por estado
      members.sort((a, b) => {
        const dateA = new Date(getSortDate(a)).getTime();
        const dateB = new Date(getSortDate(b)).getTime();
        
        if (dateA !== dateB) {
          return dateB - dateA;
        }
        
        const priorityA = getSortPriority(a);
        const priorityB = getSortPriority(b);
        return priorityB - priorityA;
      });

      // El más reciente será el encabezado del acordeón
      const header = members[0];
      const children = members.slice(1);

      return {
        header,
        children,
        hasChildren: children.length > 0
      };
    });

    // Ordenar los grupos por fecha del encabezado (más reciente primero)
    groupArray.sort((a, b) => {
      const dateA = new Date(getSortDate(a.header)).getTime();
      const dateB = new Date(getSortDate(b.header)).getTime();
      
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      
      const priorityA = getSortPriority(a.header);
      const priorityB = getSortPriority(b.header);
      return priorityB - priorityA;
    });

    // Retornar estructura para el acordeón
    return groupArray.map(g => ({
      ...g.header,
      children: g.children,
      hasChildren: g.hasChildren
    }));
  }, [filteredRecords]);

  const recordsFilterOptions = useMemo(() => {
    const rows = (recordsData?.data ?? []) as any[];
    const estados = Array.from(
      new Set(rows.map((h) => String(h?.estado ?? "").trim()).filter((x) => x.length > 0)),
    ).sort((a, b) => a.localeCompare(b));

    const tipos = Array.from(
      new Set(rows.map((h) => String(h?.tipo_historia ?? "").trim()).filter((x) => x.length > 0)),
    ).sort((a, b) => a.localeCompare(b));

    const sedes = Array.from(
      new Set(rows.map((h) => String(h?.last_attention_sede ?? "").trim()).filter((x) => x.length > 0)),
    ).sort((a, b) => a.localeCompare(b));

    return { estados, tipos, sedes };
  }, [recordsData?.data]);

  useEffect(() => {
    setRecordsPage(1);
  }, [
    recordsSearchText,
    recordsFilterEstado,
    recordsFilterTipoHistoria,
    recordsFilterSede,
    recordsFilterFechaDesde,
    recordsFilterFechaHasta,
  ]);

  const totalPages = useMemo(() => {
    const n = groupedRecords.length;
    const size = 10;
    return Math.max(1, Math.ceil(n / size));
  }, [groupedRecords.length]);

  useEffect(() => {
    if (recordsPage > totalPages) setRecordsPage(totalPages);
    if (recordsPage < 1) setRecordsPage(1);
  }, [recordsPage, totalPages]);

  const paginatedRecords = useMemo(() => {
    const size = 10;
    const page = Number.isFinite(recordsPage) && recordsPage > 0 ? recordsPage : 1;
    const start = (page - 1) * size;
    return groupedRecords.slice(start, start + size);
  }, [groupedRecords, recordsPage]);

  const toggleHistoryExpansion = (historyId: number) => {
    setExpandedHistories(prev => ({
      ...prev,
      [historyId]: !prev[historyId]
    }));
  };

  const historyDetailEnabled = selectedHistoryId != null;
  const {
    data: historyDetail,
    isLoading: loadingHistoryDetail,
    isError: errorHistoryDetail,
  } = useQuery<HistoryDetailResponse>({
    queryKey: ["history-detail", selectedHistoryId],
    enabled: historyDetailEnabled,
    queryFn: () => fetchHistoryDetail(String(selectedHistoryId)),
  });

  const detailData = useMemo(() => {
    return historyDetail?.data ?? null;
  }, [historyDetail]);

  const { data: tiposAtencionData } = useQuery({
    queryKey: ["catalog-attention-types"],
    queryFn: () => fetchTiposAtencion(),
  });

  const { data: modalidadesAtencionData } = useQuery({
    queryKey: ["catalog-attention-modalities"],
    queryFn: () => fetchModalidadesAtencion(),
  });

  const { data: tiposHistoriaClinicaData } = useQuery({
    queryKey: ["catalog-history-types"],
    queryFn: () => fetchTiposHistoriaClinica(),
  });

  const openNewHistoryModal = () => {
    setSelectedTipoHistoriaId(null);
    setSelectedNewHistoryTarget(null);
    setNewHistoryStep(1);
    setNewHistoryWarning(null);
    setShowNewHistoryModal(true);
  };

  const selectHistoryType = (target: "ATTENTION_RECORD" | "OUTPATIENT") => {
    const rows = (tiposHistoriaClinicaData as any[] | undefined) ?? [];

    // Restrict enfermera from creating HC_CONSULTA_EXTERNA
    const roleName = (session?.user as any)?.role as string | undefined;
    if (roleName === "enfermera" && target === "OUTPATIENT") {
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: "El rol de enfermería no puede crear historias clínicas de consulta externa. Por favor registre la atención como Registro de atención de salud.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    const targetCodigo =
      target === "ATTENTION_RECORD" ? "REG_ATENCION_SALUD" : "HC_CONSULTA_EXTERNA";

    const found = rows.find((t: any) => String(t?.codigo ?? "") === targetCodigo);

    if (!found?.id_tipo_historia) {
      setSelectedTipoHistoriaId(null);
      setSelectedNewHistoryTarget(target);
      setNewHistoryWarning(
        `No se encontró el tipo en el catálogo (${targetCodigo}). Revisa la tabla tipos_historia_clinica o ejecuta el seed.`,
      );
      setNewHistoryStep(2);
      return;
    }

    setNewHistoryWarning(null);
    setSelectedTipoHistoriaId(Number(found.id_tipo_historia));
    setSelectedNewHistoryTarget(target);
    setNewHistoryStep(2);
  };

  const goScheduleAppointment = () => {
    if (!id) return;
    setShowNewHistoryModal(false);
    router.push(`/appointments/new?patientId=${encodeURIComponent(String(id))}`);
  };

  const goFillHistoryDirectly = () => {
    if (!id) return;
    setShowNewHistoryModal(false);
    if (selectedNewHistoryTarget === "OUTPATIENT") {
      router.push(`/patients/${id}/records/new/outpatient`);
      return;
    }

    if (selectedNewHistoryTarget === "ATTENTION_RECORD") {
      router.push(`/patients/${id}/records/new/attention-record`);
      return;
    }

    const qs = selectedTipoHistoriaId ? `?id_tipo_historia=${selectedTipoHistoriaId}` : "";
    router.push(`/patients/${id}/records/new${qs}`);
  };

  const evolutionNotesEnabled = selectedHistoryId != null && showEvolutionModal;
  const { data: evolutionNotesData, isLoading: loadingEvolutionNotes } = useQuery({
    queryKey: ["history-evolution-notes", selectedHistoryId],
    enabled: evolutionNotesEnabled,
    queryFn: async () => {
      const res = await apiClient.get<{ data: any[] }>(
        `/histories/${selectedHistoryId}/evolution-notes`,
      );
      return res.data;
    },
  });

  const createEvolutionNoteMutation = useMutation({
    mutationFn: async () => {
      if (selectedHistoryId == null) return;

      setEvolutionError(null);
      setEvolutionSuccess(null);

      const payload = {
        id_tipo_atencion: evolutionForm.id_tipo_atencion || null,
        id_modalidad_atencion: evolutionForm.id_modalidad_atencion || null,
        nota_atencion: evolutionForm.nota_atencion,
        analisis: evolutionForm.analisis,
        plan_manejo: evolutionForm.plan_manejo,
        diagnosticos: diagnosticosDraft.map((d) => ({
          codigo_cie10: d.codigo_cie10,
          es_principal: d.es_principal,
        })),
      };

      return apiClient.post(`/histories/${selectedHistoryId}/evolution-notes`, payload);
    },
    onSuccess: async () => {
      if (selectedHistoryId != null) {
        await queryClient.invalidateQueries({
          queryKey: ["history-evolution-notes", selectedHistoryId],
        });
        await queryClient.invalidateQueries({ queryKey: ["history-detail", selectedHistoryId] });
      }
      setEvolutionSuccess("Nota de evolución guardada correctamente.");
      setEvolutionForm({
        id_tipo_atencion: "",
        id_modalidad_atencion: "",
        nota_atencion: "",
        analisis: "",
        plan_manejo: "",
      });
      setDiagnosticosDraft([]);
    },
    onError: (err: any) => {
      const backendMessage = err?.response?.data?.message;
      setEvolutionError(
        typeof backendMessage === "string" && backendMessage.trim().length > 0
          ? backendMessage
          : err?.message || "No se pudo guardar la nota de evolución.",
      );
    },
  });

  const openEvolutionModalForHistory = (historyId: number) => {
    setSelectedHistoryId(historyId);
    setEvolutionError(null);
    setEvolutionSuccess(null);
    setEvolutionTab("new");
    setEvolutionForm({
      id_tipo_atencion: "",
      id_modalidad_atencion: "",
      nota_atencion: "",
      analisis: "",
      plan_manejo: "",
    });
    setDiagnosticosDraft([]);
    setShowEvolutionModal(true);
  };

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Historias Clinicas del paciente
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Consulta y gestion de historias Clinicas asociadas al paciente.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={ () => router.push( `/patients/${ id }` ) }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Volver al detalle del paciente
            </button>
            <button
              type="button"
              onClick={openNewHistoryModal}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              Nueva historia clínica
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          { isLoading && <p className="text-sm text-slate-500">Cargando informacion del paciente...</p> }

          { isError && !isLoading && (
            <p className="text-sm text-red-600">
              Ocurrio un error al cargar la informacion del paciente.
            </p>
          ) }

          { !isLoading && !isError && !data && (
            <p className="text-sm text-slate-500">Paciente no encontrado.</p>
          ) }

          { !isLoading && !isError && data && (
            <div className="space-y-4">
              <div className="space-y-1 text-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">Paciente</p>
                <p className="text-sm font-medium text-slate-900">
                  { data.nombres } { data.apellidos }
                </p>
                <p className="text-xs text-slate-600">
                  { data.tipos_documento?.codigo ?? "" } { data.numero_documento }
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Historias clínicas
                </p>
                { loadingRecords && (
                  <p className="text-sm text-slate-500">
                    Cargando historias clínicas...
                  </p>
                ) }

                { recordsError && !loadingRecords && (
                  <p className="text-sm text-red-600">
                    Ocurrió un error al cargar las historias clínicas.
                  </p>
                ) }

                { !loadingRecords && !recordsError && ( recordsData?.data.length ?? 0 ) === 0 && (
                  <p className="text-sm text-slate-500">
                    Aún no hay historias clínicas registradas para este paciente.
                  </p>
                ) }

                { !loadingRecords && !recordsError && ( recordsData?.data.length ?? 0 ) > 0 && (
                  <div className="space-y-3">
                    <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-12">
                      <div className="md:col-span-3">
                        <p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Buscar</p>
                        <input
                          value={recordsSearchText}
                          onChange={(e) => setRecordsSearchText(e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm outline-none focus:border-sky-400"
                          placeholder="Tipo, profesional..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Estado</p>
                        <select
                          value={recordsFilterEstado}
                          onChange={(e) => setRecordsFilterEstado(e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm outline-none focus:border-sky-400"
                        >
                          <option value="">Todos</option>
                          {recordsFilterOptions.estados.map((x) => (
                            <option key={x} value={x}>
                              {x}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Tipo</p>
                        <select
                          value={recordsFilterTipoHistoria}
                          onChange={(e) => setRecordsFilterTipoHistoria(e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm outline-none focus:border-sky-400"
                        >
                          <option value="">Todos</option>
                          {recordsFilterOptions.tipos.map((x) => (
                            <option key={x} value={x}>
                              {x}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Sede</p>
                        <select
                          value={recordsFilterSede}
                          onChange={(e) => setRecordsFilterSede(e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm outline-none focus:border-sky-400"
                        >
                          <option value="">Todas</option>
                          {recordsFilterOptions.sedes.map((x) => (
                            <option key={x} value={x}>
                              {x}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Fecha</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={recordsFilterFechaDesde}
                            onChange={(e) => setRecordsFilterFechaDesde(e.target.value)}
                            className="h-[34px] w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 shadow-sm outline-none focus:border-sky-400"
                          />
                          <span className="text-xs text-slate-500">-</span>
                          <input
                            type="date"
                            value={recordsFilterFechaHasta}
                            onChange={(e) => setRecordsFilterFechaHasta(e.target.value)}
                            className="h-[34px] w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 shadow-sm outline-none focus:border-sky-400"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-12 flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-600">
                          Mostrando {filteredRecords.length} de {recordsData?.data.length ?? 0}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setRecordsSearchText("");
                            setRecordsFilterEstado("");
                            setRecordsFilterTipoHistoria("");
                            setRecordsFilterSede("");
                            setRecordsFilterFechaDesde("");
                            setRecordsFilterFechaHasta("");
                          }}
                          className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>

                    {filteredRecords.length === 0 ? (
                      <div className="rounded-md border border-slate-200 bg-white p-4">
                        <p className="text-sm text-slate-600">No hay resultados con los filtros actuales.</p>
                      </div>
                    ) : null}

                    <div className="overflow-x-auto rounded-md border border-slate-200">
                    <table className="min-w-full text-left text-[11px]">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2 w-8"></th>
                          <th className="px-3 py-2">Sede</th>
                          <th className="px-3 py-2">Fecha</th>
                          <th className="px-3 py-2">Tipo</th>
                          <th className="px-3 py-2">Profesional</th>
                          <th className="px-3 py-2">Registro del profesional</th>
                          <th className="px-3 py-2">Estado</th>
                          <th className="px-3 py-2">Tipo de atención</th>
                          <th className="px-3 py-2">Modalidad de la atención</th>
                          <th className="px-3 py-2">Seguimiento</th>
                          <th className="px-3 py-2">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                        { paginatedRecords.map( ( h ) => (
                          <React.Fragment key={ h.id_historia }>
                            {/* Fila principal */}
                            <tr
                              className="cursor-pointer hover:bg-slate-50"
                              onClick={() => {
                                setSelectedHistoryId(h.id_historia);
                                setExpandedAttentions({});
                              }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  setSelectedHistoryId(h.id_historia);
                                  setExpandedAttentions({});
                                }
                              }}
                            >
                              <td className="px-3 py-2">
                                {h.hasChildren ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleHistoryExpansion(h.id_historia);
                                    }}
                                    className="text-slate-500 hover:text-slate-700 transition-colors cursor-pointer text-lg"
                                    title={expandedHistories[h.id_historia] ? "Contraer historias vinculadas" : "Expandir historias vinculadas"}
                                  >
                                    {expandedHistories[h.id_historia] ? "📂" : "📁"}
                                  </button>
                                ) : (
                                  <span className="text-slate-300 text-lg" title="Historia sin vinculadas">📄</span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <div className="max-w-[160px] truncate" title={h.last_attention_sede ?? "No registrado"}>
                                  { h.last_attention_sede ?? "No registrado" }
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                { new Date( (h.last_attention_fecha_hora ?? h.fecha_apertura) ).toLocaleString() }
                              </td>
                              <td className="px-3 py-2">
                                <div
                                  className="max-w-[180px] truncate"
                                  title={h.tipo_historia}
                                >
                                  { h.tipo_historia }
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div
                                  className="max-w-[180px] truncate"
                                  title={h.profesional_responsable ?? "No registrado"}
                                >
                                  { h.profesional_responsable ?? "No registrado" }
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div
                                  className="max-w-[180px] truncate"
                                  title={h.profesional_registro ?? "No registrado"}
                                >
                                  { h.profesional_registro ?? "No registrado" }
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                {(() => {
                                  const badge = estadoBadge(h.estado);
                                  return (
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${badge.className}`}
                                    >
                                      {badge.label}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="px-3 py-2">
                                <div className="max-w-[180px] truncate" title={h.last_attention_tipo ?? "No registrado"}>
                                  { h.last_attention_tipo ?? "No registrado" }
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="max-w-[180px] truncate" title={h.last_attention_modalidad ?? "No registrado"}>
                                  { h.last_attention_modalidad ?? "No registrado" }
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                {(() => {
                                  const seguimientoValue = typeof h.last_attention_seguimiento === "boolean"
                                    ? (h.last_attention_seguimiento ? "SI" : "NO")
                                    : (h.estado === "Seguimiento" ? "SI" : "NO");
                                  const isSeguimiento = seguimientoValue === "SI";
                                  return (
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                                        isSeguimiento
                                          ? "bg-amber-100 text-amber-800 ring-amber-300"
                                          : "bg-red-100 text-red-800 ring-red-300"
                                      }`}
                                    >
                                      {seguimientoValue}
                                    </span>
                                  );
                                })()}
                              </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedHistoryId(h.id_historia);
                                    setExpandedAttentions({});
                                  }}
                                  className="cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                >
                                  Ver detalle
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEvolutionModalForHistory(h.id_historia);
                                  }}
                                  className="cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                >
                                  Notas evolución
                                </button>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Filas de historias hijas (solo si está expandido) */}
                          {h.hasChildren && expandedHistories[h.id_historia] && h.children.map((child: any) => (
                            <tr
                              key={`child-${child.id_historia}`}
                              className="bg-slate-50/50 cursor-pointer hover:bg-slate-50/80"
                              onClick={() => {
                                setSelectedHistoryId(child.id_historia);
                                setExpandedAttentions({});
                              }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  setSelectedHistoryId(child.id_historia);
                                  setExpandedAttentions({});
                                }
                              }}
                            >
                              <td className="px-3 py-2 pl-8">
                                <span className="text-slate-400 text-lg" title="Historia vinculada">📄</span>
                              </td>
                              <td className="px-3 py-2">
                                <div className="max-w-[160px] truncate" title={child.last_attention_sede ?? "No registrado"}>
                                  { child.last_attention_sede ?? "No registrado" }
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                { new Date( (child.last_attention_fecha_hora ?? child.fecha_apertura) ).toLocaleString() }
                              </td>
                              <td className="px-3 py-2">
                                <div
                                  className="max-w-[180px] truncate"
                                  title={child.tipo_historia}
                                >
                                  { child.tipo_historia }
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div
                                  className="max-w-[180px] truncate"
                                  title={child.profesional_responsable ?? "No registrado"}
                                >
                                  { child.profesional_responsable ?? "No registrado" }
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div
                                  className="max-w-[180px] truncate"
                                  title={child.profesional_registro ?? "No registrado"}
                                >
                                  { child.profesional_registro ?? "No registrado" }
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                {(() => {
                                  const badge = estadoBadge(child.estado);
                                  return (
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${badge.className}`}
                                    >
                                      {badge.label}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="px-3 py-2">
                                <div className="max-w-[180px] truncate" title={child.last_attention_tipo ?? "No registrado"}>
                                  { child.last_attention_tipo ?? "No registrado" }
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="max-w-[180px] truncate" title={child.last_attention_modalidad ?? "No registrado"}>
                                  { child.last_attention_modalidad ?? "No registrado" }
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                {(() => {
                                  const seguimientoValue = typeof child.last_attention_seguimiento === "boolean"
                                    ? (child.last_attention_seguimiento ? "SI" : "NO")
                                    : (child.estado === "Seguimiento" ? "SI" : "NO");
                                  const isSeguimiento = seguimientoValue === "SI";
                                  return (
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                                        isSeguimiento
                                          ? "bg-amber-100 text-amber-800 ring-amber-300"
                                          : "bg-red-100 text-red-800 ring-red-300"
                                      }`}
                                    >
                                      {seguimientoValue}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedHistoryId(child.id_historia);
                                      setExpandedAttentions({});
                                    }}
                                    className="cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                  >
                                    Ver detalle
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          </React.Fragment>
                        ) ) }
                      </tbody>
                    </table>
                  </div>

                    {filteredRecords.length > 0 ? (
                      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                        <span>
                          Página {recordsPage} de {totalPages} · {filteredRecords.length} historias
                        </span>
                        <div className="flex gap-2">
                          <button
                            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={recordsPage <= 1}
                            onClick={() => setRecordsPage((p) => Math.max(p - 1, 1))}
                          >
                            Anterior
                          </button>
                          <button
                            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={recordsPage >= totalPages}
                            onClick={() =>
                              setRecordsPage((currentPage: number) =>
                                Math.min(currentPage + 1, totalPages),
                              )
                            }
                          >
                            Siguiente
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) }
              </div>
            </div>
          ) }
        </div>

        {selectedHistoryId != null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Detalle de historia clínica</h2>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Historia #{selectedHistoryId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedHistoryId != null) {
                        openEvolutionModalForHistory(selectedHistoryId);
                      }
                    }}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Notas de evolución
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHistoryId(null);
                    }}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cerrar detalle
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(90vh-60px)] overflow-auto p-4">
                {loadingHistoryDetail && (
                  <p className="text-xs text-slate-500">Cargando detalle...</p>
                )}

                {errorHistoryDetail && !loadingHistoryDetail && (
                  <p className="text-xs text-red-600">Ocurrió un error cargando el detalle.</p>
                )}

                {!loadingHistoryDetail && !errorHistoryDetail && detailData && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-500">Tipo</p>
                          <p className="text-xs text-slate-800">
                            {detailData.tipos_historia_clinica?.descripcion ?? "Sin tipo"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-500">Estado</p>
                          <p className="text-xs text-slate-800">{detailData.estado ?? "Sin estado"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-500">Fecha apertura</p>
                          <p className="text-xs text-slate-800">
                            {detailData.fecha_apertura
                              ? new Date(detailData.fecha_apertura).toLocaleString()
                              : "Sin fecha"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-500">Profesional</p>
                          <p className="text-xs text-slate-800">
                            {detailData.profesionales_salud?.usuarios?.nombre_completo ?? "No registrado"}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-[10px] font-semibold uppercase text-slate-500">Motivo consulta</p>
                          <p className="text-xs text-slate-800">
                            {detailData.motivo_consulta ?? "Sin motivo"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-800">Atenciones</p>

                      {(detailData.atenciones_salud?.length ?? 0) === 0 && (
                        <p className="text-xs text-slate-500">Esta historia no tiene atenciones registradas.</p>
                      )}

                      {(detailData.atenciones_salud ?? []).map((a: any) => {
                        const isExpanded = expandedAttentions[a.id_atencion] === true;
                        const dxPrincipal = (a.diagnosticos_atencion ?? []).find((d: any) => d.es_principal);
                        return (
                          <div key={a.id_atencion} className="rounded-lg border border-slate-200">
                            <div className="flex items-start justify-between gap-3 p-3">
                              <div className="space-y-0.5">
                                <p className="text-xs font-semibold text-slate-900">
                                  Atención #{a.id_atencion}
                                </p>
                                <p className="text-[11px] text-slate-600">
                                  {a.fecha_hora ? new Date(a.fecha_hora).toLocaleString() : "Sin fecha"}
                                  {a.tipos_atencion?.descripcion ? ` · ${a.tipos_atencion.descripcion}` : ""}
                                  {a.modalidades_atencion?.descripcion
                                    ? ` · ${a.modalidades_atencion.descripcion}`
                                    : ""}
                                </p>
                                {dxPrincipal?.codigo_cie10 && (
                                  <p className="text-[11px] text-slate-700">
                                    <span className="font-semibold">Dx principal:</span>{" "}
                                    <span className="font-mono">{dxPrincipal.codigo_cie10}</span>
                                    {dxPrincipal.cie10?.nombre ? ` · ${dxPrincipal.cie10.nombre}` : ""}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedAttentions((prev) => ({
                                    ...prev,
                                    [a.id_atencion]: !isExpanded,
                                  }))
                                }
                                className="cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                              >
                                {isExpanded ? "Ocultar" : "Ver"}
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="space-y-3 border-t border-slate-200 p-3 text-[11px] text-slate-700">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-slate-500">Ingreso</p>
                                  <p>
                                    <span className="font-semibold">Llega por sus medios:</span>{" "}
                                    {a.llega_por_sus_medios === true
                                      ? "Sí"
                                      : a.llega_por_sus_medios === false
                                        ? "No"
                                        : "Sin dato"}
                                    {a.llega_por_sus_medios === false && a.llega_por_sus_medios_cual
                                      ? ` · ${a.llega_por_sus_medios_cual}`
                                      : ""}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Estado a la llegada:</span>{" "}
                                    {a.estado_a_la_llegada ?? "Sin dato"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-slate-500">Anamnesis</p>
                                  <p>
                                    <span className="font-semibold">Motivo:</span>{" "}
                                    {a.hc_anamnesis_atencion?.motivo_consulta ?? "Sin dato"}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Enfermedad actual:</span>{" "}
                                    {a.hc_anamnesis_atencion?.enfermedad_actual ?? "Sin dato"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-slate-500">Cierre</p>
                                  <p>
                                    {a.hc_atencion_cierre?.recomendaciones ?? "Sin recomendaciones"}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedHistoryId != null && showEvolutionModal && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-2"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex max-h-[95vh] w-screen max-w-none flex-col overflow-hidden rounded-xl bg-white shadow-xl">
              <div className="border-b border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold uppercase text-white">
                      NOTA DE EVOLUCIÓN
                    </div>
                    <p className="mt-1 text-xs text-slate-600">Historia #{selectedHistoryId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEvolutionModal(false)}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEvolutionTab("new")}
                    className={
                      evolutionTab === "new"
                        ? "rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white"
                        : "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    }
                  >
                    Nueva nota
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvolutionTab("history")}
                    className={
                      evolutionTab === "history"
                        ? "rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white"
                        : "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    }
                  >
                    Historial
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4">
                {evolutionError && (
                  <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {evolutionError}
                  </p>
                )}
                {evolutionSuccess && (
                  <p className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    {evolutionSuccess}
                  </p>
                )}

                {!isEvolutionFormValid && evolutionTab === "new" && (
                  <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Todos los campos son obligatorios (incluye al menos un diagnóstico CIE-10).
                  </p>
                )}

                {evolutionTab === "new" && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-4">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
                          FECHA Y HORA
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-slate-500">Fecha de atención</p>
                            <p className="text-xs text-slate-800">{new Date().toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-slate-500">Hora</p>
                            <p className="text-xs text-slate-800">{new Date().toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
                          CLASIFICACIÓN DE ATENCIÓN
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700">Tipo de atención</label>
                            <select
                              value={evolutionForm.id_tipo_atencion}
                              onChange={(e) =>
                                setEvolutionForm((prev) => ({
                                  ...prev,
                                  id_tipo_atencion: e.target.value,
                                }))
                              }
                              className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                            >
                              <option value="">Seleccione...</option>
                              {(tiposAtencionData as any[] | undefined)?.map((t: any) => (
                                <option key={t.id_tipo_atencion} value={String(t.id_tipo_atencion)}>
                                  {t.descripcion}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700">Modalidad de atención</label>
                            <select
                              value={evolutionForm.id_modalidad_atencion}
                              onChange={(e) =>
                                setEvolutionForm((prev) => ({
                                  ...prev,
                                  id_modalidad_atencion: e.target.value,
                                }))
                              }
                              className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                            >
                              <option value="">Seleccione...</option>
                              {(modalidadesAtencionData as any[] | undefined)?.map((m: any) => (
                                <option key={m.id_modalidad_atencion} value={String(m.id_modalidad_atencion)}>
                                  {m.descripcion}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <AttentionDiagnosesSection
                        diagnosticosDraft={diagnosticosDraft}
                        setDiagnosticosDraft={setDiagnosticosDraft}
                        setError={setEvolutionError}
                        setSuccessMessage={setEvolutionSuccess}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
                          NOTA DE ATENCIÓN
                        </div>
                        <label className="text-[11px] font-semibold text-slate-700">Nota de Atención</label>
                        <textarea
                          value={evolutionForm.nota_atencion}
                          onChange={(e) =>
                            setEvolutionForm((p) => ({ ...p, nota_atencion: e.target.value }))
                          }
                          rows={6}
                          className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          placeholder="Escriba aquí la nota de atención..."
                        />
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
                          OBSERVACIÓN / ANÁLISIS
                        </div>
                        <label className="text-[11px] font-semibold text-slate-700">Observación / Análisis</label>
                        <textarea
                          value={evolutionForm.analisis}
                          onChange={(e) =>
                            setEvolutionForm((p) => ({ ...p, analisis: e.target.value }))
                          }
                          rows={5}
                          className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          placeholder="Observación / análisis"
                        />
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
                          PLAN DE MANEJO
                        </div>
                        <label className="text-[11px] font-semibold text-slate-700">Plan de manejo</label>
                        <textarea
                          value={evolutionForm.plan_manejo}
                          onChange={(e) =>
                            setEvolutionForm((p) => ({ ...p, plan_manejo: e.target.value }))
                          }
                          rows={5}
                          className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          placeholder="Plan de manejo"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEvolutionModal(false)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => createEvolutionNoteMutation.mutate()}
                    disabled={
                      evolutionTab !== "new" ||
                      !isEvolutionFormValid ||
                      createEvolutionNoteMutation.isPending
                    }
                    className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createEvolutionNoteMutation.isPending ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showNewHistoryModal && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
              <div className="border-b border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold uppercase text-white">
                      NUEVA HISTORIA CLÍNICA
                    </div>
                    <p className="mt-1 text-xs text-slate-600">Seleccione el flujo a realizar</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewHistoryModal(false)}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              <div className="p-4">
                {newHistoryStep === 1 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-700">1) Tipo</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => selectHistoryType("ATTENTION_RECORD")}
                        className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 text-left text-xs text-slate-700 hover:bg-slate-50"
                      >
                        <div className="font-semibold text-slate-900">Registro de atención de salud</div>
                        <div className="mt-1 text-[11px] text-slate-600">
                          Crea/gestiona historia para una atención.
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => selectHistoryType("OUTPATIENT")}
                        className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 text-left text-xs text-slate-700 hover:bg-slate-50"
                      >
                        <div className="font-semibold text-slate-900">Historia clínica de consulta externa</div>
                        <div className="mt-1 text-[11px] text-slate-600">
                          Crea/gestiona historia para consulta externa.
                        </div>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Si el catálogo no está configurado, podrás seleccionar el tipo en el formulario.
                    </p>
                  </div>
                )}

                {newHistoryStep === 2 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-700">2) ¿Cómo deseas continuar?</p>
                    {newHistoryWarning && (
                      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        {newHistoryWarning}
                      </p>
                    )}
                    <div className="grid gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={goScheduleAppointment}
                        className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 text-left text-xs text-slate-700 hover:bg-slate-50"
                      >
                        <div className="font-semibold text-slate-900">Agendar una cita</div>
                        <div className="mt-1 text-[11px] text-slate-600">
                          Redirige a agendamiento.
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={goFillHistoryDirectly}
                        className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 text-left text-xs text-slate-700 hover:bg-slate-50"
                      >
                        <div className="font-semibold text-slate-900">Diligenciar directamente</div>
                        <div className="mt-1 text-[11px] text-slate-600">
                          Abre el formulario de creación de historia.
                        </div>
                      </button>
                    </div>
                    <div className="flex justify-between gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setNewHistoryStep(1)}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Atrás
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewHistoryModal(false)}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
