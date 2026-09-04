import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyPermission } from "@/lib/auth";
import { readHistoryDocument } from "@/lib/history-document-storage";
import { HISTORY_DOCUMENT_ENTITY } from "@/lib/patient-documents";

interface RouteContext {
  params: Promise<{ id: string; historyId: string; documentId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAnyPermission(request, ["PACIENTES_VER"]);
  if (auth instanceof NextResponse) return auth;

  const { id, historyId, documentId } = await context.params;
  const idPaciente = Number(id);
  const idHistoria = Number(historyId);
  const idArchivo = Number(documentId);
  if (![idPaciente, idHistoria, idArchivo].every(Number.isInteger)) {
    return NextResponse.json({ message: "Identificador inválido" }, { status: 400 });
  }

  const history = await prisma.historias_clinicas.findFirst({
    where: { id_historia: idHistoria, id_paciente: idPaciente },
    select: { id_historia: true },
  });
  if (!history) {
    return NextResponse.json({ message: "Historia clínica no encontrada" }, { status: 404 });
  }

  const document = await prisma.archivos_adjuntos.findFirst({
    where: {
      id_archivo: idArchivo,
      entidad: HISTORY_DOCUMENT_ENTITY,
      id_entidad: idHistoria,
      tipo_documento: { not: null },
    },
  });
  if (!document) {
    return NextResponse.json({ message: "Documento no encontrado" }, { status: 404 });
  }

  try {
    const buffer = await readHistoryDocument(document.ruta);
    const fallbackName = document.nombre_archivo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": document.tipo_mime || "application/octet-stream",
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(document.nombre_archivo)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return NextResponse.json({ message: "El archivo almacenado no está disponible" }, { status: 404 });
    }
    console.error("Error downloading history document", error);
    return NextResponse.json({ message: "No se pudo descargar el documento" }, { status: 500 });
  }
}
