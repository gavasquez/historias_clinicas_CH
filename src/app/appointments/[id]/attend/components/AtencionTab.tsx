"use client";

import React from "react";

export function AtencionTab({
  form,
  setForm,
}: {
  form: any;
  setForm: any;
}) {
  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">RECOMENDACIONES</div>
        <textarea
          value={form.atencion_recomendaciones}
          onChange={(e) =>
            setForm((prev: any) => ({ ...prev, atencion_recomendaciones: e.target.value }))
          }
          rows={8}
          className="min-h-[180px] w-full rounded-md border border-slate-300 px-2 py-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          placeholder="Recomendaciones"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">CERTIFICADO MÉDICO</div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Observaciones</label>
          <textarea
            value={form.certificado_recomendaciones}
            onChange={(e) =>
              setForm((prev: any) => ({ ...prev, certificado_recomendaciones: e.target.value }))
            }
            rows={4}
            className="min-h-[96px] rounded-md border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Observaciones"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">SEGUIMIENTO</div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Opción</label>
            <select
              value={form.seguimiento_opcion}
              onChange={(e) => setForm((prev: any) => ({ ...prev, seguimiento_opcion: e.target.value }))}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 shadow-sm"
            >
              <option value="">Seleccione...</option>
              <option value="CONDICIONES_CRONICAS">CONDICIONES CRÓNICAS</option>
              <option value="SITUACION_EN_SALUD">SITUACIÓN EN SALUD</option>
              <option value="NO_APLICA">NO APLICA</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Fecha</label>
            <input
              type="date"
              value={form.seguimiento_fecha}
              onChange={(e) => setForm((prev: any) => ({ ...prev, seguimiento_fecha: e.target.value }))}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 shadow-sm"
            />
          </div>
        </div>
      </div>
    </>
  );
}
