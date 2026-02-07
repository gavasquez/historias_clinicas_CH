import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const modalidades = await prisma.modalidades_atencion.findMany({
      orderBy: { id_modalidad_atencion: "asc" },
    });

    return NextResponse.json(
      modalidades.map((m) => ({
        id_modalidad_atencion: m.id_modalidad_atencion,
        codigo: m.codigo,
        descripcion: m.descripcion,
      })),
    );
  } catch (error) {
    console.error("Error fetching attention modalities", error);
    return NextResponse.json(
      { message: "Error obteniendo modalidades de atención" },
      { status: 500 },
    );
  }
}
