"use client";

import { useEffect, useState } from "react";

export type CompanionFormValue = {
  viene_acompanado: "" | "SI" | "NO";
  id_acompanante: string;
  nombre: string;
  relacion_con_paciente: string;
  telefono: string;
};

export const EMPTY_COMPANION: CompanionFormValue = {
  viene_acompanado: "",
  id_acompanante: "",
  nombre: "",
  relacion_con_paciente: "",
  telefono: "",
};

export function buildAcompanantePayload(value: CompanionFormValue | undefined | null) {
  if (value?.viene_acompanado === "SI") {
    return {
      viene_acompanado: true,
      id_acompanante: value.id_acompanante ? Number(value.id_acompanante) : undefined,
      nombre: value.nombre.trim() || undefined,
      relacion_con_paciente: value.relacion_con_paciente.trim() || undefined,
      telefono: value.telefono.trim() || undefined,
    };
  }
  if (value?.viene_acompanado === "NO") {
    return { viene_acompanado: false };
  }
  return undefined;
}

type Acompanante = {
  id_acompanante: number;
  nombre: string;
  telefono: string | null;
  relacion_con_paciente: string | null;
};

export function CompanionSection({
  idPaciente,
  value,
  onChange,
}: {
  idPaciente: number | string | null | undefined;
  value: CompanionFormValue;
  onChange: (value: CompanionFormValue) => void;
}) {
  const [acompanantes, setAcompanantes] = useState<Acompanante[]>([]);

  useEffect(() => {
    const id = Number(idPaciente);
    if (!Number.isInteger(id) || id <= 0) return;
    let cancelled = false;
    fetch(`/api/patients/${id}/companions`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setAcompanantes(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [idPaciente]);

  const set = (patch: Partial<CompanionFormValue>) => onChange({ ...value, ...patch });
  const inputClass =
    "h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-slate-100";

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-600">¿El paciente viene acompañado?</p>
        <div className="flex flex-wrap gap-4 text-xs text-slate-700">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={value.viene_acompanado === "SI"}
              onChange={() => set({ viene_acompanado: "SI" })}
              className="h-3 w-3"
            />
            <span>Sí</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={value.viene_acompanado === "NO"}
              onChange={() =>
                set({ viene_acompanado: "NO", id_acompanante: "", nombre: "", relacion_con_paciente: "", telefono: "" })
              }
              className="h-3 w-3"
            />
            <span>No</span>
          </label>
        </div>
      </div>

      {value.viene_acompanado === "SI" && (
        <div className="grid gap-3 md:grid-cols-2">
          {acompanantes.length > 0 && (
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-medium text-slate-600">Acompañante registrado</label>
              <select
                value={value.id_acompanante}
                onChange={(e) => {
                  const selected = acompanantes.find(
                    (a) => String(a.id_acompanante) === e.target.value,
                  );
                  set({
                    id_acompanante: e.target.value,
                    nombre: selected?.nombre ?? "",
                    relacion_con_paciente: selected?.relacion_con_paciente ?? "",
                    telefono: selected?.telefono ?? "",
                  });
                }}
                className={inputClass}
              >
                <option value="">Seleccione u otro acompañante…</option>
                {acompanantes.map((a) => (
                  <option key={a.id_acompanante} value={String(a.id_acompanante)}>
                    {a.nombre}
                    {a.relacion_con_paciente ? ` (${a.relacion_con_paciente})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Nombre del acompañante</label>
            <input
              type="text"
              value={value.nombre}
              disabled={Boolean(value.id_acompanante)}
              onChange={(e) => set({ nombre: e.target.value })}
              className={inputClass}
              placeholder="Nombre completo"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Parentesco / relación</label>
            <input
              type="text"
              value={value.relacion_con_paciente}
              disabled={Boolean(value.id_acompanante)}
              onChange={(e) => set({ relacion_con_paciente: e.target.value })}
              className={inputClass}
              placeholder="Ej. Madre, esposo, hijo"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Teléfono</label>
            <input
              type="text"
              value={value.telefono}
              disabled={Boolean(value.id_acompanante)}
              onChange={(e) => set({ telefono: e.target.value })}
              className={inputClass}
              placeholder="Teléfono de contacto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
