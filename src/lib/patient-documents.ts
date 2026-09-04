export const HISTORY_DOCUMENT_ENTITY = "historias_clinicas";
export const MAX_HISTORY_DOCUMENT_SIZE = 10 * 1024 * 1024;

export const HISTORY_DOCUMENT_TYPES = [
  {
    code: "REFERENCIA_PACIENTES",
    label: "Referencia de Pacientes",
  },
  {
    code: "DESISTIMIENTO_SEGUIMIENTO_CRONICOS",
    label: "Desistimiento informado del programa de seguimiento de condiciones crónicas en salud",
  },
] as const;

export type HistoryDocumentType = (typeof HISTORY_DOCUMENT_TYPES)[number]["code"];

export const ALLOWED_HISTORY_DOCUMENT_FILES = {
  ".pdf": ["application/pdf"],
  ".xls": ["application/vnd.ms-excel", "application/octet-stream", ""],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
    "application/zip",
    "",
  ],
} as const;

export function isHistoryDocumentType(value: string): value is HistoryDocumentType {
  return HISTORY_DOCUMENT_TYPES.some((type) => type.code === value);
}

export function getHistoryDocumentTypeLabel(value: string): string {
  return HISTORY_DOCUMENT_TYPES.find((type) => type.code === value)?.label ?? value;
}
