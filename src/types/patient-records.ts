export interface PatientClinicalRecordListItem {
  id_historia: number;
  fecha_apertura: string; // ISO string
  estado: string | null;
  tipo_historia: string;
  profesional_responsable: string | null;
  motivo_consulta: string | null;
  attention_count: number;
  last_attention_fecha_hora: string | null;
  last_attention_tipo: string | null;
  last_attention_modalidad: string | null;
  last_attention_principal_cie10_codigo: string | null;
  last_attention_principal_cie10_nombre: string | null;
}

export interface PatientClinicalRecordsResponse {
  data: PatientClinicalRecordListItem[];
}
