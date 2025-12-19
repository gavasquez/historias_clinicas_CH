import prisma from "@/lib/prisma";
import {
  dateOnlyUtcFromLocal,
  dayOfWeek1To7,
  minutesFromDbTime,
  minutesFromLocalTime,
} from "@/lib/date-time";

export async function validateAvailabilityOrThrow(params: {
  idProfesional: number;
  idSede: number;
  start: Date;
  end: Date;
}) {
  const { idProfesional, idSede, start, end } = params;
  const dia = dayOfWeek1To7(start);
  const dateOnly = dateOnlyUtcFromLocal(start);

  const items = await prisma.disponibilidades_profesional.findMany({
    where: {
      id_profesional: idProfesional,
      id_sede: idSede,
      dia_semana: dia,
      es_excepcion: false,
      AND: [
        {
          OR: [{ fecha_inicio_vigencia: null }, { fecha_inicio_vigencia: { lte: dateOnly } }],
        },
        {
          OR: [{ fecha_fin_vigencia: null }, { fecha_fin_vigencia: { gte: dateOnly } }],
        },
      ],
    },
  });

  const startMin = minutesFromLocalTime(start);
  const endMin = minutesFromLocalTime(end);

  const ok = items.some((i) => {
    const aStart = minutesFromDbTime(i.hora_inicio);
    const aEnd = minutesFromDbTime(i.hora_fin);
    return startMin >= aStart && endMin <= aEnd;
  });

  if (!ok) {
    throw new Error("NO_AVAILABILITY");
  }
}
