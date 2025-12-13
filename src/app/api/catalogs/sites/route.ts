import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.sedes.findMany({
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching sites", error);
    return NextResponse.json(
      { message: "Error obteniendo sedes" },
      { status: 500 },
    );
  }
}
