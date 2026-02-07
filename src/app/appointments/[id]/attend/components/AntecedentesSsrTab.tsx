"use client";

import React from "react";

export function AntecedentesSsrTab({
  ssrForm,
  setSsrForm,
  tamizajesForm,
  setTamizajesForm,
  form,
  setForm,
}: {
  ssrForm: any;
  setSsrForm: any;
  tamizajesForm: any[];
  setTamizajesForm: any;
  form: any;
  setForm: any;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
          ANTECEDENTES DE SALUD SEXUAL Y REPRODUCTIVA
        </div>

        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-2">
            <label className="text-[11px] font-medium text-slate-600">Menarquia</label>
            <input
              type="text"
              value={ssrForm.menarquia}
              onChange={(e) => {
                const next = { ...ssrForm, menarquia: e.target.value };
                setSsrForm(next);
                setForm((prev: any) => ({ ...prev, hc_ssr_contenido: JSON.stringify(next) }));
              }}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Ej: 12"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-[11px] font-medium text-slate-600">Ciclos</label>
            <input
              type="text"
              value={ssrForm.ciclos}
              onChange={(e) => {
                const next = { ...ssrForm, ciclos: e.target.value };
                setSsrForm(next);
                setForm((prev: any) => ({ ...prev, hc_ssr_contenido: JSON.stringify(next) }));
              }}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Ej: 28x5"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-[11px] font-medium text-slate-600">FUM</label>
            <input
              type="date"
              value={ssrForm.fum}
              onChange={(e) => {
                const next = { ...ssrForm, fum: e.target.value };
                setSsrForm(next);
                setForm((prev: any) => ({ ...prev, hc_ssr_contenido: JSON.stringify(next) }));
              }}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
            />
          </div>

          <div className="md:col-span-4 mt-2">
            <div className="grid grid-cols-7 gap-1">
              {(["G", "P", "C", "V", "A", "E", "M"] as const).map((t) => (
                <div key={t} className="text-center text-[10px] font-semibold text-slate-500">
                  {t}
                </div>
              ))}
              {(
                [
                  { k: "g", v: ssrForm.g },
                  { k: "p", v: ssrForm.p },
                  { k: "c", v: ssrForm.c },
                  { k: "v", v: ssrForm.v },
                  { k: "a", v: ssrForm.a },
                  { k: "e", v: ssrForm.e },
                  { k: "m", v: ssrForm.m },
                ] as Array<{ k: string; v: string }>
              ).map((item) => (
                <input
                  key={item.k}
                  type="text"
                  value={item.v}
                  onChange={(e) => {
                    const next = { ...ssrForm, [item.k]: e.target.value };
                    setSsrForm(next);
                    setForm((prev: any) => ({ ...prev, hc_ssr_contenido: JSON.stringify(next) }));
                  }}
                  className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                  placeholder="0"
                />
              ))}
            </div>
          </div>

          <div className="md:col-span-1">
            <label className="text-[11px] font-medium text-slate-600">FUP</label>
            <input
              type="date"
              value={ssrForm.fup}
              onChange={(e) => {
                const next = { ...ssrForm, fup: e.target.value };
                setSsrForm(next);
                setForm((prev: any) => ({ ...prev, hc_ssr_contenido: JSON.stringify(next) }));
              }}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
            />
          </div>
        </div>

        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <label className="text-[11px] font-semibold text-slate-700">Anticoncepción</label>
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                {([
                  { v: "SI", label: "Sí" },
                  { v: "NO", label: "No" },
                  { v: "PAREJA", label: "Pareja" },
                ] as Array<{ v: any; label: string }>).map((opt) => (
                  <label key={opt.v} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="anticoncepcion"
                      checked={ssrForm.anticoncepcion === opt.v}
                      onChange={() => {
                        const next = {
                          ...ssrForm,
                          anticoncepcion: opt.v,
                          anticoncepcion_cual: opt.v === "SI" ? ssrForm.anticoncepcion_cual : "",
                        };
                        setSsrForm(next);
                        setForm((prev: any) => ({ ...prev, hc_ssr_contenido: JSON.stringify(next) }));
                      }}
                      className="h-3 w-3"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="text-[11px] font-medium text-slate-600">Cuál</label>
              <input
                type="text"
                value={ssrForm.anticoncepcion_cual}
                onChange={(e) => {
                  const next = { ...ssrForm, anticoncepcion_cual: e.target.value };
                  setSsrForm(next);
                  setForm((prev: any) => ({ ...prev, hc_ssr_contenido: JSON.stringify(next) }));
                }}
                className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                placeholder="Ej: Condón, DIU, Pastillas"
                disabled={ssrForm.anticoncepcion !== "SI"}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">TAMIZAJES</div>

        <div className="overflow-auto rounded-md border border-slate-200">
          <table className="min-w-full border-collapse text-left text-[11px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-2">Tamizaje</th>
                <th className="px-2 py-2 text-center">Sí</th>
                <th className="px-2 py-2 text-center">No</th>
                <th className="px-2 py-2 text-center">N/A</th>
                <th className="px-2 py-2">Tipo</th>
                <th className="px-2 py-2">Fecha</th>
                <th className="px-2 py-2">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {tamizajesForm.map((row: any, idx: number) => (
                <tr key={`${row.key}-${idx}`} className="border-t border-slate-100">
                  <td className="px-2 py-2 text-[11px] font-medium text-slate-800">{row.label}</td>
                    {([
                      { v: "SI" },
                      { v: "NO" },
                      { v: "NA" },
                    ] as Array<{ v: string }>).map((opt) => (
                      <td key={opt.v} className="px-2 py-2 text-center">
                        <input
                          type="radio"
                          name={`tamizaje-${row.key}-${idx}`}
                          checked={row.estado === opt.v}
                          onChange={() => {
                            setTamizajesForm((prev: any[]) => {
                              const next = prev.map((r, i) => (i === idx ? { ...r, estado: opt.v } : r));
                              setForm((p: any) => ({ ...p, hc_tamizajes_contenido: JSON.stringify(next) }));
                              return next;
                            });
                          }}
                          className="h-3 w-3"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={row.tipo}
                        onChange={(e) => {
                          const value = e.target.value;
                          setTamizajesForm((prev: any[]) => {
                            const next = prev.map((r, i) => (i === idx ? { ...r, tipo: value } : r));
                            setForm((p: any) => ({ ...p, hc_tamizajes_contenido: JSON.stringify(next) }));
                            return next;
                          });
                        }}
                        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                        placeholder="Ej: Citología"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="date"
                        value={row.fecha}
                        onChange={(e) => {
                          const value = e.target.value;
                          setTamizajesForm((prev: any[]) => {
                            const next = prev.map((r, i) => (i === idx ? { ...r, fecha: value } : r));
                            setForm((p: any) => ({ ...p, hc_tamizajes_contenido: JSON.stringify(next) }));
                            return next;
                          });
                        }}
                        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={row.resultado}
                        onChange={(e) => {
                          const value = e.target.value;
                          setTamizajesForm((prev: any[]) => {
                            const next = prev.map((r, i) => (i === idx ? { ...r, resultado: value } : r));
                            setForm((p: any) => ({ ...p, hc_tamizajes_contenido: JSON.stringify(next) }));
                            return next;
                          });
                        }}
                        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
                        placeholder="Ej: Normal"
                      />
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
