// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { LOGO_BASE64 } from "./logo";
import type { ReportData, ReportDefinition } from "./types";

(pdfMake as any).addVirtualFileSystem(pdfFonts as any);

const INSTITUTIONAL_FOOTER = [
  { text: "CORPORACIÓN UNIVERSITARIA DEL HUILA CORHUILA", style: "footerInstitution" },
  { text: "INSTITUCIÓN UNIVERSITARIA VIGILADA MINEDUCACIÓN", style: "footerInstitution" },
  { text: "Personería Jurídica Res. Ministerio de Educación No. 21000 de Diciembre de 1989", style: "footerInstitution" },
];

function buildHeader(def: ReportDefinition, currentPage: number, pageCount: number) {
  return {
    margin: [40, 30, 40, 0],
    columns: [
      {
        width: 80,
        image: LOGO_BASE64,
        fit: [80, 80],
        alignment: "left",
      },
      {
        stack: [
          { text: "Bienestar Institucional", fontSize: 14, bold: true, color: "#003366" },
          { text: def.name, fontSize: 13, bold: true, margin: [0, 2, 0, 6], color: "#1f2937" },
          {
            table: {
              widths: ["*", "*", "*", "*"],
              body: [
                [
                  { text: `Código: ${def.code}`, fontSize: 8, color: "#374151" },
                  { text: `Versión: ${def.version}`, fontSize: 8, color: "#374151" },
                  { text: `Página: ${currentPage} de ${pageCount}`, fontSize: 8, color: "#374151" },
                  {
                    text: `Vigencia: ${def.vigencia}`,
                    fontSize: 8,
                    color: "#374151",
                    alignment: "right",
                  },
                ],
              ],
            },
            layout: "noBorders",
          },
        ],
      },
    ],
    columnGap: 12,
  };
}

function buildIssuedBy(issuedBy?: ReportData["issuedBy"]) {
  if (!issuedBy || !issuedBy.nombre_completo) {
    return undefined;
  }

  const signatureImage =
    issuedBy.firma_digital && String(issuedBy.firma_digital).startsWith("data:image")
      ? issuedBy.firma_digital
      : null;

  return [
    { text: "EXPEDIDO POR", style: "sectionTitle" },
    {
      table: {
        widths: ["50%", "50%"],
        body: [
          [
            { text: "Nombre completo:", bold: true },
            { text: "Firma:", bold: true },
          ],
          [
            { text: issuedBy.nombre_completo },
            signatureImage
              ? {
                  image: signatureImage,
                  fit: [160, 50],
                }
              : {
                  text: "________________________________________________",
                  margin: [0, 8, 0, 0],
                },
          ],
        ],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 12],
    },
  ];
}

function buildFooter(currentPage: number, pageCount: number, data?: ReportData) {
  const issuedBy =
    currentPage === pageCount ? buildIssuedBy(data?.issuedBy) : null;

  return {
    margin: [40, 0, 40, 30],
    stack: [
      ...(issuedBy || []),
      ...INSTITUTIONAL_FOOTER,
      {
        text: `Página ${currentPage} de ${pageCount}`,
        fontSize: 8,
        alignment: "center",
        color: "#6b7280",
        margin: [0, 4, 0, 0],
      },
    ],
  };
}

export function buildDocDefinition(def: ReportDefinition, data: ReportData) {
  return {
    pageSize: "LETTER",
    pageMargins: [40, 140, 40, data.issuedBy?.nombre_completo ? 190 : 100],
    defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.25 },
    header: (currentPage: number, pageCount: number) => buildHeader(def, currentPage, pageCount),
    footer: (currentPage: number, pageCount: number) => buildFooter(currentPage, pageCount, data),
    content: def.buildContent(data),
    styles: {
      sectionTitle: {
        bold: true,
        fontSize: 11,
        color: "#003366",
        margin: [0, 8, 0, 6],
      },
      footerInstitution: {
        fontSize: 8,
        color: "#4b5563",
        alignment: "center",
        bold: true,
      },
    },
  };
}

export function downloadReport(
  def: ReportDefinition,
  data: ReportData,
  filename?: string,
): Promise<void> {
  const dd = buildDocDefinition(def, data);
  const pdf = (pdfMake as any).createPdf(dd);
  const file = filename || `${def.id}.pdf`;

  return new Promise((resolve) => {
    pdf.download(file, () => resolve());
  });
}

export function getReportDataUrl(def: ReportDefinition, data: ReportData): Promise<string> {
  const dd = buildDocDefinition(def, data);
  const pdf = (pdfMake as any).createPdf(dd);

  return new Promise((resolve) => {
    pdf.getBlob((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      resolve(url);
    });
  });
}
