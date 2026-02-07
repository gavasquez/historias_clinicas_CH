import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const prismaAny = prisma as any;
    const items = await prismaAny.departamentos.findMany({
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching departments", error);
    return NextResponse.json(
      { message: "Error obteniendo departamentos" },
      { status: 500 },
    );
  }
}
