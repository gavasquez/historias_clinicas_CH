import prisma from "@/lib/prisma";

export type AcompananteAtencionData = {
  id_acompanante: number | null;
  nombre: string | null;
  relacion_con_paciente: string | null;
  telefono: string | null;
  observacion: string | null;
};

function optionalPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function trimOrNull(value: unknown): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

/**
 * Normaliza y valida el payload del acompañante de una atención.
 * Si viene_acompanado !== true, retorna null (sin acompañante).
 * Si se envía id_acompanante, toma el snapshot desde el catálogo del paciente.
 */
export async function resolveAcompananteAtencion(
  input: unknown,
  idPaciente: number,
): Promise<{ data: AcompananteAtencionData | null; error?: string }> {
  if (!input || typeof input !== "object") return { data: null };
  const raw = input as Record<string, unknown>;
  if (raw.viene_acompanado !== true) return { data: null };

  const idAcompanante = optionalPositiveInt(raw.id_acompanante);
  const observacion = trimOrNull(raw.observacion);

  if (idAcompanante) {
    const acompanante = await prisma.acompanantes.findFirst({
      where: { id_acompanante: idAcompanante, id_paciente: idPaciente },
      select: { id_acompanante: true, nombre: true, relacion_con_paciente: true, telefono: true },
    });
    if (!acompanante) {
      return { data: null, error: "El acompañante seleccionado no pertenece al paciente." };
    }
    return {
      data: {
        id_acompanante: acompanante.id_acompanante,
        nombre: acompanante.nombre,
        relacion_con_paciente: acompanante.relacion_con_paciente,
        telefono: acompanante.telefono,
        observacion,
      },
    };
  }

  const nombre = trimOrNull(raw.nombre);
  if (!nombre) {
    return { data: null, error: "Debe indicar el nombre del acompañante o seleccionarlo del listado." };
  }
  return {
    data: {
      id_acompanante: null,
      nombre,
      relacion_con_paciente: trimOrNull(raw.relacion_con_paciente),
      telefono: trimOrNull(raw.telefono),
      observacion,
    },
  };
}
