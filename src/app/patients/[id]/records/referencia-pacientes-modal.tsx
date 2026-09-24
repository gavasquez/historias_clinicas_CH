"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Eye, FileDown, X, ChevronLeft } from "lucide-react";
import { getReportDataUrl, getReportBlob } from "@/lib/reports";
import type { ReportDefinition } from "@/lib/reports";
import type { ReferenciaPacientesMeta, ReferenciaDiagnostico } from "@/lib/reports/referencia-pacientes";
import { fetchHistoryDetail } from "@/services/histories";
import { getCompanionsByPatient } from "@/services/companions";
import { fetchDepartamentos, fetchCiudades, fetchTiposDocumento, type Departamento, type Ciudad, type TipoDocumento } from "@/services/catalogs";
import { apiClient } from "@/lib/api";
import { registerExportedDocument } from "@/services/history-documents";
import { AttentionDiagnosesSection, type DiagnosisDraft } from "@/app/appointments/[id]/attend/components/AttentionDiagnosesSection";
import type { PacienteDetalle } from "@/types/patients";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  patient?: PacienteDetalle;
  historyId: number;
  report: ReportDefinition;
}

function calcularEdad(fecha: string | null | undefined): string {
  if (!fecha) return "";
  const nac = new Date(fecha);
  if (Number.isNaN(nac.getTime())) return "";
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad >= 0 ? String(edad) : "";
}

