import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.tipos_usuario.findMany({
      orderBy: { descripcion: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching user types", error);
    return NextResponse.json(
      { message: "Error obteniendo tipos de usuario" },
      { status: 500 },
    );
  }
}
