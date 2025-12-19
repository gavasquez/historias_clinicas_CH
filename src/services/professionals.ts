import { apiClient } from "@/lib/api";
import axios from "axios";
import type { ProfessionalsResponse, ProfessionalDetail } from "@/types/professionals";

export interface ProfessionalFilters {
  nombre?: string;
  especialidad?: string;
  sede?: string;
}

export interface ProfessionalCreateInput {
  id_usuario: number;
  id_sede?: number;
  id_especialidad?: number;
  registro_medico?: string;
  telefono_contacto?: string;
  activo?: boolean;
}

export async function fetchProfessionals(
  page: number,
  filters: ProfessionalFilters = {},
): Promise<ProfessionalsResponse> {
  const res = await apiClient.get<ProfessionalsResponse>("/professionals", {
    params: {
      page,
      nombre: filters.nombre || undefined,
      especialidad: filters.especialidad || undefined,
      sede: filters.sede || undefined,
    },
  });
  return res.data;
}

export async function getProfessionalById(
  id: number | string,
): Promise<ProfessionalDetail | null> {
  try {
    const res = await apiClient.get<ProfessionalDetail>(`/professionals/${id}`);
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createProfessional(input: ProfessionalCreateInput) {
  const res = await apiClient.post("/professionals", input);
  return res.data;
}
