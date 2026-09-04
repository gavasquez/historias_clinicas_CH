import path from "path";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyPermission } from "@/lib/auth";
import {
  ALLOWED_HISTORY_DOCUMENT_FILES,
  HISTORY_DOCUMENT_ENTITY,
  MAX_HISTORY_DOCUMENT_SIZE,
  isHistoryDocumentType,
} from "@/lib/patient-documents";
import {
  removeHistoryDocument,
  storeHistoryDocument,
} from "@/lib/history-document-storage";

interface RouteContext {
  params: Promise<{ id: string; historyId: string }>;
}

async function getHistory(idPaciente: number, idHistoria: number) {
  return prisma.historias_clinicas.findFirst({
    where: { id_historia: idHistoria, id_paciente: idPaciente },
    select: { id_historia: true },
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
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

  const documents = await prisma.archivos_adjuntos.findMany({
    where: {
      entidad: HISTORY_DOCUMENT_ENTITY,
      id_entidad: idHistoria,
      tipo_documento: { not: null },
    },
    include: { usuarios: { select: { nombre_completo: true } } },
    orderBy: { fecha_subida: "desc" },
  });

  return NextResponse.json({
    data: documents.map((document) => ({
      id_archivo: document.id_archivo,
      tipo_documento: document.tipo_documento,
      nombre_archivo: document.nombre_archivo,
      extension: document.extension,
      tipo_mime: document.tipo_mime,
      tamano_bytes: document.tamano_bytes?.toString() ?? null,
      fecha_subida: document.fecha_subida,
      usuario: document.usuarios?.nombre_completo ?? null,
    })),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireAnyPermission(request, ["PACIENTES_EDITAR"]);
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
  const tipoDocumento = String(formData.get("tipo_documento") ?? "");
  const replace = formData.get("replace") === "true";
  const fileValue = formData.get("file");

  if (!isHistoryDocumentType(tipoDocumento)) {
    return NextResponse.json({ message: "Tipo de documento no permitido" }, { status: 400 });
  }
  if (!(fileValue instanceof File)) {
    return NextResponse.json({ message: "Debe seleccionar un archivo" }, { status: 400 });
  }
  if (fileValue.size === 0) {
    return NextResponse.json({ message: "El archivo está vacío" }, { status: 400 });
  }
  if (fileValue.size > MAX_HISTORY_DOCUMENT_SIZE) {
    return NextResponse.json({ message: "El archivo supera el límite de 10 MB" }, { status: 400 });
  }
  if (fileValue.name.length > 255) {
    return NextResponse.json({ message: "El nombre del archivo es demasiado largo" }, { status: 400 });
  }

  const extension = path.extname(fileValue.name).toLowerCase();
  const allowedMimes = ALLOWED_HISTORY_DOCUMENT_FILES[
    extension as keyof typeof ALLOWED_HISTORY_DOCUMENT_FILES
  ] as readonly string[] | undefined;
  if (!allowedMimes || !allowedMimes.includes(fileValue.type)) {
    return NextResponse.json(
      { message: "Solo se permiten archivos PDF, XLS o XLSX válidos" },
      { status: 400 },
    );
  }

  const existing = await prisma.archivos_adjuntos.findFirst({
    where: {
      entidad: HISTORY_DOCUMENT_ENTITY,
      id_entidad: idHistoria,
      tipo_documento: tipoDocumento,
    },
  });
  if (existing && !replace) {
    return NextResponse.json(
      { message: "Ya existe un documento de este tipo", code: "DOCUMENT_EXISTS" },
      { status: 409 },
    );
  }

  const bytes = new Uint8Array(await fileValue.arrayBuffer());
  const signatureValid =
    (extension === ".pdf" && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-") ||
    (extension === ".xls" && bytes.slice(0, 4).every((value, index) => value === [0xd0, 0xcf, 0x11, 0xe0][index])) ||
    (extension === ".xlsx" && bytes[0] === 0x50 && bytes[1] === 0x4b);
  if (!signatureValid) {
    return NextResponse.json(
      { message: "El contenido del archivo no corresponde con su extensión" },
      { status: 400 },
    );
  }

  const storageKey = await storeHistoryDocument(idHistoria, extension, bytes);
  try {
    const document = await prisma.$transaction(async (tx) => {
      const data = {
        nombre_archivo: fileValue.name,
        ruta: storageKey,
        extension,
        tipo_mime: fileValue.type || "application/octet-stream",
        tamano_bytes: BigInt(fileValue.size),
        id_usuario_subio: Number(auth.user.id),
        fecha_subida: new Date(),
      };
      const saved = existing
        ? await tx.archivos_adjuntos.update({ where: { id_archivo: existing.id_archivo }, data })
        : await tx.archivos_adjuntos.create({
            data: {
              entidad: HISTORY_DOCUMENT_ENTITY,
              id_entidad: idHistoria,
              tipo_documento: tipoDocumento,
              ...data,
            },
          });

      await tx.auditoria.create({
        data: {
          id_usuario: Number(auth.user.id),
          tabla: "archivos_adjuntos",
          id_registro: String(saved.id_archivo),
          accion: existing ? "REPLACE_DOCUMENT" : "UPLOAD_DOCUMENT",
          detalle: JSON.stringify({ id_paciente: idPaciente, id_historia: idHistoria, tipo_documento: tipoDocumento }),
        },
      });
      return saved;
    });

    if (existing?.ruta && existing.ruta !== storageKey) {
      await removeHistoryDocument(existing.ruta);
    }
    return NextResponse.json({ message: "Documento cargado correctamente", id_archivo: document.id_archivo });
  } catch (error) {
    await removeHistoryDocument(storageKey);
    console.error("Error uploading history document", error);
    return NextResponse.json({ message: "No se pudo almacenar el documento" }, { status: 500 });
  }
}
