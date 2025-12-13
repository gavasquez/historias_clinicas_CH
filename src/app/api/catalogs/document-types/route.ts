import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const tipos = await prisma.tipos_documento.findMany({
      orderBy: { descripcion: "asc" },
    });

    return NextResponse.json(tipos);
  } catch (error) {
    console.error("Error fetching document types", error);
    return NextResponse.json(
      { message: "Error obteniendo tipos de documento" },
      { status: 500 },
    );
  }
}
