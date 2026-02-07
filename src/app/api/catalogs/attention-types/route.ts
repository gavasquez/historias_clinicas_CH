import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const tipos = await prisma.tipos_atencion.findMany({
      orderBy: { id_tipo_atencion: "asc" },
    });

    return NextResponse.json(
      tipos.map((t) => ({
        id_tipo_atencion: t.id_tipo_atencion,
        codigo: t.codigo,
        descripcion: t.descripcion,
      })),
    );
  } catch (error) {
    console.error("Error fetching attention types", error);
    return NextResponse.json(
      { message: "Error obteniendo tipos de atención" },
      { status: 500 },
    );
  }
}
