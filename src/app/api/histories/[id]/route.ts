import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const id = Number(resolvedParams.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "ID de historia inválido" }, { status: 400 });
    }

    const historia = await prisma.historias_clinicas.findUnique({
      where: { id_historia: id },
      include: {
        tipos_historia_clinica: true,
        profesionales_salud: {
          include: {
            usuarios: true,
          },
        },
        notas_evolucion_historia: {
          orderBy: { fecha_hora: "desc" },
          include: {
            tipos_atencion: true,
            modalidades_atencion: true,
            diagnosticos: {
              orderBy: { es_principal: "desc" },
              include: { cie10: true },
            },
          },
        },
        atenciones_salud: {
          orderBy: { fecha_hora: "desc" },
          include: {
            tipos_atencion: true,
            modalidades_atencion: true,
            citas: {
              include: {
                estados_cita: true,
              },
            },
            hc_anamnesis_atencion: true,
            hc_antecedentes_atencion: true,
            hc_antecedentes_traumaticos_atencion: true,
            hc_atencion_cierre: true,
            hc_ssr_atencion: true,
            hc_tamizajes_atencion: true,
            hc_examen_fisico_atencion: true,
            hc_valoracion_sistemas_atencion: true,
            diagnosticos_atencion: {
              orderBy: { es_principal: "desc" },
              include: {
                cie10: true,
              },
            },
          },
        },
      },
    });

    if (!historia) {
      return NextResponse.json({ message: "Historia clínica no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ data: historia });
  } catch (error) {
    console.error("Error fetching clinical history detail", error);
    return NextResponse.json(
      { message: "Error obteniendo detalle de historia clínica" },
      { status: 500 },
    );
  }
}
