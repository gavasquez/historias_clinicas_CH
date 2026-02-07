import { apiClient } from "@/lib/api";
import axios from "axios";
import type { PatientsResponse, PacienteDetalle } from "@/types/patients";
import type { PatientAppointmentsResponse } from "@/types/patient-appointments";

export interface PatientFilters {
  documento?: string;
  nombre?: string;
  tipoUsuario?: string;
  programa?: string;
}

export interface PatientCreateInput {
  id_tipo_documento: number;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string; // ISO date (yyyy-mm-dd)
  telefono: string;
  email?: string;
  id_ciudad?: number;
  departamento?: string;
  ciudad?: string;
  id_genero?: number;
  id_estado_civil?: number;
  direccion?: string;
  id_tipo_sangre?: number;
  id_sede?: number;
  id_programa_academico?: number;
  id_eps?: number;
  condicion_particular?: string;
  id_tipo_usuario?: number;

  contacto_emergencia_nombre?: string;
  contacto_emergencia_relacion?: string;
  contacto_emergencia_telefono?: string;
  contacto_emergencia_direccion?: string;
}

export async function fetchPatients(
  page: number,
  filters: PatientFilters = {},
): Promise<PatientsResponse> {
  const res = await apiClient.get<PatientsResponse>("/patients", {
    params: {
      page,
      documento: filters.documento || undefined,
      nombre: filters.nombre || undefined,
      tipoUsuario: filters.tipoUsuario || undefined,
      programa: filters.programa || undefined,
    },
  });
  return res.data;
}

export async function createPatient(input: PatientCreateInput) {
  const res = await apiClient.post("/patients", input);
  return res.data;
}

export async function getPatientById(id: string) {
  const res = await apiClient.get(`/patients/${id}`);
  return res.data;
}

export async function updatePatient(id: string, input: PatientCreateInput) {
  const res = await apiClient.put(`/patients/${id}`, input);
  return res.data;
}

export async function togglePatientActive(id: string, activo: boolean) {
  const res = await apiClient.put(`/patients/${id}`, { activo });
  return res.data;
}

export async function getPatientDetailById(
  id: string,
): Promise<PacienteDetalle | null> {
  try {
    const res = await apiClient.get<PacienteDetalle>(`/patients/${id}`);
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export interface PatientAppointmentsFilters {
  desde?: string;
  hasta?: string;
  id_estado_cita?: number;
  id_sede?: number;
  profesional?: string;
}

export async function fetchPatientAppointments(
  patientId: string,
  params: { page: number; filters?: PatientAppointmentsFilters },
): Promise<PatientAppointmentsResponse> {
  const res = await apiClient.get<PatientAppointmentsResponse>(`/patients/${patientId}/appointments`, {
    params: {
      page: params.page,
      desde: params.filters?.desde || undefined,
      hasta: params.filters?.hasta || undefined,
      id_estado_cita:
        params.filters?.id_estado_cita && params.filters.id_estado_cita > 0
          ? params.filters.id_estado_cita
          : undefined,
      id_sede:
        params.filters?.id_sede && params.filters.id_sede > 0 ? params.filters.id_sede : undefined,
      profesional: params.filters?.profesional?.trim() || undefined,
    },
  });

  return res.data;
}
