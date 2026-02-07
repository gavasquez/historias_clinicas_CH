import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function parseDateOnly(value: string | null): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
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
    const { searchParams } = new URL(request.url);

    const from = parseDateOnly(searchParams.get("from"));
    const to = parseDateOnly(searchParams.get("to"));

    const profesional = searchParams.get("profesional")?.trim() || "";
    const tipoAtencion = searchParams.get("tipo")?.trim() || "";
    const modalidad = searchParams.get("modalidad")?.trim() || "";
    const format = searchParams.get("format")?.trim().toLowerCase() || "json";

    const where: any = {
      ...(from || to
        ? {
            fecha_hora: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lt: new Date(to.getTime() + 24 * 60 * 60 * 1000) } : {}),
            },
          }
        : {}),
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
      ...(tipoAtencion
        ? {
            tipos_atencion: {
              codigo: tipoAtencion,
            },
          }
        : {}),
      ...(modalidad
        ? {
            modalidades_atencion: {
              codigo: modalidad,
            },
          }
        : {}),
    };

    const atenciones = await prisma.atenciones_salud.findMany({
      where,
      include: {
        profesionales_salud: {
          include: {
            usuarios: true,
          },
        },
        tipos_atencion: true,
        modalidades_atencion: true,
        historias_clinicas: {
          include: {
            pacientes: true,
          },
        },
        citas: {
          include: {
            sedes: true,
          },
        },
      },
      orderBy: {
        fecha_hora: "desc",
      },
      take: 2000,
    });

    const data = atenciones.map((row: (typeof atenciones)[number]) => ({
      id_atencion: row.id_atencion,
      fecha_hora: row.fecha_hora.toISOString(),
      id_historia: row.id_historia,
      id_cita: row.id_cita ?? null,
      paciente: `${row.historias_clinicas.pacientes.nombres} ${row.historias_clinicas.pacientes.apellidos}`.trim(),
      documento: row.historias_clinicas.pacientes.numero_documento,
      profesional: row.profesionales_salud?.usuarios.nombre_completo ?? "Sin profesional",
      tipo_codigo: row.tipos_atencion?.codigo ?? null,
      tipo: row.tipos_atencion?.descripcion ?? null,
      modalidad_codigo: row.modalidades_atencion?.codigo ?? null,
      modalidad: row.modalidades_atencion?.descripcion ?? null,
      sede: row.citas?.sedes?.nombre ?? null,
    }));

    const byTipo: Record<string, number> = {};
    const byModalidad: Record<string, number> = {};

    for (const row of data) {
      const tipoKey = row.tipo ?? "Sin tipo";
      byTipo[tipoKey] = (byTipo[tipoKey] ?? 0) + 1;

      const modKey = row.modalidad ?? "Sin modalidad";
      byModalidad[modKey] = (byModalidad[modKey] ?? 0) + 1;
    }

    const stats = {
      total: data.length,
      por_tipo: Object.entries(byTipo)
        .map(([tipo, total]) => ({ tipo, total }))
        .sort((a, b) => b.total - a.total),
      por_modalidad: Object.entries(byModalidad)
        .map(([modalidad, total]) => ({ modalidad, total }))
        .sort((a, b) => b.total - a.total),
    };

    if (format === "csv") {
      const csv = "\uFEFF" +
        toCsv(
        data.map((r) => ({
          id_atencion: r.id_atencion,
          fecha_hora: r.fecha_hora,
          paciente: r.paciente,
          documento: r.documento,
          profesional: r.profesional,
          tipo: r.tipo ?? "",
          modalidad: r.modalidad ?? "",
          sede: r.sede ?? "",
          id_historia: r.id_historia,
          id_cita: r.id_cita ?? "",
        })),
      );

      const today = new Date().toISOString().slice(0, 10);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=reportes_atenciones_${today}.csv`,
        },
      });
    }

    return NextResponse.json({ data, stats });
  } catch (error) {
    console.error("Error fetching attentions reports", error);
    return NextResponse.json({ message: "Error obteniendo reporte de atenciones" }, { status: 500 });
  }
}
