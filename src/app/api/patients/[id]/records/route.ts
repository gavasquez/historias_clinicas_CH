import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const id = Number(resolvedParams.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "ID de paciente inválido" }, { status: 400 });
    }

    const historias = await prisma.historias_clinicas.findMany({
      where: { id_paciente: id },
      include: {
        tipos_historia_clinica: true,
        profesionales_salud: {
          include: {
            usuarios: true,
          },
        },
        atenciones_salud: {
          include: {
            tipos_atencion: true,
            modalidades_atencion: true,
          },
          orderBy: { fecha_hora: "desc" },
        },
      },
      orderBy: { fecha_apertura: "desc" },
    });

    const data = await Promise.all(
      historias.map(async (h) => {
        const attentionCount = h.atenciones_salud.length;
        const lastAttention = h.atenciones_salud[0] ?? null;

        let lastAttentionPrincipalCie10Codigo: string | null = null;
        let lastAttentionPrincipalCie10Nombre: string | null = null;

        if (lastAttention) {
          const principalDx = await prisma.diagnosticos_atencion.findFirst({
            where: {
              id_atencion: lastAttention.id_atencion,
              es_principal: true,
            },
            include: {
              cie10: true,
            },
          });

          if (principalDx) {
            lastAttentionPrincipalCie10Codigo = principalDx.codigo_cie10;
            lastAttentionPrincipalCie10Nombre = principalDx.cie10?.nombre ?? null;
          }
        }

        return {
          id_historia: h.id_historia,
          fecha_apertura: h.fecha_apertura.toISOString(),
          estado: h.estado,
          tipo_historia: h.tipos_historia_clinica.descripcion,
          profesional_responsable: h.profesionales_salud?.usuarios.nombre_completo ?? null,
          motivo_consulta: h.motivo_consulta ?? null,
          attention_count: attentionCount,
          last_attention_fecha_hora: lastAttention
            ? lastAttention.fecha_hora.toISOString()
            : null,
          last_attention_tipo: lastAttention?.tipos_atencion?.descripcion ?? null,
          last_attention_modalidad: lastAttention?.modalidades_atencion?.descripcion ?? null,
          last_attention_principal_cie10_codigo: lastAttentionPrincipalCie10Codigo,
          last_attention_principal_cie10_nombre: lastAttentionPrincipalCie10Nombre,
        };
      }),
    );

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching patient clinical records", error);
    return NextResponse.json({ message: "Error obteniendo historias clínicas" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await (context as any).params;
    const idPaciente = Number(resolvedParams.id);

    if (!Number.isInteger(idPaciente) || idPaciente <= 0) {
      return NextResponse.json({ message: "ID de paciente inválido" }, { status: 400 });
    }

    const body = await request.json();
    const {
      id_tipo_historia,
      id_profesional_responsable,
      motivo_consulta,
      enfermedad_actual,
      antecedentes_personales,
      antecedentes_familiares,
    } = body;

    const idTipoHistoriaNum = Number(id_tipo_historia);
    if (!Number.isInteger(idTipoHistoriaNum) || idTipoHistoriaNum <= 0) {
      return NextResponse.json(
        { message: "El tipo de historia clínica es obligatorio y debe ser un entero positivo" },
        { status: 400 },
      );
    }

    const historia = await prisma.historias_clinicas.create({
      data: {
        id_paciente: idPaciente,
        id_tipo_historia: idTipoHistoriaNum,
        id_profesional_responsable:
          id_profesional_responsable != null && String(id_profesional_responsable).trim() !== ""
            ? Number(id_profesional_responsable)
            : null,
        motivo_consulta: motivo_consulta ?? null,
        enfermedad_actual: enfermedad_actual ?? null,
        antecedentes_personales: antecedentes_personales ?? null,
        antecedentes_familiares: antecedentes_familiares ?? null,
      },
    });

    return NextResponse.json(historia, { status: 201 });
  } catch (error) {
    console.error("Error creating patient clinical record", error);
    return NextResponse.json(
      { message: "Error creando historia clínica" },
      { status: 500 },
    );
  }
}
