"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDiagnosisConfirmationTypes,
  searchCie10,
  type Cie10Item,
  type DiagnosisConfirmationType,
} from "@/services/catalogs";

export interface DiagnosisDraft {
  codigo_cie10: string;
  cie10_nombre?: string | null;
  cie10_descripcion?: string | null;
  es_principal: boolean;
  codigo_confirmacion?: "CN" | "CR" | "ID" | null;
}

export function AttentionDiagnosesSection({
  diagnosticosDraft,
  setDiagnosticosDraft,
  setError,
  setSuccessMessage,
}: {
  diagnosticosDraft: DiagnosisDraft[];
  setDiagnosticosDraft: (next: DiagnosisDraft[] | ((prev: DiagnosisDraft[]) => DiagnosisDraft[])) => void;
  setError: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
}) {
  const [cie10Query, setCie10Query] = useState("");
  const [cie10Results, setCie10Results] = useState<Cie10Item[]>([]);
  const [cie10Loading, setCie10Loading] = useState(false);

  const { data: confirmationTypes } = useQuery<DiagnosisConfirmationType[]>({
    queryKey: ["diagnosis-confirmations"],
    queryFn: fetchDiagnosisConfirmationTypes,
  });

  const confirmationOptions =
    confirmationTypes && confirmationTypes.length > 0
      ? confirmationTypes
      : ([
          { id_tipo_confirmacion: 0, codigo: "CN", descripcion: "Confirmado Nuevo" },
          { id_tipo_confirmacion: 0, codigo: "CR", descripcion: "Confirmado Repetido" },
          { id_tipo_confirmacion: 0, codigo: "ID", descripcion: "Impresión Diagnóstica" },
        ] as DiagnosisConfirmationType[]);

  const addDraftDiagnosis = (item: Cie10Item, opts: { esPrincipal?: boolean } = {}) => {
    setDiagnosticosDraft((prev) => {
      const already = prev.some((d) => d.codigo_cie10 === item.codigo);
      if (already) return prev;

      const next: DiagnosisDraft[] = [
        ...prev,
        {
          codigo_cie10: item.codigo,
          cie10_nombre: item.nombre ?? null,
          cie10_descripcion: item.descripcion ?? null,
          es_principal: opts.esPrincipal === true,
          codigo_confirmacion: null,
        },
      ];

      const idxPrincipal = next.findIndex((d) => d.es_principal);
      if (idxPrincipal < 0) return next;
      return next.map((d, idx) => ({ ...d, es_principal: idx === idxPrincipal }));
    });
  };

  const handleSearchCie10 = async () => {
    try {
      setCie10Loading(true);
      setError(null);
      const results = await searchCie10(cie10Query, 20);
      setCie10Results(results);
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;
      setError(
        typeof backendMessage === "string" && backendMessage.trim().length > 0
          ? backendMessage
          : err?.message || "Error buscando en el catálogo CIE-10.",
      );
    } finally {
      setCie10Loading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px]">
      <div className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">DIAGNÓSTICOS (CIE-10)</div>

      {diagnosticosDraft.length > 0 && (
        <div className="space-y-2">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">Diagnósticos (pendientes de guardar):</span>
              {(() => {
                const principal = diagnosticosDraft.find((d) => d.es_principal);
                const secundarios = diagnosticosDraft.filter((d) => !d.es_principal).length;
                return (
                  <>
                    {principal ? (
                      <span>
                        Dx principal:
                        <span className="ml-1 rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-900 shadow-sm">
                          {principal.codigo_cie10}
                        </span>
                      </span>
                    ) : (
                      <span>Sin principal</span>
                    )}
                    <span>Secundarios: {secundarios}</span>
                  </>
                );
              })()}
            </div>
          </div>

          {diagnosticosDraft.map((d, idx) => (
            <div
              key={`${idx}-${d.codigo_cie10}`}
              className="flex items-start justify-between gap-2 rounded-md border border-slate-200 bg-white p-2 text-[11px]"
            >
              <div className="grid gap-1">
                <p className="text-slate-700">
                  <span className="font-semibold">Código:</span>{" "}
                  <span className="font-mono">{d.codigo_cie10}</span>
                  {d.es_principal && (
                    <span className="ml-2 rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-semibold text-sky-700">
                      Principal
                    </span>
                  )}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Nombre:</span> {d.cie10_nombre || "-"}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-700">
                  <span className="font-semibold">Tipo:</span>
                  {confirmationOptions.map((opt) => (
                    <label key={opt.codigo} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(d.codigo_confirmacion ?? null) === (opt.codigo as any)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setDiagnosticosDraft((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? { ...x, codigo_confirmacion: checked ? (opt.codigo as any) : null }
                                : x,
                            ),
                          );
                        }}
                        className="h-3 w-3 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span title={opt.descripcion}>
                        {opt.codigo} - {opt.descripcion}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 text-[11px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={d.es_principal}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setDiagnosticosDraft((prev) =>
                        prev.map((x, i) => ({ ...x, es_principal: checked ? i === idx : false })),
                      );
                    }}
                    className="h-3 w-3 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Principal</span>
                </label>
                <button
                  type="button"
                  onClick={() => setDiagnosticosDraft((prev) => prev.filter((_, i) => i !== idx))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 rounded-md border border-slate-100 bg-slate-50 p-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-medium text-slate-600">Buscar en catálogo CIE-10</label>
            <input
              type="text"
              value={cie10Query}
              onChange={(e) => setCie10Query(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                if (!cie10Loading && cie10Query.trim()) {
                  handleSearchCie10();
                }
              }}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-[11px] shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Ingrese código, nombre o descripción"
            />
          </div>
          <button
            type="button"
            onClick={handleSearchCie10}
            disabled={cie10Loading || !cie10Query.trim()}
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cie10Loading ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {cie10Results.length > 0 && (
          <div className="max-h-52 overflow-auto rounded-md border border-slate-200 bg-white">
            <table className="min-w-full border-collapse text-left text-[11px]">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-1.5">Código</th>
                  <th className="px-2 py-1.5">Nombre</th>
                  <th className="px-2 py-1.5">Descripción</th>
                  <th className="px-2 py-1.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cie10Results.map((item) => (
                  <tr key={item.codigo} className="border-t border-slate-100">
                    <td className="px-2 py-1.5 font-mono text-[11px] text-slate-800">{item.codigo}</td>
                    <td className="px-2 py-1.5 text-slate-800">{item.nombre}</td>
                    <td className="px-2 py-1.5 text-slate-600">{item.descripcion}</td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          addDraftDiagnosis(item, { esPrincipal: false });
                          setError(null);
                          setSuccessMessage("Diagnóstico agregado (pendiente de guardar la atención). ");
                        }}
                        disabled={false}
                        className="rounded border border-slate-300 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Agregar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
