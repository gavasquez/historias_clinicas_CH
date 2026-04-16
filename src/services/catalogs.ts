import { apiClient } from "@/lib/api";

export interface TipoDocumento {
  id_tipo_documento: number;
  codigo: string;
  descripcion: string;
}

export interface Genero {
  id_genero: number;
  codigo: string;
  descripcion: string;
}

export interface EstadoCivil {
  id_estado_civil: number;
  codigo: string;
  descripcion: string;
}

export interface TipoSangre {
  id_tipo_sangre: number;
  codigo: string;
  descripcion: string;
}

export interface Sede {
  id_sede: number;
  nombre: string;
}

export interface Especialidad {
  id_especialidad: number;
  nombre: string;
}

export interface ProgramaAcademico {
  id_programa_academico: number;
  nombre: string;
}

export interface Eps {
  id_eps: number;
  nombre: string;
}

export interface TipoUsuario {
  id_tipo_usuario: number;
  codigo: string;
  descripcion: string;
}

export interface Departamento {
  id_departamento: number;
  nombre: string;
  codigo_dane: string | null;
}

export interface Ciudad {
  id_ciudad: number;
  id_departamento: number;
  nombre: string;
  codigo_dane: string | null;
}

export interface TipoCita {
  id_tipo_cita: number;
  codigo: string;
  descripcion: string;
}

export interface EstadoCita {
  id_estado_cita: number;
  codigo: string;
  descripcion: string;
}

export interface TipoHistoriaClinica {
  id_tipo_historia: number;
  codigo: string;
  descripcion: string;
}

export interface TipoAtencion {
  id_tipo_atencion: number;
  codigo: string;
  descripcion: string;
}

export interface ModalidadAtencion {
  id_modalidad_atencion: number;
  codigo: string;
  descripcion: string;
}

export interface ProgramaSalud {
  id_programa_salud: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Cie10Item {
  codigo: string;
  nombre: string | null;
  descripcion: string | null;
}

export interface DiagnosisConfirmationType {
  id_tipo_confirmacion: number;
  codigo: string;
  descripcion: string;
}

export interface Role {
  id_rol: number;
  nombre: string;
  descripcion: string | null;
}

export async function fetchTiposDocumento(): Promise<TipoDocumento[]> {
  const res = await apiClient.get<TipoDocumento[]>("/catalogs/document-types");
  return res.data;
}

export async function fetchGeneros(): Promise<Genero[]> {
  const res = await apiClient.get<Genero[]>("/catalogs/genders");
  return res.data;
}

export async function fetchEstadosCiviles(): Promise<EstadoCivil[]> {
  const res = await apiClient.get<EstadoCivil[]>("/catalogs/marital-statuses");
  return res.data;
}

export async function fetchTiposSangre(): Promise<TipoSangre[]> {
  const res = await apiClient.get<TipoSangre[]>("/catalogs/blood-types");
  return res.data;
}

export async function fetchSedes(): Promise<Sede[]> {
  const res = await apiClient.get<Sede[]>("/catalogs/sites");
  return res.data;
}

export async function fetchEspecialidades(): Promise<Especialidad[]> {
  const res = await apiClient.get<Especialidad[]>("/catalogs/specialties");
  return res.data;
}

export async function fetchProgramas(): Promise<ProgramaAcademico[]> {
  const res = await apiClient.get<ProgramaAcademico[]>("/catalogs/programs");
  return res.data;
}

export async function fetchProgramasPorTipoPoblacion(
  tipoPoblacion: string,
): Promise<ProgramaAcademico[]> {
  const res = await apiClient.get<ProgramaAcademico[]>("/catalogs/programs", {
    params: { tipoPoblacion },
  });
  return res.data;
}

export async function fetchRoles(): Promise<Role[]> {
  const res = await apiClient.get<Role[]>("/catalogs/roles");
  return res.data;
}

export async function fetchEps(): Promise<Eps[]> {
  const res = await apiClient.get<Eps[]>("/catalogs/eps");
  return res.data;
}

export async function fetchTiposUsuario(): Promise<TipoUsuario[]> {
  const res = await apiClient.get<TipoUsuario[]>("/catalogs/user-types");
  return res.data;
}

export async function fetchDepartamentos(): Promise<Departamento[]> {
  const res = await apiClient.get<Departamento[]>("/catalogs/departments");
  return res.data;
}

export async function fetchCiudades(departmentId?: number): Promise<Ciudad[]> {
  const res = await apiClient.get<Ciudad[]>("/catalogs/cities", {
    params: {
      departmentId: departmentId || undefined,
    },
  });
  return res.data;
}

export async function fetchTiposCita(): Promise<TipoCita[]> {
  const res = await apiClient.get<TipoCita[]>("/catalogs/appointment-types");
  return res.data;
}

export async function fetchEstadosCita(): Promise<EstadoCita[]> {
  const res = await apiClient.get<EstadoCita[]>("/catalogs/appointment-statuses");
  return res.data;
}

export async function fetchTiposHistoriaClinica(): Promise<TipoHistoriaClinica[]> {
  const res = await apiClient.get<TipoHistoriaClinica[]>("/catalogs/history-types");
  return res.data;
}

export async function fetchTiposAtencion(): Promise<TipoAtencion[]> {
  const res = await apiClient.get<TipoAtencion[]>("/catalogs/attention-types");
  return res.data;
}

export async function fetchModalidadesAtencion(): Promise<ModalidadAtencion[]> {
  const res = await apiClient.get<ModalidadAtencion[]>("/catalogs/attention-modalities");
  return res.data;
}

export async function fetchProgramasSalud(): Promise<ProgramaSalud[]> {
  const res = await apiClient.get<ProgramaSalud[]>("/catalogs/health-programs");
  return res.data;
}

export async function searchCie10(query: string, take: number = 20): Promise<Cie10Item[]> {
  const res = await apiClient.get<Cie10Item[]>("/catalogs/cie10", {
    params: {
      query: query.trim(),
      take,
    },
  });
  return res.data;
}

export async function fetchDiagnosisConfirmationTypes(): Promise<DiagnosisConfirmationType[]> {
  const res = await apiClient.get<DiagnosisConfirmationType[]>("/catalogs/diagnosis-confirmations");
  return res.data;
}
