import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const PAGE_SIZE = 5;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const page = Math.max(Number(pageParam) || 1, 1);

    const documento = searchParams.get("documento")?.trim() || "";
    const nombre = searchParams.get("nombre")?.trim() || "";
    const tipoUsuario = searchParams.get("tipoUsuario")?.trim() || "";
    const programa = searchParams.get("programa")?.trim() || "";

    const skip = (page - 1) * PAGE_SIZE;

    const where: any = {};

    if (documento) {
      where.numero_documento = {
        contains: documento,
        mode: "insensitive",
      };
    }

    if (nombre) {
      where.OR = [
        {
          nombres: {
            contains: nombre,
            mode: "insensitive",
          },
        },
        {
          apellidos: {
            contains: nombre,
            mode: "insensitive",
          },
        },
      ];
    }

    if (tipoUsuario) {
      where.tipos_usuario = {
        descripcion: {
          contains: tipoUsuario,
          mode: "insensitive",
        },
      };
    }

    if (programa) {
      where.programas_academicos = {
        nombre: {
          contains: programa,
          mode: "insensitive",
        },
      };
    }

    const [items, total] = await Promise.all([
      prisma.pacientes.findMany({
        skip,
        take: PAGE_SIZE,
        orderBy: { fecha_creacion: "desc" },
        where,
        include: {
          tipos_documento: true,
          tipos_usuario: true,
          programas_academicos: true,
          sedes: true,
        },
      }),
      prisma.pacientes.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
      },
    });
  } catch (error) {
    console.error("Error fetching patients", error);
    return NextResponse.json(
      { message: "Error obteniendo pacientes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      id_tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      fecha_nacimiento,
      id_genero,
      id_estado_civil,
      direccion,
      telefono,
      email,
      id_ciudad,
      id_tipo_sangre,
      id_sede,
      id_programa_academico,
      id_eps,
      condicion_particular,
      id_tipo_usuario,

      contacto_emergencia_nombre,
      contacto_emergencia_relacion,
      contacto_emergencia_telefono,
      contacto_emergencia_direccion,
    } = body;

    const toNullableInt = (value: unknown) => {
      if (value === null || value === undefined || value === "") return null;
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    };

    const idTipoDocumentoNum = Number(id_tipo_documento);
    const numeroDocumentoTrim = String(numero_documento ?? "").trim();
    const telefonoTrim = String(telefono ?? "").trim();
    const idCiudadNum = Number(id_ciudad);

    if (
      !idTipoDocumentoNum ||
      Number.isNaN(idTipoDocumentoNum) ||
      !numeroDocumentoTrim ||
      !nombres ||
      !apellidos ||
      !fecha_nacimiento ||
      !telefonoTrim ||
      !idCiudadNum ||
      Number.isNaN(idCiudadNum)
    ) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios del paciente" },
        { status: 400 },
      );
    }

    const contactoNombreTrim = String(contacto_emergencia_nombre ?? "").trim();

    const result = await prisma.$transaction(async (tx) => {
      const prismaAny = tx as any;

      const paciente = await prismaAny.pacientes.create({
        data: {
          id_tipo_documento: idTipoDocumentoNum,
          numero_documento: numeroDocumentoTrim,
          nombres,
          apellidos,
          fecha_nacimiento: new Date(fecha_nacimiento),
          id_genero: toNullableInt(id_genero),
          id_estado_civil: toNullableInt(id_estado_civil),
          id_ciudad: idCiudadNum,
          direccion: direccion ?? null,
          telefono: telefonoTrim,
          email: email ?? null,
          id_tipo_sangre: toNullableInt(id_tipo_sangre),
          id_sede: toNullableInt(id_sede),
          id_programa_academico: toNullableInt(id_programa_academico),
          id_eps: toNullableInt(id_eps),
          condicion_particular: condicion_particular ?? null,
          id_tipo_usuario: toNullableInt(id_tipo_usuario),
        },
      });

      if (contactoNombreTrim) {
        await tx.acompanantes.create({
          data: {
            id_paciente: paciente.id_paciente,
            nombre: contactoNombreTrim,
            relacion_con_paciente: contacto_emergencia_relacion
              ? String(contacto_emergencia_relacion)
              : null,
            telefono: contacto_emergencia_telefono ? String(contacto_emergencia_telefono) : null,
            direccion: contacto_emergencia_direccion ? String(contacto_emergencia_direccion) : null,
          },
        });
      }

      return paciente;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating patient", error);

    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Violación de restricción única (probablemente numero_documento duplicado)
      return NextResponse.json(
        { message: "Ya existe un paciente registrado con este número de documento" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Error creando paciente" },
      { status: 500 },
    );
  }
}
