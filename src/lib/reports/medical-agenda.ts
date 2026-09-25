/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ReportData, ReportDefinition } from "./types";

function formatDate(value: unknown): string {
  if (!value) return "Sin fecha";
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

interface MedicalAgendaRow {
  fecha: string;
  dia_nombre: string;
  hora: string;
  hora_fin: string | null;
  profesional: string;
  sede: string | null;
  paciente: string;
  documento: string;
  estado: string | null;
  tipo: string | null;
  quien_agenda: string | null;
}

function estadoPdfFill(estado: string | null): string | null {
  const norm = String(estado ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (!norm) return "#f1f5f9";
  if (norm.includes("PROGRAM")) return "#e0f2fe";
  if (norm.includes("CONFIRM")) return "#d1fae5";
  if (norm.includes("ATEND") && norm.includes("SIN CITA")) return "#e2e8f0";
  if (norm.includes("ATEND")) return "#c7d2fe";
  if (norm.includes("REALIZ")) return "#dcfce7";
  if (norm.includes("NO ASISTE")) return "#fef3c7";
  if (norm.includes("CANCEL") && norm.includes("PACIENT")) return "#ffedd5";
  if (norm.includes("CANCEL") && (norm.includes("INSTITUC") || norm.includes("PROFESION"))) return "#fee2e2";
  if (norm.includes("REPROGRAM")) return "#ede9fe";
  return "#f1f5f9";
}

function buildContent(data: ReportData): any[] {
  const meta = data.meta as any;
  const rows = (meta?.rows ?? []) as MedicalAgendaRow[];
  const labels = (meta?.labels ?? {}) as {
    medico?: string;
    sede?: string;
    fecha?: string;
    dia?: string;
  };

  const tableBody: any[][] = [
    [
      { text: "Fecha", bold: true, fillColor: "#f1f5f9", color: "#334155" },
      { text: "Día", bold: true, fillColor: "#f1f5f9", color: "#334155" },
      { text: "Hora inicio", bold: true, fillColor: "#f1f5f9", color: "#334155" },
      { text: "Hora fin", bold: true, fillColor: "#f1f5f9", color: "#334155" },
      { text: "Médico", bold: true, fillColor: "#f1f5f9", color: "#334155" },
      { text: "Sede", bold: true, fillColor: "#f1f5f9", color: "#334155" },
      { text: "Paciente", bold: true, fillColor: "#f1f5f9", color: "#334155" },
      { text: "Estado", bold: true, fillColor: "#f1f5f9", color: "#334155" },
      { text: "Quién agenda", bold: true, fillColor: "#f1f5f9", color: "#334155" },
    ],
  ];

  for (const row of rows) {
    tableBody.push([
      row.fecha,
      row.dia_nombre,
      row.hora,
      row.hora_fin ?? "-",
      row.profesional,
      row.sede ?? "No registrada",
      row.paciente,
      {
        text: row.estado ?? "Atendido sin cita",
        fillColor: estadoPdfFill(row.estado),
      },
      row.quien_agenda ?? "No registrado",
    ]);
  }

  if (rows.length === 0) {
    tableBody.push([
      {
        text: "No se encontraron registros para los filtros seleccionados.",
        colSpan: 9,
        alignment: "center",
        color: "#64748b",
      },
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
  }

  return [
    {
      text: "ATENCIÓN NO PROGRAMADA",
      fontSize: 14,
      bold: true,
      color: "#003366",
      alignment: "center",
      margin: [0, 0, 0, 4],
    },
    {
      text: `Fecha de generación: ${formatDate(new Date())}`,
      fontSize: 10,
      color: "#374151",
      alignment: "right",
      margin: [0, 0, 0, 12],
    },
    {
      text: "Filtros aplicados",
      style: "sectionTitle",
      margin: [0, 0, 0, 4],
    },
    {
      table: {
        widths: ["25%", "75%"],
        body: [
          ["Médico:", labels.medico ?? "Todos"],
          ["Sede:", labels.sede ?? "Todas"],
          ["Fecha:", labels.fecha ?? "Todas"],
          ["Día:", labels.dia ?? "Todos"],
        ],
      },
      layout: "noBorders",
      fontSize: 10,
      margin: [0, 0, 0, 12],
    },
    {
      table: {
        headerRows: 1,
        widths: ["auto", "auto", "auto", "auto", "*", "*", "*", "auto", "*"],
        body: tableBody,
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#cbd5e1",
        vLineColor: () => "#cbd5e1",
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 3,
        paddingBottom: () => 3,
      },
    },
  ];
}

export const medicalAgendaReport: ReportDefinition = {
  id: "agenda-medica",
  name: "Atención no programada",
  code: "FO-BI-AGM",
  version: "01",
  vigencia: "Septiembre 2026",
  buildContent,
};

export { medicalAgendaReport as default };
