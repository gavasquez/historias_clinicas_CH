import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.tipos_sangre.findMany({
      orderBy: { descripcion: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching blood types", error);
    return NextResponse.json(
      { message: "Error obteniendo tipos de sangre" },
      { status: 500 },
    );
  }
}
