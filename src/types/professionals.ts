export interface ProfesionalSaludListItem {
  id_profesional: number;
  nombre_completo: string;
  email: string | null;
  especialidad: string | null;
  sede: string | null;
  registro_medico: string | null;
  firma_digital: string | null;
  activo: boolean;
}

export interface ProfessionalsResponse {
  data: ProfesionalSaludListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProfessionalDetail {
  id_profesional: number;
  nombre_completo: string;
  email: string | null;
  activo: boolean;
  registro_medico: string | null;
  firma_digital: string | null;
  especialidad: {
    nombre: string;
    descripcion: string | null;
  } | null;
  sede: {
    nombre: string;
    ciudad: string | null;
    departamento: string | null;
  } | null;
}
