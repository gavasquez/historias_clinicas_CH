import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await (context as any).params;
    const id = Number(resolvedParams.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const paciente = await prisma.pacientes.findUnique({
      where: { id_paciente: id },
      include: {
        tipos_documento: true,
        tipos_usuario: true,
        programas_academicos: true,
        sedes: true,
        generos: true,
        estados_civiles: true,
        tipos_sangre: true,
        eps: true,
      },
    });

    if (!paciente) {
      return NextResponse.json(
        { message: "Paciente no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(paciente);
  } catch (error) {
    console.error("Error fetching patient detail", error);
    return NextResponse.json(
      { message: "Error obteniendo paciente" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await (context as any).params;
    const id = Number(resolvedParams.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();

    const toNullableInt = (value: unknown) => {
      if (value === null || value === undefined || value === "") return null;
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    };

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
      id_tipo_sangre,
      id_sede,
      id_programa_academico,
      id_eps,
      condicion_particular,
      id_tipo_usuario,
      activo,
    } = body;

    const updateData: any = {};

    if (id_tipo_documento !== undefined) {
      const idTipoDocumentoNum = Number(id_tipo_documento);
      if (!idTipoDocumentoNum || Number.isNaN(idTipoDocumentoNum)) {
        return NextResponse.json(
          { message: "El tipo de documento es inválido" },
          { status: 400 },
        );
      }
      updateData.id_tipo_documento = idTipoDocumentoNum;
    }

    if (numero_documento !== undefined) {
      const numeroDocumentoTrim = String(numero_documento ?? "").trim();
      if (!numeroDocumentoTrim) {
        return NextResponse.json(
          { message: "El número de documento es obligatorio" },
          { status: 400 },
        );
      }
      updateData.numero_documento = numeroDocumentoTrim;
    }

    if (nombres !== undefined) updateData.nombres = nombres;
    if (apellidos !== undefined) updateData.apellidos = apellidos;
    if (fecha_nacimiento !== undefined) {
      if (!fecha_nacimiento) {
        return NextResponse.json(
          { message: "La fecha de nacimiento es obligatoria" },
          { status: 400 },
        );
      }
      updateData.fecha_nacimiento = new Date(fecha_nacimiento);
    }

    if (id_genero !== undefined) updateData.id_genero = toNullableInt(id_genero);
    if (id_estado_civil !== undefined)
      updateData.id_estado_civil = toNullableInt(id_estado_civil);
    if (direccion !== undefined) updateData.direccion = direccion ?? null;
    if (telefono !== undefined) updateData.telefono = telefono ?? null;
    if (email !== undefined) updateData.email = email ?? null;
    if (id_tipo_sangre !== undefined)
      updateData.id_tipo_sangre = toNullableInt(id_tipo_sangre);
    if (id_sede !== undefined) updateData.id_sede = toNullableInt(id_sede);
    if (id_programa_academico !== undefined)
      updateData.id_programa_academico = toNullableInt(id_programa_academico);
    if (id_eps !== undefined) updateData.id_eps = toNullableInt(id_eps);
    if (condicion_particular !== undefined)
      updateData.condicion_particular = condicion_particular ?? null;
    if (id_tipo_usuario !== undefined)
      updateData.id_tipo_usuario = toNullableInt(id_tipo_usuario);

    if (activo !== undefined) {
      if (typeof activo !== "boolean") {
        return NextResponse.json(
          { message: "El campo activo debe ser boolean" },
          { status: 400 },
        );
      }
      updateData.activo = activo;
    }

    const pacienteActualizado = await prisma.pacientes.update({
      where: { id_paciente: id },
      data: updateData,
    });

    return NextResponse.json(pacienteActualizado);
  } catch (error) {
    console.error("Error updating patient", error);
    return NextResponse.json(
      { message: "Error actualizando paciente" },
      { status: 500 },
    );
  }
}
