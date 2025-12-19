export const getEstadoCitaBadgeClasses = (estado: string | null) => {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border";

  if (!estado) {
    return `${base} border-slate-200 bg-slate-50 text-slate-500`;
  }

  if (estado === "Cita programada") {
    return `${base} border-sky-200 bg-sky-50 text-sky-700`;
  }

  if (estado === "Cita confirmada por el paciente") {
    return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
  }

  if (estado === "Cita atendida") {
    return `${base} border-green-200 bg-green-50 text-green-700`;
  }

  if (estado === "Paciente no asiste a la cita") {
    return `${base} border-amber-200 bg-amber-50 text-amber-700`;
  }

  if (estado === "Cita cancelada por el paciente") {
    return `${base} border-orange-200 bg-orange-50 text-orange-700`;
  }

  if (estado === "Cita cancelada por la institución o profesional") {
    return `${base} border-red-200 bg-red-50 text-red-700`;
  }

  if (estado === "Cita reprogramada a otra fecha u hora") {
    return `${base} border-violet-200 bg-violet-50 text-violet-700`;
  }

  return `${base} border-slate-200 bg-slate-50 text-slate-600`;
};
