export interface AppointmentFormState {
  id_paciente: string;
  id_profesional: string;
  id_sede: string;
  id_tipo_cita: string;
  id_estado_cita: string;
  id_modalidad_atencion: string;
  id_programa_salud: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  seguimiento: "SI" | "NO";
  tipo_seguimiento: "CRONICAS" | "SALUD" | "";
  canal_recordatorio: string;
}

export type SelectOption = {
  value: number;
  label: string;
};
