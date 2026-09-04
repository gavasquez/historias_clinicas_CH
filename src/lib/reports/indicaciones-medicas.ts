/* eslint-disable @typescript-eslint/no-explicit-any */

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

function buildContent(data: ReportData): any[] {
  const { history, attention } = data;
  const patient =
    data.patient ??
    ({ nombres: "", apellidos: "", numero_documento: "" } as ReportPatient);
  const cierre = attention?.hc_atencion_cierre || {};
  const certificadoOpcion = String(cierre.certificado_opcion ?? "").trim().toLowerCase();
  const certificate =
    cierre.certificado_emitido === true ||
    certificadoOpcion === "si" ||
    certificadoOpcion === "sí" ||
    (attention?.certificados_medicos?.length ?? 0) > 0 ||
    (cierre.certificado_recomendaciones ?? "").toString().trim().length > 0 ||
    (cierre.certificado_restricciones ?? "").toString().trim().length > 0;

  return [
    { text: "INFORMACIÓN DEL PACIENTE", style: "sectionTitle" },
    {
      table: {
        widths: ["30%", "70%"],
        body: [
          [{ text: "Fecha:", bold: true }, { text: formatDate(attention?.fecha_hora || history?.fecha_apertura) }],
          [
            { text: "Nombres y apellidos:", bold: true },
            { text: `${patient.nombres} ${patient.apellidos}`.trim() },
          ],
          [
            { text: "Identificación:", bold: true },
            { text: `${patient.tipos_documento?.codigo || ""} ${patient.numero_documento}`.trim() || "No registrado" },
          ],
          [
            { text: "Programa:", bold: true },
            { text: patient.programas_academicos?.nombre || "No registrado" },
          ],
          [
            { text: "Código:", bold: true },
            { text: patient.programas_academicos?.codigo || "No registrado" },
          ],
          [{ text: "Diagnóstico:", bold: true }, { text: principalDiagnosis(attention) }],
        ],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 12],
    },

    { text: "RECOMENDACIONES", style: "sectionTitle" },
    { text: cierre.recomendaciones || cierre.conducta_plan_estudio_manejo || "Sin recomendaciones registradas", margin: [0, 0, 0, 12] },

    ...(certificate
      ? [
          {
            columns: [
              {
                width: 16,
                canvas: [
                  { type: "rect", x: 0, y: 0, w: 14, h: 14, color: "#16a34a" },
                  { type: "line", x1: 3, y1: 8, x2: 6, y2: 11, lineColor: "#ffffff", lineWidth: 2, lineCap: "round" },
                  { type: "line", x1: 6, y1: 11, x2: 12, y2: 4, lineColor: "#ffffff", lineWidth: 2, lineCap: "round" },
                ],
              },
              {
                text: "CERTIFICADO MÉDICO",
                bold: true,
                color: "#047857",
                fontSize: 11,
                margin: [0, 0, 0, 0],
              },
            ],
            columnGap: 6,
            margin: [0, 0, 0, 6],
          },
          { text: `Se certifica que: ${certificateObservations(attention)}`, margin: [0, 0, 0, 12] },
        ]
      : []),
  ];
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
