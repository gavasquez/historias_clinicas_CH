import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyPermission } from "@/lib/auth";
import { readExportedDocument } from "@/lib/export-document-storage";

interface RouteContext {
  params: Promise<{ id: string; historyId: string; documentId: string }>;
}

async function getHistory(idPaciente: number, idHistoria: number) {
  return prisma.historias_clinicas.findFirst({
    where: { id_historia: idHistoria, id_paciente: idPaciente },
    select: { id_historia: true },
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAnyPermission(request, ["PACIENTES_VER"]);
    if (auth instanceof NextResponse) return auth;

    const { id, historyId, documentId } = await context.params;
    const idPaciente = Number(id);
    const idHistoria = Number(historyId);
    const idDocumento = Number(documentId);
    if (!Number.isInteger(idPaciente) || !Number.isInteger(idHistoria) || !Number.isInteger(idDocumento)) {
      return NextResponse.json({ message: "Identificador inválido" }, { status: 400 });
    }

    if (!(await getHistory(idPaciente, idHistoria))) {
      return NextResponse.json({ message: "Historia clínica no encontrada" }, { status: 404 });
    }

    const document = await prisma.documentos_exportados.findFirst({
      where: { id_exportacion: idDocumento, id_historia_clinica: idHistoria },
    });

    if (!document || !document.ruta) {
      return NextResponse.json({ message: "Documento exportado no encontrado" }, { status: 404 });
    }

    const buffer = await readExportedDocument(document.ruta);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.nombre_archivo)}"`,
      },
    });
  } catch (error) {
    console.error("Error downloading exported document", error);
    return NextResponse.json({ message: "Error descargando documento exportado" }, { status: 500 });
  }
}
