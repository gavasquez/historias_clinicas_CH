export interface PatientClinicalRecordListItem {
  id_historia: number;
  id_historia_vinculada?: number | null;
  linked_history_summary?: {
    id_historia: number;
    missing?: boolean;
    fecha_apertura?: string;
    estado?: string | null;
    tipo_historia?: string | null;
    tipo_historia_codigo?: string | null;
    profesional_responsable?: string | null;
    last_attention_fecha_hora?: string | null;
    last_attention_tipo?: string | null;
    last_attention_modalidad?: string | null;
  } | null;
  fecha_apertura: string; // ISO string
  estado: string | null;
  tipo_historia: string;
  profesional_responsable: string | null;
  profesional_registro: string | null;
  motivo_consulta: string | null;
  attention_count: number;
  last_attention_fecha_hora: string | null;
  last_attention_tipo: string | null;
  last_attention_modalidad: string | null;
  last_attention_sede: string | null;
  last_attention_seguimiento: boolean | null;
  last_attention_principal_cie10_codigo: string | null;
  last_attention_principal_cie10_nombre: string | null;
}

export interface PatientClinicalRecordsResponse {
  data: PatientClinicalRecordListItem[];
}
