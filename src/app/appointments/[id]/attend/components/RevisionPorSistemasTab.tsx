"use client";

import React from "react";

export function RevisionPorSistemasTab({
  form,
  setForm,
}: {
  form: any;
  setForm: any;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
        EXAMEN POR SISTEMA
      </div>
      <textarea
        value={form.hc_valoracion_sistemas_contenido}
        onChange={(e) =>
          setForm((prev: any) => ({ ...prev, hc_valoracion_sistemas_contenido: e.target.value }))
        }
        rows={10}
        className="min-h-[200px] w-full rounded-md border border-slate-300 px-2 py-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        placeholder="Examen por sistema"
      />
    </div>
  );
}
