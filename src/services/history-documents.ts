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

export interface ExportedDocument {
  id_exportacion: number;
  id_historia_clinica: number;
  id_atencion: number | null;
  id_usuario_exporto: number;
  tipo_documento: string;
  nombre_archivo: string;
  ruta: string | null;
  tamano_bytes: string | null;
  fecha_exportacion: string;
  usuario: string | null;
}

export type ExportedDocumentType = "indicaciones-medicas" | "referencia-pacientes";

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

export async function fetchExportedDocuments(patientId: string, historyId: number) {
  const response = await apiClient.get<{ data: ExportedDocument[] }>(
    `/patients/${patientId}/records/${historyId}/exported-documents`,
  );
  return response.data.data;
}

export async function registerExportedDocument(
  patientId: string,
  historyId: number,
  payload: {
    tipo_documento: ExportedDocumentType;
    id_atencion?: number | null;
    nombre_archivo?: string;
    file: File;
  },
) {
  const formData = new FormData();
  formData.append("tipo_documento", payload.tipo_documento);
  formData.append("file", payload.file);
  if (payload.nombre_archivo) {
    formData.append("nombre_archivo", payload.nombre_archivo);
  }
  if (payload.id_atencion !== undefined && payload.id_atencion !== null) {
    formData.append("id_atencion", String(payload.id_atencion));
  }

  const response = await apiClient.post(
    `/patients/${patientId}/records/${historyId}/exported-documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

export async function downloadExportedDocument(
  patientId: string,
  historyId: number,
  document: ExportedDocument,
) {
  const response = await apiClient.get(
    `/patients/${patientId}/records/${historyId}/exported-documents/${document.id_exportacion}/download`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(response.data);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = document.nombre_archivo;
  anchor.click();
  URL.revokeObjectURL(url);
}
