import { apiClient } from "@/lib/api";
import type { UserListItem } from "@/types/users";

export async function fetchUsers(search?: string): Promise<UserListItem[]> {
  const res = await apiClient.get<UserListItem[]>("/users", {
    params: {
      search: search && search.trim().length > 0 ? search.trim() : undefined,
    },
  });
  return res.data;
}
