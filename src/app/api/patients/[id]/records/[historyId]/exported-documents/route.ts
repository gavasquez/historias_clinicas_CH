import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyPermission } from "@/lib/auth";
import { storeExportedDocument } from "@/lib/export-document-storage";

interface RouteContext {
  params: Promise<{ id: string; historyId: string }>;
}

const EXPORTED_DOCUMENT_TYPES = ["indicaciones-medicas", "referencia-pacientes"] as const;
type ExportedDocumentType = (typeof EXPORTED_DOCUMENT_TYPES)[number];

function isExportedDocumentType(value: string): value is ExportedDocumentType {
  return EXPORTED_DOCUMENT_TYPES.includes(value as ExportedDocumentType);
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

    const { id, historyId } = await context.params;
    const idPaciente = Number(id);
    const idHistoria = Number(historyId);
    if (!Number.isInteger(idPaciente) || !Number.isInteger(idHistoria)) {
      return NextResponse.json({ message: "Identificador inválido" }, { status: 400 });
    }

    if (!(await getHistory(idPaciente, idHistoria))) {
      return NextResponse.json({ message: "Historia clínica no encontrada" }, { status: 404 });
    }

    const exports = await prisma.documentos_exportados.findMany({
      where: { id_historia_clinica: idHistoria },
      include: { usuarios: { select: { nombre_completo: true } } },
      orderBy: { fecha_exportacion: "desc" },
    });

    return NextResponse.json({
      data: exports.map((exp) => ({
        id_exportacion: exp.id_exportacion,
        id_historia_clinica: exp.id_historia_clinica,
        id_atencion: exp.id_atencion,
        id_usuario_exporto: exp.id_usuario_exporto,
        tipo_documento: exp.tipo_documento,
        nombre_archivo: exp.nombre_archivo,
        ruta: exp.ruta ?? null,
        tamano_bytes: exp.tamano_bytes?.toString() ?? null,
        fecha_exportacion: exp.fecha_exportacion,
        usuario: exp.usuarios?.nombre_completo ?? null,
      })),
    });
  } catch (error) {
    console.error("Error fetching exported documents", error);
    return NextResponse.json({ message: "Error consultando documentos exportados" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAnyPermission(request, ["PACIENTES_VER"]);
    if (auth instanceof NextResponse) return auth;

    const { id, historyId } = await context.params;
    const idPaciente = Number(id);
    const idHistoria = Number(historyId);
    if (!Number.isInteger(idPaciente) || !Number.isInteger(idHistoria)) {
      return NextResponse.json({ message: "Identificador inválido" }, { status: 400 });
    }

    if (!(await getHistory(idPaciente, idHistoria))) {
      return NextResponse.json({ message: "Historia clínica no encontrada" }, { status: 404 });
    }

    const formData = await request.formData();
    const tipo_documento = String(formData.get("tipo_documento") ?? "");
    const id_atencion = formData.get("id_atencion");
    const nombre_archivo = String(formData.get("nombre_archivo") ?? "");
    const fileValue = formData.get("file");

    if (!isExportedDocumentType(tipo_documento)) {
      return NextResponse.json({ message: "Tipo de documento no válido" }, { status: 400 });
    }

    if (!(fileValue instanceof File) || fileValue.size === 0) {
      return NextResponse.json({ message: "Debe adjuntar el archivo PDF generado" }, { status: 400 });
    }

    if (fileValue.type !== "application/pdf") {
      return NextResponse.json({ message: "Solo se permiten archivos PDF" }, { status: 400 });
    }

    const idAtencionNum = Number(id_atencion);
    const safeFilename = String(nombre_archivo || `${tipo_documento}_${idHistoria}.pdf`).slice(0, 255);
    const bytes = new Uint8Array(await fileValue.arrayBuffer());
    const storageKey = await storeExportedDocument(idHistoria, ".pdf", bytes);

    const exportData = {
      id_historia_clinica: idHistoria,
      id_usuario_exporto: Number(auth.user.id),
      tipo_documento: tipo_documento,
      nombre_archivo: safeFilename,
      ruta: storageKey,
      tamano_bytes: BigInt(fileValue.size),
      ...(Number.isInteger(idAtencionNum) && idAtencionNum > 0 ? { id_atencion: idAtencionNum } : {}),
    };

    const created = await prisma.documentos_exportados.create({
      data: exportData,
      include: { usuarios: { select: { nombre_completo: true } } },
    });

    return NextResponse.json({
      message: "Documento exportado registrado correctamente",
      data: {
        id_exportacion: created.id_exportacion,
        id_historia_clinica: created.id_historia_clinica,
        id_atencion: created.id_atencion,
        id_usuario_exporto: created.id_usuario_exporto,
        tipo_documento: created.tipo_documento,
        nombre_archivo: created.nombre_archivo,
        ruta: created.ruta,
        tamano_bytes: created.tamano_bytes?.toString() ?? null,
        fecha_exportacion: created.fecha_exportacion,
        usuario: created.usuarios?.nombre_completo ?? null,
      },
    });
  } catch (error) {
    console.error("Error registering exported document", error);
    return NextResponse.json({ message: "Error registrando documento exportado" }, { status: 500 });
  }
}
