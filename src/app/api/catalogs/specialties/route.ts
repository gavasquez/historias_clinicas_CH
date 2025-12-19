import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Especialidad } from '@/services/catalogs';

export async function GET() {
  try {
    const especialidades = await prisma.especialidades.findMany({
      orderBy: { nombre: "asc" },
    });

    const data = especialidades.map((e: Especialidad) => ({
      id_especialidad: e.id_especialidad,
      nombre: e.nombre,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching specialties", error);
    return NextResponse.json(
      { message: "Error obteniendo especialidades" },
      { status: 500 },
    );
  }
}
