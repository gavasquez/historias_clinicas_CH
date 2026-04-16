import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.tipos_confirmacion_diagnostico.findMany({
      orderBy: { codigo: "asc" },
      select: {
        id_tipo_confirmacion: true,
        codigo: true,
        descripcion: true,
      },
    });

    const data = rows.map((r) => ({
      id_tipo_confirmacion: r.id_tipo_confirmacion,
      codigo: r.codigo,
      descripcion: r.descripcion,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching diagnosis confirmation types", error);
    return NextResponse.json(
      { message: "Error obteniendo tipos de confirmación de diagnóstico" },
      { status: 500 },
    );
  }
}
