import { indicacionesMedicasReport } from "./indicaciones-medicas";
import { referenciaPacientesReport } from "./referencia-pacientes";
import type { ReportDefinition } from "./types";

export const REPORT_REGISTRY: Record<string, ReportDefinition[]> = {
  REG_ATENCION_SALUD: [indicacionesMedicasReport, referenciaPacientesReport],
  HC_CONSULTA_EXTERNA: [indicacionesMedicasReport, referenciaPacientesReport],
};

export function getReportsForHistory(historyTypeCode: string): ReportDefinition[] {
  return REPORT_REGISTRY[historyTypeCode] || [];
}

export function getReportForHistory(historyTypeCode: string): ReportDefinition | null {
  return REPORT_REGISTRY[historyTypeCode]?.[0] ?? null;
}
