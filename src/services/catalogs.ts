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

export async function fetchEps(): Promise<Eps[]> {
  const res = await apiClient.get<Eps[]>("/catalogs/eps");
  return res.data;
}

export async function fetchTiposUsuario(): Promise<TipoUsuario[]> {
  const res = await apiClient.get<TipoUsuario[]>("/catalogs/user-types");
  return res.data;
}
