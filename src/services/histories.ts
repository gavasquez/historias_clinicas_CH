import { apiClient } from "@/lib/api";
import type { HistoryDetailResponse } from "@/types/histories";

export async function fetchHistoryDetail(historyId: string): Promise<HistoryDetailResponse> {
  const res = await apiClient.get<HistoryDetailResponse>(`/histories/${historyId}`);
  return res.data;
}
