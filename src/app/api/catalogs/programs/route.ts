import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipoPoblacion = searchParams.get("tipoPoblacion")?.trim() || "";

    const where = tipoPoblacion
      ? { tipo_poblacion: tipoPoblacion }
      : undefined;

    const items = await prisma.programas_academicos.findMany({
      where,
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching programs", error);
    return NextResponse.json(
      { message: "Error obteniendo programas académicos" },
      { status: 500 },
    );
  }
}
