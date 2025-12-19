export interface PatientAppointmentListItem {
  id_cita: number;
  fecha_hora_inicio: string;
  fecha_hora_fin: string | null;
  tipo_cita: string | null;
  estado_cita: string | null;
  profesional_nombre: string | null;
  sede: string | null;
}

export interface PatientAppointmentsResponse {
  data: PatientAppointmentListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
