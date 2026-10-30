import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyPermission } from "@/lib/auth";
import {
  DEFAULT_TIME_ZONE,
  endOfDayInZone,
  parseDateInZoneToUtc,
  dayOfWeekInZone,
} from "@/lib/date-time";
import ExcelJS from "exceljs";
import { readFileSync } from "fs";
import path from "path";

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
  quien_agenda: string | null;
  fecha_hora_inicio: string;
  fecha_nacimiento: string | null;
  edad: number | null;
  tipo_documento: string | null;
  telefono: string | null;
  programa: string | null;
  tipo_atencion: string | null;
  asistio: string;
}

function calcEdad(fechaNacimiento: Date | null, ref: Date): number | null {
  if (!fechaNacimiento || Number.isNaN(fechaNacimiento.getTime())) return null;
  let edad = ref.getUTCFullYear() - fechaNacimiento.getUTCFullYear();
  const m = ref.getUTCMonth() - fechaNacimiento.getUTCMonth();
  if (m < 0 || (m === 0 && ref.getUTCDate() < fechaNacimiento.getUTCDate())) edad -= 1;
  return edad >= 0 ? edad : null;
}

// "Sí" si tiene atención registrada; "No" solo si ya pasó el día de la cita sin
// atención o el estado lo indica; "N/A" si fue cancelada; "Pendiente" si la cita
// es de hoy o futura y aún no se registra atención
function computeAsistio(
  cita: {
    fecha_hora_inicio: Date;
    atenciones_salud: { id_atencion: number }[];
    estados_cita: { codigo: string } | null;
  },
): string {
  if (cita.atenciones_salud.length > 0) return "Sí";

  const codigo = cita.estados_cita?.codigo ?? "";
  if (codigo === "REALIZADA") return "Sí";
  if (codigo === "NO_ASISTE") return "No";
  if (codigo.startsWith("CANCELADA")) return "N/A";

  return endOfDayInZone(cita.fecha_hora_inicio).getTime() > Date.now()
    ? "Pendiente"
    : "No";
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
      pacientes: {
        include: {
          tipos_documento: { select: { codigo: true } },
          programas_academicos: { select: { nombre: true } },
        },
      },
      profesionales_salud: {
        include: {
          usuarios: true,
        },
      },
      sedes: true,
      estados_cita: true,
      tipos_cita: true,
      tipos_atencion: true,
      atenciones_salud: { select: { id_atencion: true } },
      usuario_agenda: {
        select: {
          nombre_completo: true,
          roles: { select: { nombre: true } },
        },
      },
    },
    orderBy: {
      fecha_hora_inicio: "asc",
    },
    take: 2000,
  });

  const rows = citas.map((cita: (typeof citas)[number]) => {
    const start = cita.fecha_hora_inicio;
    const dayOfWeek = dayOfWeekInZone(start);
    const estadoRegistrado = cita.estados_cita?.descripcion ?? "Atendido sin cita";
    const estado = estadoRegistrado.trim().toUpperCase().includes("REALIZ")
      ? "Atendida"
      : estadoRegistrado;
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
      estado,
      tipo: cita.tipos_cita?.descripcion ?? null,
      quien_agenda: cita.usuario_agenda
        ? `${cita.usuario_agenda.nombre_completo} / ${cita.usuario_agenda.roles.nombre}`
        : null,
      fecha_hora_inicio: start.toISOString(),
      fecha_nacimiento: cita.pacientes.fecha_nacimiento
        ? formatDateEsCO(cita.pacientes.fecha_nacimiento)
        : null,
      edad: calcEdad(cita.pacientes.fecha_nacimiento, start),
      tipo_documento: cita.pacientes.tipos_documento?.codigo ?? null,
      telefono: cita.pacientes.telefono ?? null,
      programa: cita.pacientes.programas_academicos?.nombre ?? null,
      tipo_atencion:
        cita.tipos_atencion?.descripcion ?? cita.tipos_cita?.descripcion ?? null,
      asistio: computeAsistio(cita),
    };
  });

  if (params.dia && params.dia > 0) {
    return rows.filter((row) => row.dia_semana === params.dia);
  }

  return rows;
}

const EXCEL_COLS = [
  "Hora de Atención",
  "Nombre Completo",
  "Fecha de Nacimiento",
  "Edad",
  "Tipo de Identificación",
  "Número de Documento",
  "Teléfono",
  "Programa",
  "Tipo de Atención",
  "Profesional de Medicina",
  "Responsable de Agendamiento",
  "Asistió",
];

const COL_COUNT = EXCEL_COLS.length;
const THIN_BORDER = { style: "thin" } as const;

function lastColLetter() {
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[COL_COUNT - 1];
}

