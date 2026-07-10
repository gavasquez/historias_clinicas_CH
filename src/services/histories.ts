import { apiClient } from "@/lib/api";
import type { HistoryDetailResponse } from "@/types/histories";

export async function fetchHistoryDetail(historyId: string): Promise<HistoryDetailResponse> {
  const res = await apiClient.get<HistoryDetailResponse>(`/histories/${historyId}`);
  return res.data;
}

export async function voidHistory(
  historyId: number | string,
  input: { reason: string; confirm: string },
): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>(`/histories/${historyId}/void`, input);
  return res.data;
}
