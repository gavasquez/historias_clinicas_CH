"use client";

import React from "react";

export function IngresoTab({ citaData, form, setForm }: { citaData: any; form: any; setForm: any }) {
  const now = React.useMemo(() => new Date(), []);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">INGRESO</div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Fecha de ingreso</label>
          <input
            type="text"
            value={new Date(citaData.fecha_hora_inicio).toLocaleDateString()}
            disabled
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 shadow-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Hora de ingreso</label>
          <input
            type="text"
            value={now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            disabled
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 shadow-sm"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-600">Paciente llega por sus propios medios</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-700">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="llega_por_sus_medios"
                checked={form.llega_por_sus_medios === "SI"}
                onChange={() =>
                  setForm((prev: any) => ({
                    ...prev,
                    llega_por_sus_medios: "SI",
                    llega_por_sus_medios_cual: "",
                  }))
                }
                className="h-3 w-3"
              />
              <span>Sí</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="llega_por_sus_medios"
                checked={form.llega_por_sus_medios === "NO"}
                onChange={() =>
                  setForm((prev: any) => ({
                    ...prev,
                    llega_por_sus_medios: "NO",
                  }))
                }
                className="h-3 w-3"
              />
              <span>No</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Si no, ¿cuál?</label>
          <input
            type="text"
            value={form.llega_por_sus_medios_cual}
            disabled={form.llega_por_sus_medios !== "NO"}
            onChange={(e) =>
              setForm((prev: any) => ({
                ...prev,
                llega_por_sus_medios_cual: e.target.value,
              }))
            }
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-slate-100"
            placeholder="Ingrese el medio por el que llegó el paciente"
          />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-600">Estado a la llegada</p>
        <div className="flex flex-wrap gap-4 text-xs text-slate-700">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="estado_a_la_llegada"
              checked={form.estado_a_la_llegada === "CONSCIENTE"}
              onChange={() => setForm((prev: any) => ({ ...prev, estado_a_la_llegada: "CONSCIENTE" }))}
              className="h-3 w-3"
            />
            <span>Consciente</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="estado_a_la_llegada"
              checked={form.estado_a_la_llegada === "INCONSCIENTE"}
              onChange={() => setForm((prev: any) => ({ ...prev, estado_a_la_llegada: "INCONSCIENTE" }))}
              className="h-3 w-3"
            />
            <span>Inconsciente</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="estado_a_la_llegada"
              checked={form.estado_a_la_llegada === "MUERTO"}
              onChange={() => setForm((prev: any) => ({ ...prev, estado_a_la_llegada: "MUERTO" }))}
              className="h-3 w-3"
            />
            <span>Muerto</span>
          </label>
        </div>
      </div>
    </div>
  );
}
