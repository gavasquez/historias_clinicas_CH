import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { endOfDayInZone, parseDateInZoneToUtc } from "@/lib/date-time";

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

function toCsv(rows: Record<string, unknown>[]) {
  const escape = (value: unknown) => {
    const str = value == null ? "" : String(value);
    const needsQuotes = /[\n\r,\"]/g.test(str);
    const escaped = str.replace(/\"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const headers = Object.keys(rows[0] ?? {});
  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(headers.map((h) => escape((row as any)[h])).join(","));
  }

  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);

    const dateRange = parseDateRange({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });

    const profesional = searchParams.get("profesional")?.trim() || "";
    const estadoCodigo = searchParams.get("estado")?.trim() || "";
    const tipoCodigo = searchParams.get("tipo")?.trim() || "";
    const format = searchParams.get("format")?.trim().toLowerCase() || "json";

    const where: any = {
      ...(dateRange ? { fecha_hora_inicio: dateRange } : {}),
      ...(profesional
        ? {
            profesionales_salud: {
              usuarios: {
                nombre_completo: {
                  contains: profesional,
                  mode: "insensitive",
                },
              },
            },
          }
        : {}),
      ...(estadoCodigo
        ? {
            estados_cita: {
              codigo: estadoCodigo,
            },
          }
        : {}),
      ...(tipoCodigo
        ? {
            tipos_cita: {
              codigo: tipoCodigo,
            },
          }
        : {}),
    };

    const citas = await prisma.citas.findMany({
      where,
      include: {
        pacientes: true,
        profesionales_salud: {
          include: {
            usuarios: true,
          },
        },
        tipos_cita: true,
        estados_cita: true,
        sedes: true,
      },
      orderBy: {
        fecha_hora_inicio: "desc",
      },
      take: 2000,
    });

    const data = citas.map((cita: (typeof citas)[number]) => ({
      id_cita: cita.id_cita,
      fecha_hora_inicio: cita.fecha_hora_inicio.toISOString(),
      fecha_hora_fin: cita.fecha_hora_fin ? cita.fecha_hora_fin.toISOString() : null,
      paciente: `${cita.pacientes.nombres} ${cita.pacientes.apellidos}`.trim(),
      documento: cita.pacientes.numero_documento,
      profesional: cita.profesionales_salud.usuarios.nombre_completo,
      sede: cita.sedes?.nombre ?? null,
      estado_codigo: cita.estados_cita?.codigo ?? null,
      estado: cita.estados_cita?.descripcion ?? null,
      tipo_codigo: cita.tipos_cita?.codigo ?? null,
      tipo: cita.tipos_cita?.descripcion ?? null,
    }));

    const byEstado: Record<string, number> = {};
    const byEstadoCodigo: Record<string, number> = {};
    for (const row of data) {
      const key = row.estado ?? "Sin estado";
      byEstado[key] = (byEstado[key] ?? 0) + 1;

      const codeKey = row.estado_codigo ?? "SIN_ESTADO";
      byEstadoCodigo[codeKey] = (byEstadoCodigo[codeKey] ?? 0) + 1;
    }

    const resumen_codigos = {
      PROGRAMADA: byEstadoCodigo["PROGRAMADA"] ?? 0,
      REALIZADA: byEstadoCodigo["REALIZADA"] ?? 0,
      CANCELADA_INST: byEstadoCodigo["CANCELADA_INST"] ?? 0,
      CANCELADA_PAC: byEstadoCodigo["CANCELADA_PAC"] ?? 0,
      NO_ASISTE: byEstadoCodigo["NO_ASISTE"] ?? 0,
    };

    const stats = {
      total: data.length,
      resumen_codigos,
      por_estado: Object.entries(byEstado)
        .map(([estado, total]) => ({ estado, total }))
        .sort((a, b) => b.total - a.total),
    };

    if (format === "csv") {
      const csv = "\uFEFF" +
        toCsv(
        data.map((row) => ({
          id_cita: row.id_cita,
          fecha_hora_inicio: row.fecha_hora_inicio,
          fecha_hora_fin: row.fecha_hora_fin ?? "",
          paciente: row.paciente,
          documento: row.documento,
          profesional: row.profesional,
          sede: row.sede ?? "",
          estado: row.estado ?? "",
          tipo: row.tipo ?? "",
        })),
      );

      const today = new Date().toISOString().slice(0, 10);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=reportes_citas_${today}.csv`,
        },
      });
    }

    return NextResponse.json({
      data,
      stats,
    });
  } catch (error) {
    console.error("Error fetching appointment reports", error);
    return NextResponse.json({ message: "Error obteniendo reporte de citas" }, { status: 500 });
  }
}
