import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.eps.findMany({
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching EPS", error);
    return NextResponse.json(
      { message: "Error obteniendo EPS" },
      { status: 500 },
    );
  }
}
