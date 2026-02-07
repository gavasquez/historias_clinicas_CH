export interface Paciente {
  id_paciente: number;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  activo?: boolean;
  tipos_documento: { codigo: string } | null;
  tipos_usuario: { descripcion: string } | null;
  programas_academicos: { nombre: string } | null;
  sedes: { nombre: string } | null;
}

export interface PatientsResponse {
  data: Paciente[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PacienteDetalleApi {
  id_paciente: number;
  id_tipo_documento: number;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  telefono: string | null;
  email: string | null;
  departamento: string | null;
  ciudad: string | null;
  id_ciudad: number | null;
  direccion: string | null;
  condicion_particular: string | null;
  id_genero: number | null;
  id_estado_civil: number | null;
  id_tipo_sangre: number | null;
  id_sede: number | null;
  id_programa_academico: number | null;
  id_eps: number | null;
  id_tipo_usuario: number | null;
}

export interface PacienteDetalle {
  id_paciente: number;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  activo?: boolean;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  condicion_particular: string | null;
  tipos_documento: { codigo: string; descripcion?: string } | null;
  tipos_usuario: { descripcion: string } | null;
  programas_academicos: { nombre: string } | null;
  sedes: { nombre: string } | null;
  generos: { descripcion: string } | null;
  estados_civiles: { descripcion: string } | null;
  tipos_sangre: { descripcion: string } | null;
  eps: { nombre: string } | null;
}
