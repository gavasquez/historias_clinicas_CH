"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { searchCie10, type Cie10Item } from "@/services/catalogs";
import {
  fetchAttentionDiagnoses,
  createAttentionDiagnosis,
  type AttentionDiagnosis,
} from "@/services/attentions";

export interface DiagnosisDraft {
  codigo_cie10: string;
  cie10_nombre?: string | null;
  cie10_descripcion?: string | null;
  es_principal: boolean;
}

export function AttentionDiagnosesSection({
  attentionId,
  diagnosticosDraft,
  setDiagnosticosDraft,
  setError,
  setSuccessMessage,
}: {
  attentionId: number | null;
  diagnosticosDraft: DiagnosisDraft[];
  setDiagnosticosDraft: (next: DiagnosisDraft[] | ((prev: DiagnosisDraft[]) => DiagnosisDraft[])) => void;
  setError: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
}) {
  const [cie10Query, setCie10Query] = useState("");
  const [cie10Results, setCie10Results] = useState<Cie10Item[]>([]);
  const [cie10Loading, setCie10Loading] = useState(false);
  const [selectedCie10Code, setSelectedCie10Code] = useState<string | null>(null);
  const [isPrincipal, setIsPrincipal] = useState(false);

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
        },
      ];

      const idxPrincipal = next.findIndex((d) => d.es_principal);
      if (idxPrincipal < 0) return next;
      return next.map((d, idx) => ({ ...d, es_principal: idx === idxPrincipal }));
    });
  };

  const {
    data: diagnoses,
    isLoading: loadingDiagnoses,
    refetch: refetchDiagnoses,
  } = useQuery<AttentionDiagnosis[]>({
    queryKey: ["attention-diagnoses", attentionId],
    enabled: !!attentionId,
    queryFn: () => (attentionId ? fetchAttentionDiagnoses(attentionId) : Promise.resolve([])),
  });

  const diagnosesMutation = useMutation({
    mutationFn: async () => {
      if (!attentionId || !selectedCie10Code) {
        throw new Error("Debe seleccionar un código CIE-10");
      }

      return createAttentionDiagnosis(attentionId, {
        codigo_cie10: selectedCie10Code,
        es_principal: isPrincipal,
      });
    },
    onSuccess: () => {
      setError(null);
      setSuccessMessage("Diagnóstico registrado correctamente.");
      setIsPrincipal(false);
      refetchDiagnoses();
    },
    onError: (err: any) => {
      const backendMessage = err?.response?.data?.message;
      setError(
        typeof backendMessage === "string" && backendMessage.trim().length > 0
          ? backendMessage
          : err?.message || "No se pudo registrar el diagnóstico. Intente de nuevo.",
      );
    },
  });

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
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px]">
      <div className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">DIAGNÓSTICOS (CIE-10)</div>

      {!attentionId && diagnosticosDraft.length > 0 && (
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
                          if (!attentionId) {
                            addDraftDiagnosis(item, { esPrincipal: false });
                            setError(null);
                            setSuccessMessage("Diagnóstico agregado (pendiente de guardar la atención). ");
                            return;
                          }

                          setSelectedCie10Code(item.codigo);
                        }}
                        className="rounded border border-slate-300 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Usar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedCie10Code && (
          <div className="mt-2 flex flex-col gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-[11px] text-emerald-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Código seleccionado:</span>
              <span className="rounded bg-white px-2 py-0.5 font-mono text-[11px] text-emerald-900 shadow-sm">
                {selectedCie10Code}
              </span>
            </div>
            <label className="inline-flex items-center gap-2 text-[11px]">
              <input
                type="checkbox"
                checked={isPrincipal}
                onChange={(e) => setIsPrincipal(e.target.checked)}
                className="h-3 w-3 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Marcar como diagnóstico principal</span>
            </label>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!selectedCie10Code) return;

                  if (!attentionId) {
                    const selectedItem = cie10Results.find((r) => r.codigo === selectedCie10Code);
                    setDiagnosticosDraft((prev) => {
                      const already = prev.some((d) => d.codigo_cie10 === selectedCie10Code);
                      if (already) return prev;

                      const next: DiagnosisDraft[] = [
                        ...prev,
                        {
                          codigo_cie10: selectedCie10Code,
                          cie10_nombre: selectedItem?.nombre ?? null,
                          cie10_descripcion: selectedItem?.descripcion ?? null,
                          es_principal: isPrincipal,
                        },
                      ];

                      const idxPrincipal = next.findIndex((d) => d.es_principal);
                      if (idxPrincipal < 0) return next;
                      return next.map((d, idx) => ({ ...d, es_principal: idx === idxPrincipal }));
                    });
                    setError(null);
                    setSuccessMessage("Diagnóstico agregado (pendiente de guardar la atención). ");
                    setIsPrincipal(false);
                    return;
                  }

                  diagnosesMutation.mutate();
                }}
                disabled={attentionId ? diagnosesMutation.isPending : false}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {attentionId
                  ? diagnosesMutation.isPending
                    ? "Guardando diagnóstico..."
                    : "Agregar diagnóstico"
                  : "Agregar a la lista"}
              </button>
            </div>
          </div>
        )}
      </div>

      {attentionId && (
        <>
          {diagnoses && diagnoses.length > 0 && (
            <>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">Resumen de diagnósticos:</span>
                  {(() => {
                    const principal = diagnoses.find((d) => d.es_principal);
                    const secundarios = diagnoses.filter((d) => !d.es_principal).length;
                    return (
                      <>
                        {principal ? (
                          <span>
                            Dx principal:
                            <span className="ml-1 rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-900 shadow-sm">
                              {principal.codigo_cie10}
                            </span>
                            {principal.cie10_nombre ? ` · ${principal.cie10_nombre}` : ""}
                          </span>
                        ) : (
                          <span className="text-slate-500">Sin diagnóstico principal marcado.</span>
                        )}
                        <span className="ml-3 text-slate-500">Secundarios: {secundarios}</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {diagnoses.every((d) => !d.es_principal) && (
                <p className="mb-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                  Sugerencia: registre al menos un diagnóstico marcado como principal para esta atención.
                </p>
              )}
            </>
          )}

          <div className="mt-3">
            <h3 className="mb-1 text-[11px] font-semibold text-slate-700">Diagnósticos registrados</h3>
            {loadingDiagnoses ? (
              <p className="text-[11px] text-slate-500">Cargando diagnósticos...</p>
            ) : !diagnoses || diagnoses.length === 0 ? (
              <p className="text-[11px] text-slate-500">Aún no hay diagnósticos registrados para esta atención.</p>
            ) : (
              <div className="max-h-56 overflow-auto rounded-md border border-slate-200 bg-white">
                <table className="min-w-full border-collapse text-left text-[11px]">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-2 py-1.5">Principal</th>
                      <th className="px-2 py-1.5">CIE-10</th>
                      <th className="px-2 py-1.5">Nombre</th>
                      <th className="px-2 py-1.5">Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diagnoses.map((d) => (
                      <tr key={d.id_diagnostico} className="border-t border-slate-100">
                        <td className="px-2 py-1.5 text-center">
                          {d.es_principal ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                              Principal
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Secundario</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 font-mono text-[11px] text-slate-800">{d.codigo_cie10}</td>
                        <td className="px-2 py-1.5 text-slate-800">{d.cie10_nombre}</td>
                        <td className="px-2 py-1.5 text-slate-600">{d.cie10_descripcion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
