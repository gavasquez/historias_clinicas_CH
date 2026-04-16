"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/lib/api";

export default function HistoryEvolutionNotesPage() {
  const router = useRouter();
  const params = useParams<{ id: string; historyId: string }>();
  const patientId = params?.id;
  const historyId = params?.historyId;

  const historyIdNum = Number(historyId);
  const canQuery = Number.isInteger(historyIdNum) && historyIdNum > 0;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["history-evolution-notes", historyIdNum],
    enabled: canQuery,
    queryFn: async () => {
      const res = await apiClient.get<{ data: any[] }>(`/histories/${historyIdNum}/evolution-notes`);
      return res.data;
    },
  });

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Notas de evolución</h1>
            <p className="mt-1 text-sm text-slate-600">Historia #{historyId}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/patients/${patientId}/records`)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => router.push(`/patients/${patientId}/records/${historyId}/evolution-notes/new`)}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              Nueva nota
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {isLoading && <p className="text-sm text-slate-500">Cargando notas...</p>}
          {isError && !isLoading && (
            <p className="text-sm text-red-600">Ocurrió un error al cargar las notas.</p>
          )}

          {!isLoading && !isError && ((data as any)?.data?.length ?? 0) === 0 && (
            <p className="text-sm text-slate-500">Aún no hay notas de evolución registradas.</p>
          )}

          {!isLoading && !isError && ((data as any)?.data?.length ?? 0) > 0 && (
            <div className="space-y-3">
              {(data as any).data.map((n: any) => (
                <div key={n.id_nota_evolucion} className="rounded-lg border border-slate-200 p-3">
                  <div className="text-[11px] text-slate-500">
                    {n.fecha_hora ? new Date(n.fecha_hora).toLocaleString() : ""}
                    {n.tipo_atencion ? ` · ${n.tipo_atencion}` : ""}
                    {n.modalidad_atencion ? ` · ${n.modalidad_atencion}` : ""}
                  </div>

                  <div className="mt-2 grid gap-2 text-[11px]">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Nota de atención</p>
                      <p className="whitespace-pre-wrap text-slate-800">{n.nota_atencion ?? ""}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Observación / análisis</p>
                      <p className="whitespace-pre-wrap text-slate-800">{n.analisis ?? ""}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Plan de manejo</p>
                      <p className="whitespace-pre-wrap text-slate-800">{n.plan_manejo ?? ""}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Diagnósticos</p>
                      {(n.diagnosticos ?? []).length === 0 ? (
                        <p className="text-slate-500">-</p>
                      ) : (
                        <div className="space-y-1">
                          {(n.diagnosticos ?? []).map((d: any) => (
                            <div key={d.id_nota_dx} className="text-slate-800">
                              <span className="font-mono font-semibold">{d.codigo_cie10}</span>
                              {d.cie10_nombre ? <span className="ml-2">{d.cie10_nombre}</span> : null}
                              {d.es_principal ? (
                                <span className="ml-2 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                                  Principal
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
