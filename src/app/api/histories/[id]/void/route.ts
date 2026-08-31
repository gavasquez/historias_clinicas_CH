import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const resolvedParams = await (context as any).params;
    const idHistoria = Number(resolvedParams.id);

    if (!Number.isInteger(idHistoria) || idHistoria <= 0) {
      return NextResponse.json({ message: "ID de historia inválido" }, { status: 400 });
    }

    const { reason, confirm } = await request.json();

    const reasonStr = typeof reason === "string" ? reason.trim() : "";
    if (!reasonStr || reasonStr.length < 10 || reasonStr.length > 500) {
      return NextResponse.json(
        { message: "El motivo es obligatorio (10 a 500 caracteres)" },
        { status: 400 },
      );
    }

    if (confirm !== "ANULAR") {
      return NextResponse.json(
        { message: 'Debe confirmar escribiendo "ANULAR"' },
        { status: 400 },
      );
    }

    // Cargar historia con info de responsable
    const historia = await prisma.historias_clinicas.findUnique({
      where: { id_historia: idHistoria },
      include: {
        profesionales_salud: {
          include: {
            usuarios: true,
          },
        },
      },
    });

    if (!historia) {
      return NextResponse.json({ message: "Historia clínica no encontrada" }, { status: 404 });
    }

    // Validar estado actual Finalizado
    const estadoActual = String(historia.estado ?? "").trim().toLowerCase();
    if (estadoActual !== "finalizado") {
      return NextResponse.json(
        { message: "Solo se pueden anular historias en estado Finalizado" },
        { status: 409 },
      );
    }

    // Permisos: super_admin/administrador o responsable dentro de ventana de 72h
    const roleName = auth.user.role;
    const userId = Number(auth.user.id);

    const isAdmin = roleName === "super_admin" || roleName === "administrador";
    const isResponsible = Number(historia?.profesionales_salud?.usuarios?.id_usuario) === userId
      || Number(historia?.profesionales_salud?.id_usuario) === userId;

    // Ventana de tiempo (72 horas desde fecha_apertura)
    const ventanaHoras = 72;
    const apertura = historia.fecha_apertura ? new Date(historia.fecha_apertura) : null;
    const dentroDeVentana = apertura ? (Date.now() - apertura.getTime()) <= ventanaHoras * 3600 * 1000 : false;

    if (!isAdmin && !(isResponsible && dentroDeVentana)) {
      return NextResponse.json(
        { message: "No tiene permisos para anular este folio o la ventana de tiempo expiró" },
        { status: 403 },
      );
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
    const userAgent = request.headers.get("user-agent") || "";

    // Actualizar historia a estado Anulado
    const updated = await prisma.historias_clinicas.update({
      where: { id_historia: idHistoria },
      data: {
        previous_status: historia.estado ?? null,
        estado: "Anulado",
        voided_at: new Date(),
        voided_by: userId || null,
        void_reason: reasonStr,
        void_ip: ip,
        void_user_agent: userAgent,
      },
    });

    // Registrar auditoría
    await prisma.auditoria.create({
      data: {
        id_usuario: userId || null,
        tabla: "historias_clinicas",
        id_registro: String(idHistoria),
        accion: "VOID_HISTORY",
        detalle: `Anulación de historia clínica. Estado: ${historia.estado} -> Anulado. Motivo: ${reasonStr}`,
      },
    });

    return NextResponse.json({ data: updated, message: "Folio anulado correctamente" });
  } catch (error) {
    console.error("Error voiding history", error);
    return NextResponse.json({ message: "Error anulando historia clínica" }, { status: 500 });
  }
}
