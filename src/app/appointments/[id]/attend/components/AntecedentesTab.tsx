"use client";

import React from "react";
import { Info } from "lucide-react";

export function AntecedentesTab({
  observacionPersonal,
  setObservacionPersonal,
  observacionFamiliar,
  setObservacionFamiliar,
  antecedentesTraumaticos,
  setAntecedentesTraumaticos,
}: {
  observacionPersonal: string;
  setObservacionPersonal: any;
  observacionFamiliar: string;
  setObservacionFamiliar: any;
  antecedentesTraumaticos: any;
  setAntecedentesTraumaticos: any;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
        <span>ANTECEDENTES</span>
        <span
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-100"
          title="Tip: en TAMIZAJES puedes hacer clic en Sí / No / N/A (encabezado) para marcar todas."
        >
          <Info className="h-4 w-4" />
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Observación antecedentes personal</label>
          <textarea
            value={observacionPersonal}
            onChange={(e) => setObservacionPersonal(e.target.value)}
            rows={3}
            className="min-h-[72px] rounded-md border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Observación"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Observación antecedentes familiar</label>
          <textarea
            value={observacionFamiliar}
            onChange={(e) => setObservacionFamiliar(e.target.value)}
            rows={3}
            className="min-h-[72px] rounded-md border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Observación"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
          ANTECEDENTES TRAUMÁTICOS Y COMUNES
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Naturaleza de la lesión</label>
            <input
              type="text"
              value={antecedentesTraumaticos.naturaleza_lesion}
              onChange={(e) =>
                setAntecedentesTraumaticos((prev: any) => ({
                  ...prev,
                  naturaleza_lesion: e.target.value,
                }))
              }
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Ej: Fractura, Esguince, Herida, Quemadura"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Fecha de ocurrencia</label>
            <input
              type="date"
              value={antecedentesTraumaticos.fecha_ocurrencia}
              onChange={(e) =>
                setAntecedentesTraumaticos((prev: any) => ({
                  ...prev,
                  fecha_ocurrencia: e.target.value,
                }))
              }
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Secuelas</label>
          <textarea
            value={antecedentesTraumaticos.secuelas}
            onChange={(e) =>
              setAntecedentesTraumaticos((prev: any) => ({
                ...prev,
                secuelas: e.target.value,
              }))
            }
            rows={3}
            className="min-h-[72px] rounded-md border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Describa secuelas, limitaciones, dolor crónico, etc."
          />
        </div>
      </div>
    </div>
  );
}
