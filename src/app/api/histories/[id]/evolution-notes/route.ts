import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function normalizeOptionalInt(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function normalizeOptionalDate(input: unknown): Date | null {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const prismaAny = prisma as any;
    const resolvedParams = await (context as any).params;
    const historyId = Number(resolvedParams.id);

    if (!Number.isInteger(historyId) || historyId <= 0) {
      return NextResponse.json({ message: "ID de historia inválido" }, { status: 400 });
    }

    const rows = await prismaAny.notas_evolucion_historia.findMany({
      where: { id_historia: historyId },
      orderBy: { fecha_hora: "desc" },
      include: {
        tipos_atencion: true,
        modalidades_atencion: true,
        diagnosticos: {
          orderBy: { es_principal: "desc" },
          include: { cie10: true },
        },
      },
    });

    const data = (rows as any[]).map((n: any) => ({
      id_nota_evolucion: n.id_nota_evolucion,
      id_historia: n.id_historia,
      fecha_hora: n.fecha_hora.toISOString(),
      id_tipo_atencion: n.id_tipo_atencion,
      tipo_atencion: n.tipos_atencion?.descripcion ?? null,
      id_modalidad_atencion: n.id_modalidad_atencion,
      modalidad_atencion: n.modalidades_atencion?.descripcion ?? null,
      nota_atencion: n.nota_atencion ?? null,
      analisis: n.analisis ?? null,
      plan_manejo: n.plan_manejo ?? null,
      diagnosticos: (n.diagnosticos ?? []).map((d: any) => ({
        id_nota_dx: d.id_nota_dx,
        codigo_cie10: d.codigo_cie10,
        es_principal: d.es_principal,
        cie10_nombre: d.cie10?.nombre ?? null,
      })),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching evolution notes", error);
    return NextResponse.json({ message: "Error obteniendo notas de evolución" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const prismaAny = prisma as any;
    const resolvedParams = await (context as any).params;
    const historyId = Number(resolvedParams.id);

    if (!Number.isInteger(historyId) || historyId <= 0) {
      return NextResponse.json({ message: "ID de historia inválido" }, { status: 400 });
    }

    const body = await request.json();
    const {
      id_tipo_atencion,
      id_modalidad_atencion,
      fecha_hora,
      nota_atencion,
      analisis,
      plan_manejo,
      diagnosticos,
    } = body ?? {};

    const idTipoAtencion = normalizeOptionalInt(id_tipo_atencion);
    const idModalidadAtencion = normalizeOptionalInt(id_modalidad_atencion);
    const fechaHora = normalizeOptionalDate(fecha_hora);

    const notaAtencionTrim = String(nota_atencion ?? "").trim();
    const analisisTrim = String(analisis ?? "").trim();
    const planManejoTrim = String(plan_manejo ?? "").trim();

    if (!idTipoAtencion) {
      return NextResponse.json({ message: "El tipo de atención es obligatorio" }, { status: 400 });
    }

    if (!idModalidadAtencion) {
      return NextResponse.json(
        { message: "La modalidad de atención es obligatoria" },
        { status: 400 },
      );
    }

    if (!notaAtencionTrim) {
      return NextResponse.json({ message: "La nota de atención es obligatoria" }, { status: 400 });
    }

    if (!analisisTrim) {
      return NextResponse.json({ message: "La observación / análisis es obligatoria" }, { status: 400 });
    }

    if (!planManejoTrim) {
      return NextResponse.json({ message: "El plan de manejo es obligatorio" }, { status: 400 });
    }

    const diagnosticosArray = Array.isArray(diagnosticos) ? diagnosticos : [];
    const diagnosticosCreateRaw = diagnosticosArray
      .map((d: any) => {
        const codigo = String(d?.codigo_cie10 ?? "").trim();
        if (!codigo) return null;
        const esPrincipal = d?.es_principal === true;
        return { codigo_cie10: codigo, es_principal: esPrincipal };
      })
      .filter(Boolean) as Array<{ codigo_cie10: string; es_principal: boolean }>;

    if (diagnosticosCreateRaw.length === 0) {
      return NextResponse.json({ message: "Debe agregar al menos un diagnóstico" }, { status: 400 });
    }

    const found = await prisma.cie10.findMany({
      where: { codigo: { in: [...new Set(diagnosticosCreateRaw.map((d) => d.codigo_cie10))] } },
      select: { codigo: true },
    });
    const foundSet = new Set(found.map((f) => f.codigo));
    const missing = diagnosticosCreateRaw
      .map((d) => d.codigo_cie10)
      .filter((c) => !foundSet.has(c));
    if (missing.length > 0) {
      return NextResponse.json(
        { message: `Códigos CIE-10 inválidos: ${[...new Set(missing)].join(", ")}` },
        { status: 400 },
      );
    }

    const diagnosticosCreate = (() => {
      const idx = diagnosticosCreateRaw.findIndex((d) => d.es_principal);
      if (idx < 0) return diagnosticosCreateRaw;
      return diagnosticosCreateRaw.map((d, i) => ({ ...d, es_principal: i === idx }));
    })();

    const created = await prismaAny.notas_evolucion_historia.create({
      data: {
        id_historia: historyId,
        id_tipo_atencion: idTipoAtencion,
        id_modalidad_atencion: idModalidadAtencion,
        ...(fechaHora ? { fecha_hora: fechaHora } : {}),
        nota_atencion: notaAtencionTrim,
        analisis: analisisTrim,
        plan_manejo: planManejoTrim,
        diagnosticos: {
          create: diagnosticosCreate,
        },
      },
      include: {
        diagnosticos: {
          orderBy: { es_principal: "desc" },
          include: { cie10: true },
        },
      },
    });

    return NextResponse.json(
      {
        data: {
          id_nota_evolucion: created.id_nota_evolucion,
          id_historia: created.id_historia,
          fecha_hora: created.fecha_hora.toISOString(),
          nota_atencion: created.nota_atencion ?? null,
          analisis: created.analisis ?? null,
          plan_manejo: created.plan_manejo ?? null,
          diagnosticos: (created.diagnosticos ?? []).map((d: any) => ({
            id_nota_dx: d.id_nota_dx,
            codigo_cie10: d.codigo_cie10,
            es_principal: d.es_principal,
            cie10_nombre: d.cie10?.nombre ?? null,
          })),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating evolution note", error);
    return NextResponse.json({ message: "Error creando nota de evolución" }, { status: 500 });
  }
}
