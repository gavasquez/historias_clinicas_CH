import { useQuery } from "@tanstack/react-query";
import { fetchPatients } from "@/services/patients";
import { fetchProfessionals } from "@/services/professionals";
import {
  fetchSedes,
  fetchTiposCita,
  fetchEstadosCita,
  type Sede,
  type TipoCita,
  type EstadoCita,
} from "@/services/catalogs";
import type { PatientsResponse } from "@/types/patients";
import type { ProfessionalsResponse } from "@/types/professionals";

export function useAppointmentFormCatalogs() {
  const { data: patientsData, isLoading: loadingPatients } = useQuery<PatientsResponse>({
    queryKey: ["patients-select"],
    queryFn: () => fetchPatients(1),
  });

  const { data: professionalsData, isLoading: loadingProfessionals } =
    useQuery<ProfessionalsResponse>({
      queryKey: ["professionals-select"],
      queryFn: () => fetchProfessionals(1),
    });

  const { data: sedesData, isLoading: loadingSedes } = useQuery<Sede[]>({
    queryKey: ["sedes-select"],
    queryFn: fetchSedes,
  });

  const { data: tiposCitaData, isLoading: loadingTiposCita } = useQuery<TipoCita[]>({
    queryKey: ["tipos-cita-select"],
    queryFn: fetchTiposCita,
  });

  const { data: estadosCitaData, isLoading: loadingEstadosCita } = useQuery<EstadoCita[]>({
    queryKey: ["estados-cita-select"],
    queryFn: fetchEstadosCita,
  });

  return {
    patientsData,
    professionalsData,
    sedesData,
    tiposCitaData,
    estadosCitaData,
    loadingPatients,
    loadingProfessionals,
    loadingSedes,
    loadingTiposCita,
    loadingEstadosCita,
  };
}
