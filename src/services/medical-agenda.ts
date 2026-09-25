import { apiClient } from "@/lib/api";
import { downloadReport } from "@/lib/reports";
import { medicalAgendaReport } from "@/lib/reports/medical-agenda";

export interface MedicalAgendaFilters {
  medico?: number;
  sede?: number;
  from?: string;
  to?: string;
  dia?: number;
}

export interface MedicalAgendaRow {
  id_cita: number;
  fecha: string;
  dia_semana: number;
  dia_nombre: string;
  hora: string;
  hora_fin: string | null;
  profesional: string;
  sede: string | null;
  paciente: string;
  documento: string;
  estado: string | null;
  tipo: string | null;
  quien_agenda: string | null;
  fecha_hora_inicio: string;
}

export interface MedicalAgendaStats {
  total: number;
  por_medico: { medico: string; total: number }[];
  por_sede: { sede: string; total: number }[];
  por_estado: { estado: string; total: number }[];
}

export interface MedicalAgendaResponse {
  data: MedicalAgendaRow[];
  stats: MedicalAgendaStats;
}

export interface MedicalAgendaMedic {
  id_profesional: number;
  nombre_completo: string;
  sede: string | null;
}

export async function fetchMedicalAgendaReport(
  filters: MedicalAgendaFilters = {},
): Promise<MedicalAgendaResponse> {
  const res = await apiClient.get<MedicalAgendaResponse>("/reports/medical-agenda", {
    params: {
      medico: filters.medico,
      sede: filters.sede,
      from: filters.from,
      to: filters.to,
      dia: filters.dia,
    },
  });
  return res.data;
}

export async function fetchMedicalAgendaMedics(): Promise<MedicalAgendaMedic[]> {
  const res = await apiClient.get<MedicalAgendaMedic[]>(
    "/reports/medical-agenda/medics",
  );
  return res.data;
}

export function buildMedicalAgendaXlsxUrl(filters: MedicalAgendaFilters = {}) {
  const params = new URLSearchParams();
  if (filters.medico) params.set("medico", String(filters.medico));
  if (filters.sede) params.set("sede", String(filters.sede));
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.dia) params.set("dia", String(filters.dia));
  params.set("format", "xlsx");
  return `/api/reports/medical-agenda?${params.toString()}`;
}

export interface MedicalAgendaPdfLabels {
  medico: string;
  sede: string;
  fecha: string;
  dia: string;
}

export async function downloadMedicalAgendaPdf(
  rows: MedicalAgendaRow[],
  labels: MedicalAgendaPdfLabels,
) {
  return downloadReport(
    medicalAgendaReport,
    {
      meta: {
        rows,
        labels,
      },
    },
    "agenda_medica.pdf",
  );
}
