import { apiClient } from "@/lib/api";
import type { HistoryDocumentType } from "@/lib/patient-documents";

export interface HistoryDocument {
  id_archivo: number;
  tipo_documento: HistoryDocumentType;
  nombre_archivo: string;
  extension: string | null;
  tipo_mime: string | null;
  tamano_bytes: string | null;
  fecha_subida: string;
  usuario: string | null;
}

export async function fetchHistoryDocuments(patientId: string, historyId: number) {
  const response = await apiClient.get<{ data: HistoryDocument[] }>(
    `/patients/${patientId}/records/${historyId}/documents`,
  );
  return response.data.data;
}

export async function uploadHistoryDocument(
  patientId: string,
  historyId: number,
  tipoDocumento: HistoryDocumentType,
  file: File,
  replace: boolean,
) {
  const formData = new FormData();
  formData.append("tipo_documento", tipoDocumento);
  formData.append("file", file);
  formData.append("replace", String(replace));
  const response = await apiClient.post(
    `/patients/${patientId}/records/${historyId}/documents`,
    formData,
  );
  return response.data;
}

export async function downloadHistoryDocument(
  patientId: string,
  historyId: number,
  document: HistoryDocument,
) {
  const response = await apiClient.get(
    `/patients/${patientId}/records/${historyId}/documents/${document.id_archivo}/download`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(response.data);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = document.nombre_archivo;
  anchor.click();
  URL.revokeObjectURL(url);
}
