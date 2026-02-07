import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentIdParam = searchParams.get("departmentId");
    const departmentId = departmentIdParam ? Number(departmentIdParam) : null;

    const where = departmentId && Number.isInteger(departmentId) && departmentId > 0
      ? { id_departamento: departmentId }
      : undefined;

    const prismaAny = prisma as any;
    const items = await prismaAny.ciudades.findMany({
      where,
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching cities", error);
    return NextResponse.json(
      { message: "Error obteniendo ciudades" },
      { status: 500 },
    );
  }
}
