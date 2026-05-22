import { apiClient } from "@/lib/api";
import type { ProfessionalAppointmentListItem, AppointmentsResponse } from "@/types/appointments";

export interface AppointmentFilters {
  profesional?: string;
  paciente?: string;
  estado?: string;
  tipoCita?: string;
  fecha?: string;
  id_sede?: number;
}

export interface AppointmentReportFilters {
  from?: string;
  to?: string;
  profesional?: string;
  estado?: string;
  tipo?: string;
}

export type AppointmentReportRow = {
  id_cita: number;
  fecha_hora_inicio: string;
  fecha_hora_fin: string | null;
  paciente: string;
  documento: string;
  profesional: string;
  sede: string | null;
  estado_codigo: string | null;
  estado: string | null;
  tipo_codigo: string | null;
  tipo: string | null;
};

export type AppointmentReportResponse = {
  data: AppointmentReportRow[];
  stats: {
    total: number;
    resumen_codigos?: {
      PROGRAMADA: number;
      REALIZADA: number;
      CANCELADA_INST: number;
      CANCELADA_PAC: number;
      NO_ASISTE: number;
    };
    por_estado: { estado: string; total: number }[];
  };
};

export async function fetchAppointmentsByProfessional(
  idProfesional: number | string,
  options: { date?: string } = {},
): Promise<ProfessionalAppointmentListItem[]> {
  const res = await apiClient.get<ProfessionalAppointmentListItem[]>(
    `/professionals/${idProfesional}/appointments`,
    {
      params: {
        date: options.date || undefined,
      },
    },
  );
  return res.data;
}

export async function fetchAppointments(
  page: number,
  filters: AppointmentFilters = {},
): Promise<AppointmentsResponse> {
  const res = await apiClient.get<AppointmentsResponse>("/appointments", {
    params: {
      page,
      profesional: filters.profesional || undefined,
      paciente: filters.paciente || undefined,
      estado: filters.estado || undefined,
      tipoCita: filters.tipoCita || undefined,
      fecha: filters.fecha || undefined,
      id_sede: typeof filters.id_sede === "number" ? filters.id_sede : undefined,
    },
  });
  return res.data;
}

export interface AppointmentDetail {
  id_cita: number;
  id_paciente: number;
  id_profesional: number;
  id_sede: number | null;
  id_tipo_cita: number | null;
  id_estado_cita: number | null;
  id_modalidad_atencion: number | null;
  id_programa_salud: number | null;
  id_tipo_historia: number | null;
  fecha_hora_inicio: string; // ISO string
  fecha_hora_fin: string | null; // ISO string or null
  seguimiento: boolean;
  tipo_seguimiento: string | null;
  canal_recordatorio: string | null;
  ultima_atencion: {
    id_atencion: number;
    id_historia: number;
    id_tipo_atencion: number;
    descripcion_tipo_atencion: string | null;
    id_modalidad_atencion: number | null;
    descripcion_modalidad_atencion: string | null;
  } | null;
}

export async function getAppointmentById(id: string): Promise<AppointmentDetail> {
  const res = await apiClient.get<AppointmentDetail>(`/appointments/${id}`);
  return res.data;
}

export async function updateAppointment(
  id: string,
  input: Partial<AppointmentDetail> & {
    id_paciente: number;
    id_profesional: number;
    fecha_hora_inicio: string;
  },
) {
  const res = await apiClient.put(`/appointments/${id}`, input);
  return res.data;
}

export async function cancelAppointment(id: number, codigoEstado?: string) {
  const res = await apiClient.post(`/appointments/${id}/cancel`, {
    codigo_estado: codigoEstado,
  });
  return res.data;
}

export async function fetchAppointmentReport(
  filters: AppointmentReportFilters = {},
): Promise<AppointmentReportResponse> {
  const res = await apiClient.get<AppointmentReportResponse>("/reports/appointments", {
    params: {
      from: filters.from || undefined,
      to: filters.to || undefined,
      profesional: filters.profesional || undefined,
      estado: filters.estado || undefined,
      tipo: filters.tipo || undefined,
    },
  });
  return res.data;
}

export function buildAppointmentReportCsvUrl(filters: AppointmentReportFilters = {}) {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.profesional) params.set("profesional", filters.profesional);
  if (filters.estado) params.set("estado", filters.estado);
  if (filters.tipo) params.set("tipo", filters.tipo);
  params.set("format", "csv");
  return `/api/reports/appointments?${params.toString()}`;
}
