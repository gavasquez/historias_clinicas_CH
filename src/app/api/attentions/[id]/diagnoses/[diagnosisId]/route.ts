import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; diagnosisId: string }> | { id: string; diagnosisId: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const idAtencion = Number(resolvedParams.id);
    const idDiagnostico = Number(resolvedParams.diagnosisId);

    if (!Number.isInteger(idAtencion) || idAtencion <= 0) {
      return NextResponse.json({ message: "ID de atención inválido" }, { status: 400 });
    }

    if (!Number.isInteger(idDiagnostico) || idDiagnostico <= 0) {
      return NextResponse.json({ message: "ID de diagnóstico inválido" }, { status: 400 });
    }

    const body = await request.json();
    const {
      id_tipo_confirmacion,
      codigo_confirmacion,
      es_principal,
    }: {
      id_tipo_confirmacion?: number | null;
      codigo_confirmacion?: string | null;
      es_principal?: boolean | null;
    } = body;

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

    const existing = await prisma.diagnosticos_atencion.findFirst({
      where: { id_diagnostico: idDiagnostico, id_atencion: idAtencion },
      select: { id_diagnostico: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Diagnóstico no encontrado" }, { status: 404 });
    }

    const diag = await prisma.$transaction(async (tx) => {
      const shouldUpdatePrincipal = typeof es_principal === "boolean";

      if (shouldUpdatePrincipal && es_principal === true) {
        await tx.diagnosticos_atencion.updateMany({
          where: { id_atencion: idAtencion, id_diagnostico: { not: idDiagnostico } },
          data: { es_principal: false },
        });
      }

      return tx.diagnosticos_atencion.update({
        where: { id_diagnostico: idDiagnostico },
        data: {
          ...(resolvedConfirmacionId !== undefined ? { id_tipo_confirmacion: resolvedConfirmacionId } : {}),
          ...(shouldUpdatePrincipal ? { es_principal: es_principal === true } : {}),
        },
        include: {
          cie10: true,
          tipos_confirmacion_diagnostico: true,
        },
      });
    });

    return NextResponse.json({
      id_diagnostico: diag.id_diagnostico,
      id_atencion: diag.id_atencion,
      codigo_cie10: diag.codigo_cie10,
      es_principal: diag.es_principal,
      id_tipo_confirmacion: diag.id_tipo_confirmacion,
      cie10_nombre: diag.cie10.nombre,
      cie10_descripcion: diag.cie10.descripcion,
      tipo_confirmacion: diag.tipos_confirmacion_diagnostico?.descripcion ?? null,
    });
  } catch (error) {
    console.error("Error updating attention diagnosis", error);
    return NextResponse.json(
      { message: "Error actualizando diagnóstico de la atención" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; diagnosisId: string }> | { id: string; diagnosisId: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const idAtencion = Number(resolvedParams.id);
    const idDiagnostico = Number(resolvedParams.diagnosisId);

    if (!Number.isInteger(idAtencion) || idAtencion <= 0) {
      return NextResponse.json({ message: "ID de atención inválido" }, { status: 400 });
    }

    if (!Number.isInteger(idDiagnostico) || idDiagnostico <= 0) {
      return NextResponse.json({ message: "ID de diagnóstico inválido" }, { status: 400 });
    }

    const existing = await prisma.diagnosticos_atencion.findFirst({
      where: { id_diagnostico: idDiagnostico, id_atencion: idAtencion },
      select: { id_diagnostico: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Diagnóstico no encontrado" }, { status: 404 });
    }

    await prisma.diagnosticos_atencion.delete({
      where: { id_diagnostico: idDiagnostico },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting attention diagnosis", error);
    return NextResponse.json(
      { message: "Error eliminando diagnóstico de la atención" },
      { status: 500 },
    );
  }
}
