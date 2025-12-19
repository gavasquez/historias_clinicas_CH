import { apiClient } from "@/lib/api";
import type { ProfessionalAppointmentListItem, AppointmentsResponse } from "@/types/appointments";

export interface AppointmentFilters {
  profesional?: string;
  paciente?: string;
  estado?: string;
  tipoCita?: string;
}

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
  fecha_hora_inicio: string; // ISO string
  fecha_hora_fin: string | null; // ISO string or null
  motivo: string | null;
  canal_recordatorio: string | null;
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
