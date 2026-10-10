export type ClinicalHistoryStatus = "Finalizado" | "Seguimiento";

export function resolveClinicalHistoryStatus(input: {
  seguimientoOpcion: string;
  cierreSeguimiento: boolean | null;
}): ClinicalHistoryStatus | null {
  if (!input.seguimientoOpcion.trim()) return null;
  if (input.cierreSeguimiento === true) return "Finalizado";
  if (input.cierreSeguimiento === false) return "Seguimiento";
  return null;
}
