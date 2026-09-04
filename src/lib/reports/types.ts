/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ReportPatient {
  nombres: string;
  apellidos: string;
  numero_documento: string;
  tipos_documento?: { codigo: string } | null;
  programas_academicos?: { nombre: string; codigo?: string } | null;
}

export interface ReportData {
  patient?: ReportPatient;
  history?: any;
  attention?: any;
  issuedBy?: {
    nombre_completo?: string;
    firma_digital?: string | null;
  };
  meta?: unknown;
}

export interface ReportDefinition {
  id: string;
  name: string;
  code: string;
  version: string;
  vigencia: string;
  buildContent: (data: ReportData) => any[];
}
