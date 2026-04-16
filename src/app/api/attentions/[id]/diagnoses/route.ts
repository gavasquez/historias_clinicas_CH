import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const idAtencion = Number(resolvedParams.id);

    if (!Number.isInteger(idAtencion) || idAtencion <= 0) {
      return NextResponse.json({ message: "ID de atención inválido" }, { status: 400 });
    }

    const diagnosticos = await prisma.diagnosticos_atencion.findMany({
      where: { id_atencion: idAtencion },
      include: {
        cie10: true,
        tipos_confirmacion_diagnostico: true,
      },
      orderBy: [
        { es_principal: "desc" },
        { id_diagnostico: "asc" },
      ],
    });

    const data = diagnosticos.map((d) => ({
      id_diagnostico: d.id_diagnostico,
      id_atencion: d.id_atencion,
      codigo_cie10: d.codigo_cie10,
      es_principal: d.es_principal,
      id_tipo_confirmacion: d.id_tipo_confirmacion,
      cie10_nombre: d.cie10.nombre,
      cie10_descripcion: d.cie10.descripcion,
      tipo_confirmacion: d.tipos_confirmacion_diagnostico?.descripcion ?? null,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching attention diagnoses", error);
    return NextResponse.json(
      { message: "Error obteniendo diagnósticos de la atención" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const idAtencion = Number(resolvedParams.id);

    if (!Number.isInteger(idAtencion) || idAtencion <= 0) {
      return NextResponse.json({ message: "ID de atención inválido" }, { status: 400 });
    }

    const body = await request.json();
    const {
      codigo_cie10,
      es_principal,
      id_tipo_confirmacion,
      codigo_confirmacion,
    }: {
      codigo_cie10: string;
      es_principal?: boolean;
      id_tipo_confirmacion?: number | null;
      codigo_confirmacion?: string | null;
    } = body;

    if (!codigo_cie10 || typeof codigo_cie10 !== "string") {
      return NextResponse.json(
        { message: "El código CIE-10 es obligatorio" },
        { status: 400 },
      );
    }

    // Validar que exista el código en el catálogo CIE-10
    const cie = await prisma.cie10.findUnique({ where: { codigo: codigo_cie10 } });
    if (!cie) {
      return NextResponse.json(
        { message: "El código CIE-10 indicado no existe en el catálogo" },
        { status: 400 },
      );
    }

    // Si se marca como principal, desmarcar otros principales de la misma atención
    if (es_principal) {
      await prisma.diagnosticos_atencion.updateMany({
        where: { id_atencion: idAtencion, es_principal: true },
        data: { es_principal: false },
      });
    }

    const codigoConfirmacionTrim = String(codigo_confirmacion ?? "")
      .trim()
      .toUpperCase();
    const idTipoConfirmacionNum =
      id_tipo_confirmacion === null || id_tipo_confirmacion === undefined
        ? null
        : Number(id_tipo_confirmacion);

    const resolvedConfirmacionId = await (async () => {
      if (Number.isInteger(idTipoConfirmacionNum) && (idTipoConfirmacionNum as number) > 0) {
        return idTipoConfirmacionNum as number;
      }

      if (
        codigoConfirmacionTrim !== "CN" &&
        codigoConfirmacionTrim !== "CR" &&
        codigoConfirmacionTrim !== "ID"
      ) {
        return null;
      }

      const found = await prisma.tipos_confirmacion_diagnostico.findUnique({
        where: { codigo: codigoConfirmacionTrim },
        select: { id_tipo_confirmacion: true },
      });
      return found?.id_tipo_confirmacion ?? null;
    })();

    const diag = await prisma.diagnosticos_atencion.create({
      data: {
        id_atencion: idAtencion,
        codigo_cie10,
        es_principal: !!es_principal,
        id_tipo_confirmacion: resolvedConfirmacionId,
      },
      include: {
        cie10: true,
        tipos_confirmacion_diagnostico: true,
      },
    });

    return NextResponse.json(
      {
        id_diagnostico: diag.id_diagnostico,
        id_atencion: diag.id_atencion,
        codigo_cie10: diag.codigo_cie10,
        es_principal: diag.es_principal,
        id_tipo_confirmacion: diag.id_tipo_confirmacion,
        cie10_nombre: diag.cie10.nombre,
        cie10_descripcion: diag.cie10.descripcion,
        tipo_confirmacion: diag.tipos_confirmacion_diagnostico?.descripcion ?? null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating attention diagnosis", error);
    return NextResponse.json(
      { message: "Error registrando diagnóstico de la atención" },
      { status: 500 },
    );
  }
}
