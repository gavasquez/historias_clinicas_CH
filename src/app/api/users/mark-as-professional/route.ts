import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id_usuario = Number(body?.id_usuario);

    if (!Number.isInteger(id_usuario) || id_usuario <= 0) {
      return NextResponse.json(
        { message: "El id_usuario es obligatorio y debe ser un entero positivo." },
        { status: 400 },
      );
    }

    const existing = await prisma.profesionales_salud.findFirst({
      where: { id_usuario },
      select: {
        id_profesional: true,
        id_usuario: true,
        activo: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          id_profesional: existing.id_profesional,
          id_usuario: existing.id_usuario,
          activo: existing.activo,
          alreadyExists: true,
        },
        { status: 200 },
      );
    }

    const created = await prisma.profesionales_salud.create({
      data: {
        id_usuario,
        id_sede: null,
        id_especialidad: null,
        registro_medico: null,
        telefono_contacto: null,
        activo: true,
      },
      select: {
        id_profesional: true,
        id_usuario: true,
        activo: true,
      },
    });

    return NextResponse.json(
      {
        id_profesional: created.id_profesional,
        id_usuario: created.id_usuario,
        activo: created.activo,
        alreadyExists: false,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2003" || error.code === "P2025")
    ) {
      return NextResponse.json(
        { message: "El usuario especificado no existe." },
        { status: 400 },
      );
    }

    console.error("Error marking user as professional", error);
    return NextResponse.json(
      { message: "Error marcando usuario como profesional" },
      { status: 500 },
    );
  }
}
