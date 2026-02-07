"use client";

import React from "react";

export function AnamnesisTab({ form, setForm }: { form: any; setForm: any }) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">ANAMNESIS</div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Motivo de consulta</label>
          <textarea
            value={form.anamnesis_motivo_consulta}
            onChange={(e) =>
              setForm((prev: any) => ({
                ...prev,
                anamnesis_motivo_consulta: e.target.value,
              }))
            }
            rows={4}
            className="min-h-[96px] rounded-md border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Motivo de consulta"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Enfermedad actual</label>
          <textarea
            value={form.anamnesis_enfermedad_actual}
            onChange={(e) =>
              setForm((prev: any) => ({
                ...prev,
                anamnesis_enfermedad_actual: e.target.value,
              }))
            }
            rows={4}
            className="min-h-[96px] rounded-md border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Enfermedad actual"
          />
        </div>
      </div>
    </div>
  );
}
