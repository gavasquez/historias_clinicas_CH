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
  fecha_nacimiento: string | null;
  edad: number | null;
  tipo_documento: string | null;
  telefono: string | null;
  programa: string | null;
  tipo_atencion: string | null;
  asistio: string;
}

function asistioPdfFill(asistio: string | null): string | null {
  const v = String(asistio ?? "").trim().toUpperCase();
  if (v.startsWith("S")) return "#dcfce7";
  if (v === "NO") return "#fef3c7";
  return "#f1f5f9";
}

const HEADER_CELL = {
  bold: true,
  fillColor: "#f1f5f9",
  color: "#334155",
  fontSize: 7,
};

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
      { text: "Hora de Atención", ...HEADER_CELL },
      { text: "Nombre Completo", ...HEADER_CELL },
      { text: "Fecha de Nacimiento", ...HEADER_CELL },
      { text: "Edad", ...HEADER_CELL },
      { text: "Tipo de Identificación", ...HEADER_CELL },
      { text: "Número de Documento", ...HEADER_CELL },
      { text: "Teléfono", ...HEADER_CELL },
      { text: "Programa", ...HEADER_CELL },
      { text: "Tipo de Atención", ...HEADER_CELL },
      { text: "Profesional de Medicina", ...HEADER_CELL },
      { text: "Responsable de Agendamiento", ...HEADER_CELL },
      { text: "Asistió", ...HEADER_CELL },
    ],
  ];

  for (const row of rows) {
    tableBody.push([
      row.hora,
      row.paciente,
      row.fecha_nacimiento ?? "-",
      row.edad != null ? String(row.edad) : "-",
      row.tipo_documento ?? "-",
      row.documento ?? "-",
      row.telefono ?? "-",
      row.programa ?? "-",
      row.tipo_atencion ?? "-",
      row.profesional,
      row.quien_agenda ?? "No registrado",
      {
        text: row.asistio ?? "-",
        fillColor: asistioPdfFill(row.asistio),
      },
    ]);
  }

  if (rows.length === 0) {
    tableBody.push([
      {
        text: "No se encontraron registros para los filtros seleccionados.",
        colSpan: 12,
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
      "",
      "",
      "",
    ]);
  }

  return [
    {
      text: "AGENDA MÉDICA",
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
        widths: [26, "*", 36, 16, 32, 36, 36, "*", "*", "*", "*", 22],
        body: tableBody,
      },
      fontSize: 7,
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#cbd5e1",
        vLineColor: () => "#cbd5e1",
        paddingLeft: () => 3,
        paddingRight: () => 3,
        paddingTop: () => 3,
        paddingBottom: () => 3,
      },
    },
  ];
}

export const medicalAgendaReport: ReportDefinition = {
  id: "agenda-medica",
  name: "Agenda Médica",
  code: "FO-BI-SA-32",
  version: "01",
  vigencia: "AGOSTO 27 DE 2024",
  headerExtra: (data: ReportData) => {
    const meta = data.meta as any;
    const labels = (meta?.labels ?? {}) as { sede?: string };
    return [`Sede: ${labels.sede ?? "Todas"}`, `Fecha de generación: ${formatDate(new Date())}`, "", ""];
  },
  buildContent,
};

export { medicalAgendaReport as default };
