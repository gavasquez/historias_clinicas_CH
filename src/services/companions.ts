import { apiClient } from "@/lib/api";
import type { Acompanante } from "@/types/companions";

export async function getCompanionsByPatient(idPaciente: string | number) {
  const res = await apiClient.get<Acompanante[]>(`/patients/${idPaciente}/companions`);
  return res.data;
}

export interface CreateCompanionInput {
  nombre: string;
  direccion?: string;
  telefono?: string;
  relacion_con_paciente?: string;
}

export async function createCompanion(
  idPaciente: string | number,
  input: CreateCompanionInput,
) {
  const res = await apiClient.post<Acompanante>(
    `/patients/${idPaciente}/companions`,
    input,
  );
  return res.data;
}

export type UpdateCompanionInput = CreateCompanionInput;

export async function updateCompanion(
  idPaciente: string | number,
  idAcompanante: string | number,
  input: UpdateCompanionInput,
) {
  const res = await apiClient.put<Acompanante>(
    `/patients/${idPaciente}/companions/${idAcompanante}`,
    input,
  );
  return res.data;
}
