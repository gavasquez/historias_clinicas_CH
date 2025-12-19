import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { EstadoCita } from '@/services/catalogs';

export async function GET() {
  try {
    const estados = await prisma.estados_cita.findMany({
      orderBy: { descripcion: "asc" },
    });

    const data = estados.map((e: EstadoCita) => ({
      id_estado_cita: e.id_estado_cita,
      codigo: e.codigo,
      descripcion: e.descripcion,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching appointment statuses", error);
    return NextResponse.json(
      { message: "Error obteniendo estados de cita" },
      { status: 500 },
    );
  }
}