function formatFecha(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("es-CO", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function parseExamenFisico(contenido?: string | null): {
  signos: ReferenciaPacientesMeta["signosVitales"];
  hallazgos: string;
} {
  const emptySignos = { fc: "", fr: "", temp: "", satO2: "", ta: "", glasgow: "", otros: "" };
  if (!contenido) return { signos: emptySignos, hallazgos: "" };

  let parsed: any;
  try {
    parsed = JSON.parse(contenido);
  } catch {
    return { signos: emptySignos, hallazgos: contenido };
  }

  if (!parsed || typeof parsed !== "object") {
    return { signos: emptySignos, hallazgos: contenido };
  }

  const v = parsed.vitals || {};
  const ta =
    v.ta_sentado ||
    (v.ta_sistolica && v.ta_diastolica ? `${v.ta_sistolica}/${v.ta_diastolica}` : "");

  const signos = {
    fc: v.fc || "",
    fr: v.fr || "",
    temp: v.temp_c || v.temp || "",
    satO2: v.sat_o2 || "",
    ta,
    glasgow: v.glasgow || "",
    otros: v.otros || "",
  };

  const partes: string[] = [];
  if (parsed.observaciones) partes.push(parsed.observaciones);
  if (Array.isArray(parsed.valoracion) && parsed.valoracion.length) {
    partes.push("Valoración por sistemas:");
    parsed.valoracion.forEach((item: any) => {
      const area = [item.area, item.subarea].filter(Boolean).join(" / ");
      partes.push(`- ${area}${item.estado ? ` (${item.estado})` : ""}: ${item.cual || ""}`);
    });
  }

  const hallazgos = partes.join("\n\n").trim();
  return { signos, hallazgos };
}

const TIPO_CONFIRMACION_LABELS: Record<string, string> = {
  CN: "Confirmado Nuevo",
  CR: "Confirmado Repetido",
  ID: "Impresión Diagnóstica",
};

const SEDE_PRESTADOR_OPTIONS = [
  { value: "", label: "Seleccione sede", direccion: "", municipio: "" },
  { value: "neiva-quirinal", label: "Neiva - Quirinal", direccion: "Calle 21 No. 6 – 01", municipio: "Neiva" },
  { value: "neiva-pradoalto", label: "Neiva - Prado Alto", direccion: "Calle 8 No. 32 – 49", municipio: "Neiva" },
  { value: "pitalito", label: "Pitalito", direccion: "Carrera 2 No. 1 – 27", municipio: "Pitalito" },
];

const PRESTADOR_EMISOR_DEFAULT = {
  nombre: "Corporación Universitaria el Huila (Corhuila)",
  nit: "800.107.584-2",
  telefono: "(608) 863 0969 – (608) 875 4220",
  departamento: "Huila",
};

const emptyMeta: ReferenciaPacientesMeta = {
  prestadorEmisor: { ...PRESTADOR_EMISOR_DEFAULT, direccion: "", municipio: "" },
  prestadorReferencia: { nombre: "", nit: "" },
  paciente: { nombreCompleto: "", numeroDocumento: "", tipoDocumento: "", fechaNacimiento: "", edad: "", telefono: "", direccion: "", departamento: "", municipio: "" },
  responsable: { nombreCompleto: "", relacion: "", numeroDocumento: "", tipoDocumento: "", telefono: "", direccion: "", departamento: "", municipio: "" },
  personalRefiere: { nombre: "", servicio: "", telefono: "" },
  informacionClinica: "",
  signosVitales: { fc: "", fr: "", temp: "", satO2: "", ta: "", glasgow: "", otros: "" },
  hallazgosExamenFisico: "",
  diagnosticos: [],
  firmas: { remite: { nombre: "", cargo: "", cedula: "" }, recibe: { nombre: "", cargo: "", cedula: "" } },
};

export function ReferenciaPacientesModal({ isOpen, onClose, patient, historyId, report }: Props) {
  const [activeTab, setActiveTab] = useState<"formulario" | "vista">("formulario");
  const [formData, setFormData] = useState<ReferenciaPacientesMeta>(emptyMeta);
  const [diagnosticosDraft, setDiagnosticosDraft] = useState<DiagnosisDraft[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [departamentosList, setDepartamentosList] = useState<Departamento[]>([]);
  const [ciudadesResponsableList, setCiudadesResponsableList] = useState<Ciudad[]>([]);
  const [idDepartamentoResponsable, setIdDepartamentoResponsable] = useState<number | undefined>(undefined);
  const [idCiudadResponsable, setIdCiudadResponsable] = useState<number | undefined>(undefined);
  const [sedePrestador, setSedePrestador] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["history-detail", historyId],
    queryFn: () => fetchHistoryDetail(String(historyId)),
    enabled: isOpen && !!historyId && historyId > 0,
    staleTime: 0,
  });

  const { data: companions, isLoading: isLoadingCompanions } = useQuery({
    queryKey: ["companions", patient?.id_paciente ?? 0],
    queryFn: () => getCompanionsByPatient(patient!.id_paciente),
    enabled: isOpen && !!patient?.id_paciente,
  });

  const { data: professional, isLoading: isLoadingProfessional } = useQuery({
    queryKey: ["me-professional"],
    queryFn: async () => {
      const res = await apiClient.get("/me/professional");
      return res.data?.data;
    },
    enabled: isOpen,
  });

  const { data: tiposDocumento } = useQuery<TipoDocumento[]>({
    queryKey: ["tipos-documento"],
    queryFn: fetchTiposDocumento,
    enabled: isOpen,
  });

  const history = historyData?.data;
  const attention = history?.atenciones_salud?.[0];

  const hasInitRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(emptyMeta);
      setDiagnosticosDraft([]);
      setPreviewUrl(null);
      setActiveTab("formulario");
      setDepartamentosList([]);
      setCiudadesResponsableList([]);
      setIdDepartamentoResponsable(undefined);
      setIdCiudadResponsable(undefined);
      setSedePrestador("");
      hasInitRef.current = false;
      return;
    }

    if (hasInitRef.current) return;
    if (!patient) return;
    if (isLoadingHistory || isLoadingCompanions || isLoadingProfessional) return;

    (async () => {
      const p = patient as any;
      let departamento = p.departamento || "";
      let municipio = p.ciudad || "";
      const idDepartamento = p.id_departamento || p.ciudades?.id_departamento;
      const idCiudad = p.id_ciudad || p.ciudades?.id_ciudad;

      try {
        const departamentos = await fetchDepartamentos();
        setDepartamentosList(departamentos);
        if (idDepartamento) {
          const ciudades = await fetchCiudades(idDepartamento);
          if (!departamento) {
            departamento = departamentos.find((d) => d.id_departamento === idDepartamento)?.nombre || "";
          }
          if (!municipio) {
            municipio = ciudades.find((c) => c.id_ciudad === idCiudad)?.nombre || "";
          }
        }
      } catch {
        // Fallback: dejar los valores originales del paciente.
      }

      const dxs: ReferenciaDiagnostico[] = (attention?.diagnosticos_atencion || []).map((d: any) => ({
        codigo: d.codigo_cie10 || d.cie10?.codigo || "",
        nombre: d.cie10?.nombre || "",
        tipo:
          d.tipos_confirmacion_diagnostico?.descripcion ||
          TIPO_CONFIRMACION_LABELS[d.tipos_confirmacion_diagnostico?.codigo] ||
          d.tipos_confirmacion_diagnostico?.codigo ||
          "",
        esPrincipal: !!d.es_principal,
      }));

      const examenFisico = parseExamenFisico(attention?.hc_examen_fisico_atencion?.contenido);

      const companion = companions?.[0];

      const newData: ReferenciaPacientesMeta = {
        prestadorEmisor: { ...emptyMeta.prestadorEmisor },
        prestadorReferencia: { ...emptyMeta.prestadorReferencia },
        paciente: {
          nombreCompleto: `${patient.nombres} ${patient.apellidos}`.trim(),
          numeroDocumento: patient.numero_documento,
          tipoDocumento: patient.tipos_documento?.codigo || "",
          fechaNacimiento: formatFecha(p.fecha_nacimiento),
          edad: calcularEdad(p.fecha_nacimiento),
          telefono: patient.telefono || "",
          direccion: patient.direccion || "",
          departamento,
          municipio,
        },
        responsable: {
          nombreCompleto: companion?.nombre || "",
          relacion: companion?.relacion_con_paciente || "",
          numeroDocumento: "",
          tipoDocumento: "",
          telefono: companion?.telefono || "",
          direccion: companion?.direccion || "",
          departamento: "",
          municipio: "",
        },
        personalRefiere: {
          nombre: professional?.usuarios?.nombre_completo || "",
          servicio: professional?.especialidades?.nombre || "",
          telefono: professional?.usuarios?.telefono || "",
        },
        informacionClinica: attention?.hc_anamnesis_atencion?.enfermedad_actual || "",
        signosVitales: examenFisico.signos,
        hallazgosExamenFisico: "",
        diagnosticos: dxs,
        firmas: {
          remite: {
            nombre: professional?.usuarios?.nombre_completo || "",
            cargo: professional?.especialidades?.nombre || "",
            cedula: professional?.registro_medico || "",
          },
          recibe: { ...emptyMeta.firmas.recibe },
        },
      };

      setFormData(newData);
      setDiagnosticosDraft(
        (attention?.diagnosticos_atencion || []).map((d: any) => ({
          codigo_cie10: d.codigo_cie10 || d.cie10?.codigo || "",
          cie10_nombre: d.cie10?.nombre ?? null,
          cie10_descripcion: d.cie10?.descripcion ?? null,
          es_principal: !!d.es_principal,
          codigo_confirmacion: (d.tipos_confirmacion_diagnostico?.codigo as "CN" | "CR" | "ID" | null) || null,
        })) as DiagnosisDraft[],
      );
      hasInitRef.current = true;
    })();
  }, [isOpen, patient, isLoadingHistory, isLoadingCompanions, isLoadingProfessional, historyData, companions, professional]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      diagnosticos: diagnosticosDraft.map((d) => ({
        codigo: d.codigo_cie10,
        nombre: d.cie10_nombre || "",
        tipo: TIPO_CONFIRMACION_LABELS[d.codigo_confirmacion ?? ""] || d.codigo_confirmacion || "",
        esPrincipal: d.es_principal,
      })),
    }));
  }, [diagnosticosDraft]);

  useEffect(() => {
    if (!idDepartamentoResponsable) {
      setCiudadesResponsableList([]);
      return;
    }
    fetchCiudades(idDepartamentoResponsable)
      .then((ciudades) => setCiudadesResponsableList(ciudades))
      .catch(() => setCiudadesResponsableList([]));
  }, [idDepartamentoResponsable]);

  const reportData = useMemo(
    () => ({
      patient: patient
        ? {
            nombres: patient.nombres,
            apellidos: patient.apellidos,
            numero_documento: patient.numero_documento,
            tipos_documento: patient.tipos_documento,
            programas_academicos: patient.programas_academicos,
          }
        : undefined,
      history,
      attention,
      issuedBy: {
        nombre_completo: professional?.usuarios?.nombre_completo || "",
        registro_medico: professional?.registro_medico || null,
        firma_digital: professional?.firma_digital || null,
      },
      meta: formData,
    }),
    [patient, history, attention, professional, formData],
  );

  const generatePreview = async () => {
    setPreviewLoading(true);
    try {
      const url = await getReportDataUrl(report, reportData);
      setPreviewUrl(url);
    } catch (e) {
      setError("No se pudo generar la vista previa");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloadLoading(true);
    try {
      const filename = `${report.id}_${historyId}.pdf`;
      const blob = await getReportBlob(report, reportData);

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      await registerExportedDocument(String(patientId), historyId, {
        tipo_documento: "referencia-pacientes",
        id_atencion: reportData.attention?.id_atencion ?? null,
        nombre_archivo: filename,
        file: new File([blob], filename, { type: "application/pdf" }),
      });
      await queryClient.invalidateQueries({
        queryKey: ["history-exported-documents", String(patientId), historyId],
      });
    } catch (e) {
      setError("No se pudo generar el PDF");
    } finally {
      setDownloadLoading(false);
    }
  };

  const isFormValid = useMemo(() => {
    const pe = formData.prestadorEmisor;
    const pr = formData.prestadorReferencia;
    const p = formData.paciente;
    const r = formData.responsable;
    const pf = formData.personalRefiere;
    const sv = formData.signosVitales;
    const f = formData.firmas;

    return (
      pe.direccion.trim() !== "" &&
      pe.municipio.trim() !== "" &&
      pr.nombre.trim() !== "" &&
      pr.nit.trim() !== "" &&
      p.nombreCompleto.trim() !== "" &&
      p.numeroDocumento.trim() !== "" &&
      p.tipoDocumento.trim() !== "" &&
      p.fechaNacimiento.trim() !== "" &&
      p.edad.trim() !== "" &&
      p.telefono.trim() !== "" &&
      p.direccion.trim() !== "" &&
      p.departamento.trim() !== "" &&
      p.municipio.trim() !== "" &&
      r.nombreCompleto.trim() !== "" &&
      r.relacion.trim() !== "" &&
      r.numeroDocumento.trim() !== "" &&
      r.tipoDocumento.trim() !== "" &&
      r.telefono.trim() !== "" &&
      r.direccion.trim() !== "" &&
      r.departamento.trim() !== "" &&
      r.municipio.trim() !== "" &&
      pf.nombre.trim() !== "" &&
      pf.servicio.trim() !== "" &&
      pf.telefono.trim() !== "" &&
      formData.informacionClinica.trim() !== "" &&
      sv.fc.trim() !== "" &&
      sv.fr.trim() !== "" &&
      sv.temp.trim() !== "" &&
      sv.satO2.trim() !== "" &&
      sv.ta.trim() !== "" &&
      sv.glasgow.trim() !== "" &&
      formData.hallazgosExamenFisico.trim() !== "" &&
      formData.diagnosticos.length > 0 &&
      f.remite.nombre.trim() !== "" &&
      f.remite.cargo.trim() !== "" &&
      f.remite.cedula.trim() !== "" &&
      f.recibe.nombre.trim() !== "" &&
      f.recibe.cargo.trim() !== "" &&
      f.recibe.cedula.trim() !== ""
    );
  }, [formData]);

  const handlePreview = async () => {
    if (!isFormValid) {
      setError("Todos los campos son obligatorios para generar la vista previa.");
      return;
    }
    setError(null);
    setActiveTab("vista");
    await generatePreview();
  };

  const updateSection = <K extends keyof ReferenciaPacientesMeta>(
    section: K,
    value: Partial<ReferenciaPacientesMeta[K]>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as any), ...value },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Referencia de Pacientes</h2>
              <p className="text-xs text-slate-600">Complete y revise la información antes de generar el PDF</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white p-1 text-slate-700 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 p-2">
          <button
            onClick={() => setActiveTab("formulario")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${activeTab === "formulario" ? "bg-sky-600 text-white" : "bg-white text-slate-700 hover:bg-slate-100"}`}
          >
            Formulario
          </button>
          <button
            onClick={handlePreview}
            disabled={!isFormValid}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${activeTab === "vista" ? "bg-sky-600 text-white" : "bg-white text-slate-700 hover:bg-slate-100"} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            Vista previa
          </button>
        </div>

        {activeTab === "formulario" ? (
          <div className="flex-1 overflow-auto p-4">
            {isLoadingHistory && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando historia clínica...
              </div>
            )}

            {error && <p className="rounded bg-red-50 p-2 text-xs text-red-700">{error}</p>}
            {success && <p className="rounded bg-green-50 p-2 text-xs text-green-700">{success}</p>}

            <div className="space-y-6">
              <Section title="1. Información del prestador o entidad emisora">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Nombre" value={formData.prestadorEmisor.nombre} onChange={() => {}} disabled />
                  <Input label="NIT" value={formData.prestadorEmisor.nit} onChange={() => {}} disabled />
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-700">Sede</label>
                    <select
                      value={sedePrestador}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSedePrestador(value);
                        const option = SEDE_PRESTADOR_OPTIONS.find((o) => o.value === value);
                        setFormData((prev) => ({
                          ...prev,
                          prestadorEmisor: {
                            ...prev.prestadorEmisor,
                            direccion: option?.direccion || "",
                            municipio: option?.municipio || "",
                          },
                        }));
                      }}
                      className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800"
                    >
                      {SEDE_PRESTADOR_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input label="Dirección" value={formData.prestadorEmisor.direccion} onChange={() => {}} disabled />
                  <Input label="Teléfono" value={formData.prestadorEmisor.telefono} onChange={() => {}} disabled />
                  <Input label="Departamento" value={formData.prestadorEmisor.departamento} onChange={() => {}} disabled />
                  <Input label="Municipio" value={formData.prestadorEmisor.municipio} onChange={() => {}} disabled />
                </div>
              </Section>

              <Section title="2. Información del prestador de referencia">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Nombre" value={formData.prestadorReferencia.nombre} onChange={(v) => updateSection("prestadorReferencia", { nombre: v })} />
                  <Input label="NIT" value={formData.prestadorReferencia.nit} onChange={(v) => updateSection("prestadorReferencia", { nit: v })} />
                </div>
              </Section>

              <Section title="3. Datos del paciente">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Nombre completo" value={formData.paciente.nombreCompleto} onChange={() => {}} disabled />
                  <Input label="Número de documento" value={formData.paciente.numeroDocumento} onChange={() => {}} disabled />
                  <Input label="Tipo de documento" value={formData.paciente.tipoDocumento} onChange={() => {}} disabled />
                  <Input label="Fecha de nacimiento" value={formData.paciente.fechaNacimiento} onChange={() => {}} disabled />
                  <Input label="Edad" value={formData.paciente.edad} onChange={() => {}} disabled />
                  <Input label="Teléfono" value={formData.paciente.telefono} onChange={() => {}} disabled />
                  <Input label="Dirección" value={formData.paciente.direccion} onChange={() => {}} disabled />
                  <Input label="Departamento" value={formData.paciente.departamento} onChange={() => {}} disabled />
                  <Input label="Municipio" value={formData.paciente.municipio} onChange={() => {}} disabled />
                </div>
              </Section>

              <Section title="4. Datos de la persona responsable del paciente">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Nombre completo" value={formData.responsable.nombreCompleto} onChange={(v) => updateSection("responsable", { nombreCompleto: v })} placeholder="Nombre del contacto" />
                  <Input label="Relación con el paciente" value={formData.responsable.relacion} onChange={(v) => updateSection("responsable", { relacion: v })} placeholder="Ej: Madre, Padre, Tutor" />
                  <Input label="Número de documento" value={formData.responsable.numeroDocumento} onChange={(v) => updateSection("responsable", { numeroDocumento: v })} />
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-700">Tipo de documento</label>
                    <select
                      value={formData.responsable.tipoDocumento}
                      onChange={(e) => updateSection("responsable", { tipoDocumento: e.target.value })}
                      className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800"
                    >
                      <option value="">Seleccione un tipo de documento</option>
                      {(tiposDocumento ?? []).map((tipo) => (
                        <option key={tipo.id_tipo_documento} value={tipo.descripcion}>
                          {tipo.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input label="Teléfono" value={formData.responsable.telefono} onChange={(v) => updateSection("responsable", { telefono: v })} placeholder="Teléfono del contacto" />
                  <Input label="Dirección actual" value={formData.responsable.direccion} onChange={(v) => updateSection("responsable", { direccion: v })} placeholder="Dirección del contacto" />

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-700">Departamento</label>
                    <select
                      value={idDepartamentoResponsable ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : Number(e.target.value);
                        const selected = departamentosList.find((d) => d.id_departamento === value);
                        setIdDepartamentoResponsable(value);
                        setIdCiudadResponsable(undefined);
                        setFormData((prev) => ({
                          ...prev,
                          responsable: {
                            ...prev.responsable,
                            departamento: selected?.nombre || "",
                            municipio: "",
                          },
                        }));
                      }}
                      className="rounded-md border border-slate-300 p-1.5 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                    >
                      <option value="">Seleccione departamento</option>
                      {departamentosList.map((d) => (
                        <option key={d.id_departamento} value={d.id_departamento}>
                          {d.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-700">Municipio</label>
                    <select
                      value={idCiudadResponsable ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : Number(e.target.value);
                        const selected = ciudadesResponsableList.find((c) => c.id_ciudad === value);
                        setIdCiudadResponsable(value);
                        if (selected) {
                          setFormData((prev) => ({
                            ...prev,
                            responsable: {
                              ...prev.responsable,
                              municipio: selected.nombre,
                            },
                          }));
                        }
                      }}
                      disabled={!idDepartamentoResponsable || ciudadesResponsableList.length === 0}
                      className="rounded-md border border-slate-300 p-1.5 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="">
                        {idDepartamentoResponsable
                          ? "Seleccione municipio"
                          : "Seleccione primero el departamento"}
                      </option>
                      {ciudadesResponsableList.map((c) => (
                        <option key={c.id_ciudad} value={c.id_ciudad}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Section>

              <Section title="5. Personal que refiere">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Nombre" value={formData.personalRefiere.nombre} onChange={() => {}} disabled />
                  <Input label="Servicio" value={formData.personalRefiere.servicio} onChange={() => {}} disabled />
                  <Input label="Teléfono" value={formData.personalRefiere.telefono} onChange={() => {}} disabled />
                </div>
              </Section>

              <Section title="6. Información clínica relevante">
                <textarea
                  value={formData.informacionClinica}
                  onChange={(e) => setFormData((prev) => ({ ...prev, informacionClinica: e.target.value }))}
                  placeholder="Describa la información clínica relevante para la referencia..."
                  rows={4}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs"
                />
              </Section>

              <Section title="6.1 Signos vitales">
                <div className="grid gap-3 md:grid-cols-4">
                  <Input label="FC" value={formData.signosVitales.fc} onChange={(v) => updateSection("signosVitales", { fc: v })} placeholder="Ej: 72" />
                  <Input label="FR" value={formData.signosVitales.fr} onChange={(v) => updateSection("signosVitales", { fr: v })} placeholder="Ej: 16" />
                  <Input label="TEMP" value={formData.signosVitales.temp} onChange={(v) => updateSection("signosVitales", { temp: v })} placeholder="Ej: 36.5" />
                  <Input label="SAT O2" value={formData.signosVitales.satO2} onChange={(v) => updateSection("signosVitales", { satO2: v })} placeholder="Ej: 98" />
                  <Input label="TA" value={formData.signosVitales.ta} onChange={(v) => updateSection("signosVitales", { ta: v })} placeholder="Ej: 118/76" />
                  <Input label="Glasgow" value={formData.signosVitales.glasgow} onChange={(v) => updateSection("signosVitales", { glasgow: v })} placeholder="Ej: 15" />
                  <Input label="Otros" value={formData.signosVitales.otros} onChange={(v) => updateSection("signosVitales", { otros: v })} placeholder="Otros signos vitales" />
                </div>
              </Section>

              <Section title="6.2 Hallazgos del examen físico">
                <textarea
                  value={formData.hallazgosExamenFisico}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hallazgosExamenFisico: e.target.value }))}
                  placeholder="Describa los hallazgos del examen físico..."
                  rows={4}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs"
                />
              </Section>

              <Section title="7. Diagnósticos CIE-10">
                <AttentionDiagnosesSection
                  diagnosticosDraft={diagnosticosDraft}
                  setDiagnosticosDraft={setDiagnosticosDraft as any}
                  setError={setError}
                  setSuccessMessage={setSuccess}
                />
              </Section>

              <Section title="8. Firmas">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-700">Personal que remite</p>
                    {professional?.firma_digital ? (
                      <img
                        src={professional.firma_digital}
                        alt="Firma del personal que remite"
                        className="h-20 w-auto rounded border border-slate-200 bg-white object-contain"
                      />
                    ) : (
                      <div className="flex h-20 items-end justify-center rounded border border-dashed border-slate-300 bg-slate-50 p-2 text-[10px] text-slate-500">
                        Sin firma registrada
                      </div>
                    )}
                    <Input label="Nombre" value={formData.firmas.remite.nombre} onChange={() => {}} disabled />
                    <Input label="Cargo" value={formData.firmas.remite.cargo} onChange={() => {}} disabled />
                    <Input label="Cédula / Registro Profesional" value={formData.firmas.remite.cedula} onChange={() => {}} disabled />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-700">Personal que recibe</p>
                    <Input label="Nombre" value={formData.firmas.recibe.nombre} onChange={(v) => updateSection("firmas", { recibe: { ...formData.firmas.recibe, nombre: v } })} />
                    <Input label="Cargo" value={formData.firmas.recibe.cargo} onChange={(v) => updateSection("firmas", { recibe: { ...formData.firmas.recibe, cargo: v } })} />
                    <Input label="Cédula / Registro Profesional" value={formData.firmas.recibe.cedula} onChange={(v) => updateSection("firmas", { recibe: { ...formData.firmas.recibe, cedula: v } })} />
                  </div>
                </div>
              </Section>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col p-0">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 p-2">
              <button onClick={() => setActiveTab("formulario")} className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100">
                <ChevronLeft className="h-3 w-3" />
                Volver al formulario
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-2">
              {previewLoading ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-600">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="mt-2 text-xs">Generando vista previa...</p>
                </div>
              ) : previewUrl ? (
                <iframe src={previewUrl} className="h-full w-full rounded border border-slate-300 bg-white" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">No hay vista previa disponible</div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4">
          <button onClick={onClose} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Cerrar</button>
          {activeTab === "formulario" ? (
            <button
              onClick={handlePreview}
              disabled={!isFormValid}
              className="flex items-center gap-1 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Eye className="h-4 w-4" />
              Vista previa
            </button>
          ) : (
            <button
              onClick={handleDownload}
              disabled={downloadLoading}
              className="flex items-center gap-1 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {downloadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {downloadLoading ? "Generando..." : "Generar PDF"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold uppercase text-sky-700">{title}</h3>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, disabled, placeholder }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; placeholder?: string }) {
  const placeholderText = disabled ? undefined : (placeholder ?? `Ingrese ${label.toLowerCase()}`);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-slate-700">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholderText}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`rounded-md border border-slate-300 p-1.5 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 ${disabled ? "bg-slate-100 text-slate-600" : ""}`}
      />
    </div>
  );
}