async function buildExcel(rows: MedicalAgendaRow[], filters: Record<string, string>) {
  const generatedAt = formatDateEsCO(new Date());
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Agenda médica");

  ws.columns = [
    { width: 14 },
    { width: 30 },
    { width: 15 },
    { width: 7 },
    { width: 16 },
    { width: 18 },
    { width: 15 },
    { width: 24 },
    { width: 20 },
    { width: 26 },
    { width: 28 },
    { width: 9 },
  ];

  // Logo Corhuila en su propia celda combinada (A1:A6), sin bordes sobre la imagen
  ws.mergeCells("A1:A6");
  try {
    const logo = readFileSync(path.join(process.cwd(), "public", "logo-corhuila.png"));
    const imageId = wb.addImage({ buffer: logo as unknown as ExcelJS.Buffer, extension: "png" });
    ws.addImage(imageId, { tl: { col: 0.1, row: 0.2 }, ext: { width: 85, height: 95 } });
  } catch {
    // Si no se encuentra el logo, el encabezado queda solo con texto
  }

  for (let r = 1; r <= 4; r++) ws.getRow(r).height = 20;

  const lastCol = lastColLetter();
  const mergeAcross = (row: number, startCol: number, span: number) =>
    `${"ABCDEFGHIJKLMNOPQRSTUVWXYZ"[startCol - 1]}${row}:${"ABCDEFGHIJKLMNOPQRSTUVWXYZ"[startCol - 1 + span - 1]}${row}`;

  // Títulos institucionales (columnas B-L, centrados)
  const titles = [
    { row: 1, text: "CORPORACIÓN UNIVERSITARIA DEL HUILA CORHUILA", size: 12 },
    { row: 2, text: "GESTIÓN DE BIENESTAR INSTITUCIONAL", size: 11 },
    { row: 3, text: "AGENDA MÉDICA", size: 11 },
    { row: 4, text: `Fecha de generación: ${generatedAt}`, size: 8 },
  ];
  for (const t of titles) {
    ws.mergeCells(`B${t.row}:${lastCol}${t.row}`);
    const c = ws.getCell(`B${t.row}`);
    c.value = t.text;
    c.font = { bold: true, size: t.size, color: { argb: "FF334155" } };
    c.alignment = { horizontal: "center", vertical: "middle" };
  }

  // Fila de metadatos del formato (4 celdas repartidas en B-L)
  const metaCells = [
    { text: "Código: FO-BI-SA-32", startCol: 2, span: 3 },
    { text: "Versión: 01", startCol: 5, span: 3 },
    { text: "Vigencia: AGOSTO 27 DE 2024", startCol: 8, span: 3 },
    { text: "Página: 01 de 01", startCol: 11, span: 2 },
  ];
  for (const m of metaCells) {
    ws.mergeCells(mergeAcross(5, m.startCol, m.span));
    const c = ws.getCell(5, m.startCol);
    c.value = m.text;
    c.font = { size: 8, color: { argb: "FF374151" } };
    c.alignment = { horizontal: "center", vertical: "middle" };
  }

  // Fila de filtros aplicados
  const filterCells = [
    { text: `Sede: ${filters.sede}`, startCol: 2, span: 4 },
    { text: `Médico: ${filters.medico}`, startCol: 6, span: 3 },
    { text: `Fecha: ${filters.fecha} / Día: ${filters.dia}`, startCol: 9, span: 4 },
  ];
  for (const f of filterCells) {
    ws.mergeCells(mergeAcross(6, f.startCol, f.span));
    const c = ws.getCell(6, f.startCol);
    c.value = f.text;
    c.font = { size: 8, color: { argb: "FF374151" } };
    c.alignment = { horizontal: "center", vertical: "middle" };
  }

  // Bordes en toda la cabecera (filas 1-6)
  for (let r = 1; r <= 6; r++) {
    for (let c = 1; c <= COL_COUNT; c++) {
      ws.getCell(r, c).border = {
        top: THIN_BORDER,
        left: THIN_BORDER,
        bottom: THIN_BORDER,
        right: THIN_BORDER,
      };
    }
  }

  // Encabezado de la tabla
  const headerRow = ws.getRow(7);
  EXCEL_COLS.forEach((title, i) => {
    const c = headerRow.getCell(i + 1);
    c.value = title;
    c.font = { bold: true, size: 8, color: { argb: "FF334155" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    c.border = { top: THIN_BORDER, left: THIN_BORDER, bottom: THIN_BORDER, right: THIN_BORDER };
  });
  headerRow.height = 26;

  // Filas de datos
  rows.forEach((row, i) => {
    const r = ws.getRow(8 + i);
    const values = [
      row.hora,
      row.paciente,
      row.fecha_nacimiento ?? "",
      row.edad ?? "",
      row.tipo_documento ?? "",
      row.documento ?? "",
      row.telefono ?? "",
      row.programa ?? "",
      row.tipo_atencion ?? "",
      row.profesional,
      row.quien_agenda ?? "No registrado",
      row.asistio,
    ];
    values.forEach((v, ci) => {
      const c = r.getCell(ci + 1);
      c.value = v;
      c.font = { size: 8 };
      c.alignment = { vertical: "middle", wrapText: ci === 1 || ci === 7 || ci === 10 };
      c.border = { top: THIN_BORDER, left: THIN_BORDER, bottom: THIN_BORDER, right: THIN_BORDER };
    });
    const asistioCell = r.getCell(COL_COUNT);
    asistioCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb:
          row.asistio === "Sí"
            ? "FFDCFCE7"
            : row.asistio === "No"
              ? "FFFEF3C7"
              : "FFF1F5F9",
      },
    };
    asistioCell.alignment = { horizontal: "center", vertical: "middle" };
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAnyPermission(request, ["REPORTES_VER"]);
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

      const buffer = await buildExcel(rows, {
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
