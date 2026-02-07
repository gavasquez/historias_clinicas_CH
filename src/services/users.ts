import { apiClient } from "@/lib/api";
import type { UserListItem, UsersResponse } from "@/types/users";

export interface UserCreateInput {
  username: string;
  nombre_completo: string;
  email?: string;
  password: string;
  id_rol: number;
  activo?: boolean;
}

export async function fetchUsers(page: number, search?: string): Promise<UsersResponse> {
  const res = await apiClient.get<UsersResponse>("/users", {
    params: {
      page,
      search: search && search.trim().length > 0 ? search.trim() : undefined,
    },
  });
  return res.data;
}

export async function createUser(input: UserCreateInput): Promise<UserListItem> {
  const res = await apiClient.post<UserListItem>("/users", input);
  return res.data;
}

export async function toggleUserActive(
  id: number,
  activo: boolean,
): Promise<UserListItem> {
  const res = await apiClient.put<UserListItem>("/users", { activo }, { params: { id } });
  return res.data;
}

export async function markUserAsProfessional(id_usuario: number): Promise<{
  id_profesional: number;
  id_usuario: number;
  activo: boolean;
  alreadyExists: boolean;
}> {
  const res = await apiClient.post<{
    id_profesional: number;
    id_usuario: number;
    activo: boolean;
    alreadyExists: boolean;
  }>("/users/mark-as-professional", { id_usuario });
  return res.data;
}
