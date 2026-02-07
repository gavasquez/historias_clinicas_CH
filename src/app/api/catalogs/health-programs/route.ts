import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.programas_salud.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: {
        id_programa_salud: true,
        nombre: true,
        descripcion: true,
        activo: true,
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching health programs", error);
    return NextResponse.json(
      { message: "Error obteniendo programas de salud" },
      { status: 500 },
    );
  }
}
