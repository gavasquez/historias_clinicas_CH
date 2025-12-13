import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.estados_civiles.findMany({
      orderBy: { descripcion: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching marital statuses", error);
    return NextResponse.json(
      { message: "Error obteniendo estados civiles" },
      { status: 500 },
    );
  }
}
