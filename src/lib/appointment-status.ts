export const getEstadoCitaBadgeClasses = (estado: string | null) => {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border";

  const norm = String(estado ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (!estado) {
    return `${base} border-slate-200 bg-slate-50 text-slate-500`;
  }

  if (norm.includes("PROGRAM")) {
    return `${base} border-sky-200 bg-sky-50 text-sky-700`;
  }

  if (norm.includes("CONFIRM")) {
    return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
  }

  if (norm.includes("ATEND")) {
    return `${base} border-green-200 bg-green-50 text-green-700`;
  }

  if (norm.includes("REALIZ")) {
    return `${base} border-green-200 bg-green-50 text-green-700`;
  }

  if (norm.includes("NO ASISTE")) {
    return `${base} border-amber-200 bg-amber-50 text-amber-700`;
  }

  if (norm.includes("CANCEL") && norm.includes("PACIENT")) {
    return `${base} border-orange-200 bg-orange-50 text-orange-700`;
  }

  if (norm.includes("CANCEL") && (norm.includes("INSTITUC") || norm.includes("PROFESION"))) {
    return `${base} border-red-200 bg-red-50 text-red-700`;
  }

  if (norm.includes("REPROGRAM")) {
    return `${base} border-violet-200 bg-violet-50 text-violet-700`;
  }

  return `${base} border-slate-200 bg-slate-50 text-slate-600`;
};
