import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const tipos = await prisma.tipos_historia_clinica.findMany({
      orderBy: { id_tipo_historia: "asc" },
    });

    return NextResponse.json(
      tipos.map((t) => ({
        id_tipo_historia: t.id_tipo_historia,
        codigo: t.codigo,
        descripcion: t.descripcion,
      })),
    );
  } catch (error) {
    console.error("Error fetching history types", error);
    return NextResponse.json(
      { message: "Error obteniendo tipos de historia clínica" },
      { status: 500 },
    );
  }
}
