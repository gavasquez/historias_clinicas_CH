// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { LOGO_BASE64 } from "./logo";
import type { ReportData, ReportDefinition } from "./types";

(pdfMake as any).addVirtualFileSystem(pdfFonts as any);

const BORDER_COLOR = "#cbd5e1";
const HEADER_BG = "#1e2937";
const HEADER_TEXT = "#ffffff";

const INSTITUTIONAL_FOOTER = [
  { text: "CORPORACIÓN UNIVERSITARIA DEL HUILA CORHUILA", style: "footerInstitution" },
  { text: "INSTITUCIÓN UNIVERSITARIA VIGILADA MINEDUCACIÓN", style: "footerInstitution" },
  { text: "Personería Jurídica Res. Ministerio de Educación No. 21000 de Diciembre de 1989", style: "footerInstitution" },
];

function borderedTableLayout(): any {
  return {
    hLineWidth: (i: number, node: any) => {
      if (i === 0 || i === node.table.body.length) return 1;
      return 0.5;
    },
    vLineWidth: () => 1,
    hLineColor: () => BORDER_COLOR,
    vLineColor: () => BORDER_COLOR,
    paddingLeft: () => 6,
    paddingRight: () => 6,
    paddingTop: () => 4,
    paddingBottom: () => 4,
  };
}

export function reportSection(title: string, rows: [any, any][]): any {
  return {
    table: {
      widths: ["30%", "70%"],
      body: [
        [{ text: title, bold: true, color: HEADER_TEXT, fillColor: HEADER_BG, fontSize: 11, colSpan: 2, alignment: "left" }, {}],
        ...rows,
      ],
    },
    layout: borderedTableLayout(),
    margin: [0, 0, 0, 12],
  };
}

export function reportSectionText(title: string, content: string): any {
  return {
    table: {
      widths: ["30%", "70%"],
      body: [
        [{ text: title, bold: true, color: HEADER_TEXT, fillColor: HEADER_BG, fontSize: 11, colSpan: 2, alignment: "left" }, {}],
        [{ text: content, alignment: "left", colSpan: 2 }, {}],
      ],
    },
    layout: borderedTableLayout(),
    margin: [0, 0, 0, 12],
  };
}

export function reportFullWidthSection(title: string, content: any): any {
  return {
    table: {
      widths: ["*"],
      body: [
        [{ text: title, bold: true, color: HEADER_TEXT, fillColor: HEADER_BG, fontSize: 11, alignment: "left" }],
        [content],
      ],
    },
    layout: borderedTableLayout(),
    margin: [0, 0, 0, 12],
  };
}

export function unifiedForm(sections: { title: string; content: any }[]): any {
  const body: any[] = [];
  sections.forEach((section) => {
    body.push([{ text: section.title, bold: true, color: HEADER_TEXT, fillColor: HEADER_BG, fontSize: 11, alignment: "left" }]);
    body.push([section.content]);
  });

  return {
    table: {
      widths: ["*"],
      body,
    },
    layout: {
      hLineWidth: (i: number, node: any) => {
        if (i === 0 || i === node.table.body.length) return 1;
        // Línea fuerte entre secciones (después de cada fila de contenido = índice par)
        if (i % 2 === 0) return 1;
        // Línea suave entre título y contenido (índice impar)
        return 0.5;
      },
      vLineWidth: () => 1,
      hLineColor: () => BORDER_COLOR,
      vLineColor: () => BORDER_COLOR,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: (i: number) => (i % 2 === 0 ? 4 : 3),
      paddingBottom: (i: number) => (i % 2 === 0 ? 4 : 3),
    },
    margin: [0, 0, 0, 12],
  };
}

function buildHeader(def: ReportDefinition, currentPage: number, pageCount: number) {
  const headerContent = {
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

  return {
    margin: [40, 30, 40, 0],
    table: {
      widths: ["*"],
      body: [[headerContent]],
    },
    layout: borderedTableLayout(),
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

  const signatureContent = signatureImage
    ? {
        image: signatureImage,
        fit: [160, 50],
        alignment: "left" as const,
      }
    : {
        text: "________________________________________________",
        alignment: "left" as const,
      };

  return [
    [
      {
        stack: [
          { text: [{ text: "Nombre completo: ", bold: true }, issuedBy.nombre_completo] },
          {
            text: [
              { text: "Cédula / Registro médico: ", bold: true },
              issuedBy.registro_medico || "No registrado",
            ],
            margin: [0, 4, 0, 0],
          },
        ],
      },
      {
        columns: [
          { text: "Firma: ", bold: true, width: "auto" },
          signatureContent,
        ],
        columnGap: 4,
      },
    ],
  ];
}

function buildFooter(currentPage: number, pageCount: number, data?: ReportData) {
  const issuedBy =
    currentPage === pageCount ? buildIssuedBy(data?.issuedBy) : null;

  const footerBody: any[] = [];

  if (issuedBy) {
    footerBody.push([{ text: "EXPEDIDO POR", bold: true, color: HEADER_TEXT, fillColor: HEADER_BG, fontSize: 11, alignment: "left" }]);
    footerBody.push([{ table: { widths: ["50%", "50%"], body: issuedBy }, layout: "noBorders" }]);
  }

  footerBody.push([
    {
      table: {
        widths: ["*"],
        body: INSTITUTIONAL_FOOTER.map((line) => [line]),
      },
      layout: "noBorders",
      margin: [0, issuedBy ? 6 : 0, 0, 4],
    },
  ]);

  footerBody.push([
    {
      text: `Página ${currentPage} de ${pageCount}`,
      fontSize: 8,
      alignment: "center",
      color: "#6b7280",
      margin: [0, 4, 0, 0],
    },
  ]);

  return {
    margin: [40, 0, 40, 30],
    table: {
      widths: ["*"],
      body: footerBody,
    },
    layout: borderedTableLayout(),
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

export function getReportBlob(def: ReportDefinition, data: ReportData): Promise<Blob> {
  const dd = buildDocDefinition(def, data);
  const pdf = (pdfMake as any).createPdf(dd);

  return new Promise((resolve, reject) => {
    pdf.getBlob((blob: Blob) => {
      if (!blob) {
        reject(new Error("No se pudo generar el PDF"));
        return;
      }
      resolve(blob);
    });
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
