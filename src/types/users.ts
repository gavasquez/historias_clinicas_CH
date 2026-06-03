export interface UserListItem {
  id_usuario: number;
  username?: string;
  nombre_completo: string;
  email: string | null;
  telefono: string;
  id_tipo_documento: number | null;
  numero_documento: string | null;
  activo: boolean;
  password_reset_required: boolean;
  fecha_creacion?: string;
  rol?: {
    id_rol: number;
    nombre: string;
    descripcion: string | null;
  } | null;
  profesional?: {
    id_profesional: number;
  } | null;
  tipo_documento?: {
    id_tipo_documento: number;
    codigo: string;
    descripcion: string;
  } | null;
}

export type UsersResponse = {
  data: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
};
