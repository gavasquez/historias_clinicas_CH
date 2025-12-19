import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TipoCita } from '@/services/catalogs';

export async function GET() {
  try {
    const tipos = await prisma.tipos_cita.findMany({
      orderBy: { descripcion: "asc" },
    });

    const data = tipos.map((t: TipoCita) => ({
      id_tipo_cita: t.id_tipo_cita,
      codigo: t.codigo,
      descripcion: t.descripcion,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching appointment types", error);
    return NextResponse.json({ message: "Error obteniendo tipos de cita" }, { status: 500 });
  }
}
