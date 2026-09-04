import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  DEFAULT_TIME_ZONE,
  endOfDayInZone,
  parseDateInZoneToUtc,
  dayOfWeekInZone,
} from "@/lib/date-time";
import * as XLSX from "xlsx";

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function parseDateRange(value: { from: string | null; to: string | null }):
  | { gte: Date; lte: Date }
  | undefined {
  const from = value.from ? parseDateInZoneToUtc(value.from) : null;
  const to = value.to ? parseDateInZoneToUtc(value.to) : null;
  if (!from && !to) return undefined;

  const gte = from ?? parseDateInZoneToUtc("1900-01-01")!;
  const lte = to ? endOfDayInZone(to) : new Date(8640000000000000);
  return { gte, lte };
}

function formatDateEsCO(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: DEFAULT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatTimeEsCO(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: DEFAULT_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function parseIntegerParam(value: string | null): number | undefined {
  if (!value || !value.trim()) return undefined;
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return undefined;
  return num;
}

function validateDay(value: string | null): number | undefined {
  if (!value || !value.trim()) return undefined;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0 || num > 7) return undefined;
  return num;
}

export interface MedicalAgendaRow {
  id_cita: number;
  fecha: string;
  dia_semana: number;
  dia_nombre: string;
  hora: string;
  hora_fin: string | null;
  profesional: string;
  sede: string | null;
  paciente: string;
  documento: string;
  estado: string | null;
  tipo: string | null;
  fecha_hora_inicio: string;
}

function buildStats(rows: MedicalAgendaRow[]) {
  const byMedico: Record<string, number> = {};
  const bySede: Record<string, number> = {};
  const byEstado: Record<string, number> = {};

  for (const row of rows) {
    const medicoKey = row.profesional || "Sin profesional";
    byMedico[medicoKey] = (byMedico[medicoKey] ?? 0) + 1;

    const sedeKey = row.sede ?? "Sin sede";
    bySede[sedeKey] = (bySede[sedeKey] ?? 0) + 1;

    const estadoKey = row.estado ?? "Sin estado";
    byEstado[estadoKey] = (byEstado[estadoKey] ?? 0) + 1;
  }

  return {
    total: rows.length,
    por_medico: Object.entries(byMedico)
      .map(([medico, total]) => ({ medico, total }))
      .sort((a, b) => b.total - a.total),
    por_sede: Object.entries(bySede)
      .map(([sede, total]) => ({ sede, total }))
      .sort((a, b) => b.total - a.total),
    por_estado: Object.entries(byEstado)
      .map(([estado, total]) => ({ estado, total }))
      .sort((a, b) => b.total - a.total),
  };
}

async function queryAgenda(params: {
  from: string | null;
  to: string | null;
  medicoId?: number;
  sedeId?: number;
  dia?: number;
}): Promise<MedicalAgendaRow[]> {
  const dateRange = parseDateRange({ from: params.from, to: params.to });

  const citas = await prisma.citas.findMany({
    where: {
      ...(dateRange ? { fecha_hora_inicio: dateRange } : {}),
      ...(params.medicoId ? { id_profesional: params.medicoId } : {}),
      ...(params.sedeId ? { id_sede: params.sedeId } : {}),
    },
    include: {
      pacientes: true,
      profesionales_salud: {
        include: {
          usuarios: true,
        },
      },
      sedes: true,
      estados_cita: true,
      tipos_cita: true,
    },
    orderBy: {
      fecha_hora_inicio: "asc",
    },
    take: 2000,
  });

  const rows = citas.map((cita: (typeof citas)[number]) => {
    const start = cita.fecha_hora_inicio;
    const dayOfWeek = dayOfWeekInZone(start);
    return {
      id_cita: cita.id_cita,
      fecha: formatDateEsCO(start),
      dia_semana: dayOfWeek === 7 ? 7 : dayOfWeek,
      dia_nombre: DAY_NAMES[dayOfWeek === 7 ? 0 : dayOfWeek] ?? "",
      hora: formatTimeEsCO(start),
      hora_fin: cita.fecha_hora_fin ? formatTimeEsCO(cita.fecha_hora_fin) : null,
      profesional: cita.profesionales_salud.usuarios.nombre_completo,
      sede: cita.sedes?.nombre ?? null,
      paciente: `${cita.pacientes.nombres} ${cita.pacientes.apellidos}`.trim(),
      documento: cita.pacientes.numero_documento,
      estado: cita.estados_cita?.descripcion ?? "Atendido sin cita",
      tipo: cita.tipos_cita?.descripcion ?? null,
      fecha_hora_inicio: start.toISOString(),
    };
  });

  if (params.dia && params.dia > 0) {
    return rows.filter((row) => row.dia_semana === params.dia);
  }

  return rows;
}

function estadoXlsxFill(estado: string | null): string {
  const norm = String(estado ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (!norm) return "F1F5F9";
  if (norm.includes("PROGRAM")) return "E0F2FE";
  if (norm.includes("CONFIRM")) return "D1FAE5";
  if (norm.includes("ATEND") || norm.includes("REALIZ")) return "DCFCE7";
  if (norm.includes("NO ASISTE")) return "FEF3C7";
  if (norm.includes("CANCEL") && norm.includes("PACIENT")) return "FFEDD5";
  if (norm.includes("CANCEL") && (norm.includes("INSTITUC") || norm.includes("PROFESION"))) return "FEE2E2";
  if (norm.includes("REPROGRAM")) return "EDE9FE";
  return "F1F5F9";
}

function buildXlsx(rows: MedicalAgendaRow[], filters: Record<string, string>) {
  const generatedAt = formatDateEsCO(new Date());

  const data = [
    ["AGENDA MÉDICA"],
    [`Fecha de generación: ${generatedAt}`],
    [`Médico: ${filters.medico}`],
    [`Sede: ${filters.sede}`],
    [`Fecha: ${filters.fecha}`],
    [`Día: ${filters.dia}`],
    [],
    ["Fecha", "Día", "Hora inicio", "Hora fin", "Médico", "Sede", "Paciente", "Documento", "Estado", "Tipo"],
    ...rows.map((row) => [
      row.fecha,
      row.dia_nombre,
      row.hora,
      row.hora_fin ?? "",
      row.profesional,
      row.sede ?? "",
      row.paciente,
      row.documento,
      row.estado ?? "",
      row.tipo ?? "",
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  const colWidths = [
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 30 },
    { wch: 18 },
    { wch: 30 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
  ];
  ws["!cols"] = colWidths;

  const headerRowIndex = 7;
  const estadoColIndex = 8;

  // Estilo del encabezado de estado
  const headerCellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: estadoColIndex });
  if (ws[headerCellRef]) {
    ws[headerCellRef].s = {
      font: { bold: true, color: { rgb: "334155" } },
      fill: { fgColor: { rgb: "F1F5F9" }, patternType: "solid" },
    };
  }

  // Colores por estado
  for (let i = 0; i < rows.length; i++) {
    const rowIndex = headerRowIndex + 1 + i;
    const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: estadoColIndex });
    const cell = ws[cellRef];
    if (cell) {
      cell.s = {
        fill: { fgColor: { rgb: estadoXlsxFill(rows[i].estado) }, patternType: "solid" },
      };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Agenda Médica");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const medicoId = parseIntegerParam(searchParams.get("medico"));
    const sedeId = parseIntegerParam(searchParams.get("sede"));
    const dia = validateDay(searchParams.get("dia"));
    const format = searchParams.get("format")?.trim().toLowerCase() || "json";

    if (from && !parseDateInZoneToUtc(from)) {
      return NextResponse.json(
        { message: "La fecha inicial no es válida" },
        { status: 400 },
      );
    }

    if (to && !parseDateInZoneToUtc(to)) {
      return NextResponse.json(
        { message: "La fecha final no es válida" },
        { status: 400 },
      );
    }

    if (from && to) {
      const fromDate = parseDateInZoneToUtc(from);
      const toDate = parseDateInZoneToUtc(to);
      if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
        return NextResponse.json(
          { message: "La fecha inicial no puede ser posterior a la fecha final" },
          { status: 400 },
        );
      }
    }

    if (searchParams.has("medico") && medicoId === undefined) {
      return NextResponse.json(
        { message: "El médico seleccionado no es válido" },
        { status: 400 },
      );
    }

    if (searchParams.has("sede") && sedeId === undefined) {
      return NextResponse.json(
        { message: "La sede seleccionada no es válida" },
        { status: 400 },
      );
    }

    if (searchParams.has("dia") && dia === undefined) {
      return NextResponse.json(
        { message: "El día seleccionado no es válido" },
        { status: 400 },
      );
    }

    const rows = await queryAgenda({ from, to, medicoId, sedeId, dia });

    const stats = buildStats(rows);

    if (format === "xlsx") {
      const medicoLabel = medicoId ? rows[0]?.profesional ?? "Seleccionado" : "Todos";
      const sedeLabel = sedeId ? rows[0]?.sede ?? "Seleccionada" : "Todas";
      const fechaLabel = from && to ? `${from} - ${to}` : from ?? to ?? "Todas";
      const diaLabel =
        dia && dia > 0 ? DAY_NAMES[dia === 7 ? 6 : dia] ?? String(dia) : "Todos";

      const buffer = buildXlsx(rows, {
        medico: medicoLabel,
        sede: sedeLabel,
        fecha: fechaLabel,
        dia: diaLabel,
      });

      const today = new Date().toISOString().slice(0, 10);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=agenda_medica_${today}.xlsx`,
        },
      });
    }

    return NextResponse.json({ data: rows, stats });
  } catch (error) {
    console.error("Error fetching medical agenda report", error);
    return NextResponse.json(
      { message: "Error obteniendo reporte de agenda médica" },
      { status: 500 },
    );
  }
}
