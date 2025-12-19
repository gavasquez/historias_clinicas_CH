export interface ProfessionalAvailability {
  id_disponibilidad: number;
  id_profesional: number;
  id_sede: number | null;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  capacidad_simultanea: number;
  es_excepcion: boolean;
  fecha_inicio_vigencia: string | null;
  fecha_fin_vigencia: string | null;
}

export interface ProfessionalAvailabilityCreateInput {
  id_sede: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  capacidad_simultanea?: number;
  fecha_inicio_vigencia?: string;
  fecha_fin_vigencia?: string;
}
