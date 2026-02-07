import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.roles.findMany({
      orderBy: { nombre: "asc" },
    });

    const data = roles.map((r) => ({
      id_rol: r.id_rol,
      nombre: r.nombre,
      descripcion: r.descripcion ?? null,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching roles", error);
    return NextResponse.json(
      { message: "Error obteniendo roles" },
      { status: 500 },
    );
  }
}
