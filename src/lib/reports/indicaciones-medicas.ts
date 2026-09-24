/* eslint-disable @typescript-eslint/no-explicit-any */

import { unifiedForm } from "./base";
import type { ReportData, ReportDefinition, ReportPatient } from "./types";

function formatDate(value: unknown): string {
  if (!value) return "Sin fecha";
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function principalDiagnosis(attention: any): string {
  const dxs = attention?.diagnosticos_atencion || [];
  const principal = dxs.find((d: any) => d.es_principal) || dxs[0];
  if (!principal) return "No registrado";
  const name = principal.cie10?.nombre ? ` - ${principal.cie10.nombre}` : "";
  return `${principal.codigo_cie10}${name}`.trim();
}

function certificateObservations(attention: any): string {
  const cert = attention?.certificados_medicos?.[0];
  if (cert?.recomendaciones) return cert.recomendaciones;
  if (cert?.restricciones) return cert.restricciones;
  const cierre = attention?.hc_atencion_cierre;
  return (
    cierre?.certificado_recomendaciones ||
    cierre?.certificado_restricciones ||
    "No se registraron observaciones"
  );
}

function certificateType(attention: any): string {
  const cert = attention?.certificados_medicos?.[0];
  const tipo = cert?.tipos_certificado_medico;
  if (tipo?.descripcion) return tipo.descripcion;
  if (tipo?.codigo) return tipo.codigo;

  const cierre = attention?.hc_atencion_cierre;
  const opcion = String(cierre?.certificado_opcion ?? "").trim().toUpperCase();
  const map: Record<string, string> = {
    CON_RESTRICCIONES: "Con restricciones",
    CON_RECOMENDACIONES: "Con recomendaciones",
    SIN_RESTRICCIONES: "Sin restricciones",
  };
  return map[opcion] || opcion || "No registrado";
}

function buildContent(data: ReportData): any[] {
  const { history, attention } = data;
  const patient =
    data.patient ??
    ({ nombres: "", apellidos: "", numero_documento: "" } as ReportPatient);
  const cierre = attention?.hc_atencion_cierre || {};
  const historyTypeCode = String(history?.tipos_historia_clinica?.codigo ?? "").trim();
  const recomendacionesText =
    historyTypeCode === "REG_ATENCION_SALUD"
      ? cierre.recomendaciones || "Sin recomendaciones registradas"
      : cierre.recomendaciones || cierre.conducta_plan_estudio_manejo || "Sin recomendaciones registradas";
  const certificadoOpcion = String(cierre.certificado_opcion ?? "").trim().toLowerCase();
  const certificadoOpcionesValidas = [
    "si",
    "sí",
    "con_restricciones",
    "con_recomendaciones",
    "sin_restricciones",
  ];
  const certificate =
    cierre.certificado_emitido === true ||
    certificadoOpcionesValidas.includes(certificadoOpcion) ||
    (attention?.certificados_medicos?.length ?? 0) > 0 ||
    (cierre.certificado_recomendaciones ?? "").toString().trim().length > 0 ||
    (cierre.certificado_restricciones ?? "").toString().trim().length > 0;

  const sections: { title: string; content: any }[] = [
    {
      title: "INFORMACIÓN DEL PACIENTE",
      content: {
        table: {
          widths: ["30%", "70%"],
          body: [
            [{ text: "Fecha:", bold: true }, { text: formatDate(attention?.fecha_hora || history?.fecha_apertura) }],
            [{ text: "Nombres y apellidos:", bold: true }, { text: `${patient.nombres} ${patient.apellidos}`.trim() }],
            [
              { text: "Identificación:", bold: true },
              { text: `${patient.tipos_documento?.codigo || ""} ${patient.numero_documento}`.trim() || "No registrado" },
            ],
            [{ text: "Programa:", bold: true }, { text: patient.programas_academicos?.nombre || "No registrado" }],
            [{ text: "Diagnóstico:", bold: true }, { text: principalDiagnosis(attention) }],
          ],
        },
        layout: "noBorders",
      },
    },
    {
      title: "RECOMENDACIONES",
      content: {
        text: recomendacionesText,
        fontSize: 10,
      },
    },
  ];

  if (certificate) {
    sections.push({
      title: "CERTIFICADO MÉDICO",
      content: {
        table: {
          widths: ["30%", "70%"],
          body: [
            [{ text: "Tipo de certificado:", bold: true }, { text: certificateType(attention) }],
            [{ text: "Observaciones:", bold: true }, { text: certificateObservations(attention) }],
          ],
        },
        layout: "noBorders",
      },
    });
  }

  return [unifiedForm(sections)];
}

const indicacionesMedicasReport: ReportDefinition = {
  id: "indicaciones-medicas",
  name: "Indicaciones Médicas",
  code: "FO-BI-13",
  version: "03",
  vigencia: "Enero 18 de 2023",
  buildContent,
};

export { indicacionesMedicasReport };
export default indicacionesMedicasReport;
