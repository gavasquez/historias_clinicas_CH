export interface UserListItem {
  id_usuario: number;
  username?: string;
  nombre_completo: string;
  email: string | null;
  telefono: string;
  activo: boolean;
  fecha_creacion?: string;
  rol?: {
    id_rol: number;
    nombre: string;
    descripcion: string | null;
  } | null;
  profesional?: {
    id_profesional: number;
  } | null;
}

export type UsersResponse = {
  data: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
};
