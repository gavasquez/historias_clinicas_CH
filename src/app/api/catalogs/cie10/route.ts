import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET( request: NextRequest ) {
  try {
    const { searchParams } = new URL( request.url );
    const query = searchParams.get( "query" )?.trim() || "";
    const take = Number( searchParams.get( "take" ) ?? "20" );

    const where: Prisma.cie10WhereInput = query
      ? {
        OR: [
          {
            codigo: {
              contains: query,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            nombre: {
              contains: query,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            descripcion: {
              contains: query,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
        activo: true,
      }
      : { activo: true };

    const results = await prisma.cie10.findMany( {
      where,
      orderBy: { codigo: "asc" },
      take: Number.isFinite( take ) && take > 0 && take <= 100 ? take : 20,
    } );

    return NextResponse.json(
      results.map( ( d ) => ( {
        codigo: d.codigo,
        nombre: d.nombre,
        descripcion: d.descripcion,
      } ) ),
    );
  } catch ( error ) {
    console.error( "Error fetching CIE-10 catalog", error );
    return NextResponse.json(
      { message: "Error obteniendo catálogo CIE-10" },
      { status: 500 },
    );
  }
}
