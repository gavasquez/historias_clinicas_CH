import { apiClient } from "@/lib/api";

export interface AttentionDiagnosis {
  id_diagnostico: number;
  id_atencion: number;
  codigo_cie10: string;
  es_principal: boolean;
  id_tipo_confirmacion: number | null;
  cie10_nombre: string | null;
  cie10_descripcion: string | null;
  tipo_confirmacion: string | null;
}

export async function fetchAttentionDiagnoses(idAtencion: number): Promise<AttentionDiagnosis[]> {
  const res = await apiClient.get<{ data: AttentionDiagnosis[] }>(`/attentions/${idAtencion}/diagnoses`);
  return res.data.data;
}

export async function createAttentionDiagnosis(
  idAtencion: number,
  payload: {
    codigo_cie10: string;
    es_principal?: boolean;
    id_tipo_confirmacion?: number | null;
    codigo_confirmacion?: string | null;
  },
): Promise<AttentionDiagnosis> {
  const res = await apiClient.post<AttentionDiagnosis>(`/attentions/${idAtencion}/diagnoses`, payload);
  return res.data;
}

export async function updateAttentionDiagnosis(
  idAtencion: number,
  idDiagnostico: number,
  payload: {
    id_tipo_confirmacion?: number | null;
    codigo_confirmacion?: string | null;
    es_principal?: boolean | null;
  },
): Promise<AttentionDiagnosis> {
  const res = await apiClient.patch<AttentionDiagnosis>(
    `/attentions/${idAtencion}/diagnoses/${idDiagnostico}`,
    payload,
  );
  return res.data;
}

export async function deleteAttentionDiagnosis(
  idAtencion: number,
  idDiagnostico: number,
): Promise<void> {
  await apiClient.delete(`/attentions/${idAtencion}/diagnoses/${idDiagnostico}`);
}

export interface AttentionsReportFilters {
  from?: string;
  to?: string;
  profesional?: string;
  tipo?: string;
  modalidad?: string;
}

export type AttentionsReportRow = {
  id_atencion: number;
  fecha_hora: string;
  id_historia: number;
  id_cita: number | null;
  paciente: string;
  documento: string;
  profesional: string;
  tipo_codigo: string | null;
  tipo: string | null;
  modalidad_codigo: string | null;
  modalidad: string | null;
  sede: string | null;
};

export type AttentionsReportResponse = {
  data: AttentionsReportRow[];
  stats: {
    total: number;
    por_tipo: { tipo: string; total: number }[];
    por_modalidad: { modalidad: string; total: number }[];
  };
};

export async function fetchAttentionsReport(
  filters: AttentionsReportFilters = {},
): Promise<AttentionsReportResponse> {
  const res = await apiClient.get<AttentionsReportResponse>("/reports/attentions", {
    params: {
      from: filters.from || undefined,
      to: filters.to || undefined,
      profesional: filters.profesional || undefined,
      tipo: filters.tipo || undefined,
      modalidad: filters.modalidad || undefined,
    },
  });
  return res.data;
}

export function buildAttentionsReportCsvUrl(filters: AttentionsReportFilters = {}) {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.profesional) params.set("profesional", filters.profesional);
  if (filters.tipo) params.set("tipo", filters.tipo);
  if (filters.modalidad) params.set("modalidad", filters.modalidad);
  params.set("format", "csv");
  return `/api/reports/attentions?${params.toString()}`;
}
