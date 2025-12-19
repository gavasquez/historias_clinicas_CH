import { apiClient } from "@/lib/api";
import type {
  ProfessionalAvailability,
  ProfessionalAvailabilityCreateInput,
} from "@/types/professional-availability";

export async function fetchProfessionalAvailability(
  professionalId: number | string,
  filters?: { idSede?: number },
): Promise<ProfessionalAvailability[]> {
  const res = await apiClient.get<ProfessionalAvailability[]>(
    `/professionals/${professionalId}/availability`,
    {
      params: {
        id_sede: filters?.idSede,
      },
    },
  );
  return res.data;
}

export async function createProfessionalAvailability(
  professionalId: number | string,
  input: ProfessionalAvailabilityCreateInput,
): Promise<ProfessionalAvailability> {
  const res = await apiClient.post<ProfessionalAvailability>(
    `/professionals/${professionalId}/availability`,
    input,
  );
  return res.data;
}

export async function deleteProfessionalAvailability(
  professionalId: number | string,
  availabilityId: number | string,
): Promise<void> {
  await apiClient.delete(`/professionals/${professionalId}/availability/${availabilityId}`);
}
