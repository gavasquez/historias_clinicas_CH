export interface ProfessionalAppointmentListItem {
  id_cita: number;
  fecha_hora_inicio: string; // ISO string
  fecha_hora_fin: string | null; // ISO string or null
  tipo_cita: string | null;
  estado_cita: string | null;
  tipo_historia: string | null;
  paciente_nombre: string;
  paciente_documento: string;
}

export interface AppointmentListItem extends ProfessionalAppointmentListItem {
  profesional_nombre: string;
  sede: string | null;
}

export interface AppointmentsResponse {
  data: AppointmentListItem[];
  total: number;
  page: number;
  pageSize: number;
}
