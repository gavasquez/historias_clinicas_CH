"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import {
  buildAttentionsReportCsvUrl,
  fetchAttentionsReport,
  type AttentionsReportResponse,
} from "@/services/attentions";
import {
  fetchModalidadesAtencion,
  fetchTiposAtencion,
  type ModalidadAtencion,
  type TipoAtencion,
} from "@/services/catalogs";

function formatDateTime(value: string) {
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return value;
  }
}

export default function AttentionsReportsPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [from, setFrom] = useState<string>(today);
  const [to, setTo] = useState<string>(today);
  const [profesional, setProfesional] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");
  const [modalidad, setModalidad] = useState<string>("");

  const { data: tipos } = useQuery<TipoAtencion[]>({
    queryKey: ["tipos-atencion"],
    queryFn: fetchTiposAtencion,
  });

  const { data: modalidades } = useQuery<ModalidadAtencion[]>({
    queryKey: ["modalidades-atencion"],
    queryFn: fetchModalidadesAtencion,
  });

  const { data, isLoading, isError } = useQuery<AttentionsReportResponse>({
    queryKey: ["report-attentions", from, to, profesional, tipo, modalidad],
    queryFn: () =>
      fetchAttentionsReport({
        from,
        to,
        profesional: profesional || undefined,
        tipo: tipo || undefined,
        modalidad: modalidad || undefined,
      }),
  });

  const rows = data?.data ?? [];
  const stats = data?.stats;
  const csvUrl = useMemo(
    () =>
      buildAttentionsReportCsvUrl({
        from,
        to,
        profesional: profesional || undefined,
        tipo: tipo || undefined,
        modalidad: modalidad || undefined,
      }),
    [from, to, profesional, tipo, modalidad],
  );

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Reporte de atenciones
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Atenciones por rango de fechas con filtros por profesional, tipo y modalidad.
            </p>
          </div>

          <a
            href={csvUrl}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Exportar CSV
          </a>
        </div>

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5 text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Desde</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Hasta</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Profesional</label>
            <input
              type="text"
              value={profesional}
              onChange={(e) => setProfesional(e.target.value)}
              className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Nombre del profesional"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Tipo de atención</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">Todos</option>
              {(tipos ?? []).map((t) => (
                <option key={t.id_tipo_atencion} value={t.codigo}>
                  {t.descripcion}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Modalidad</label>
            <select
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">Todas</option>
              {(modalidades ?? []).map((m) => (
                <option key={m.id_modalidad_atencion} value={m.codigo}>
                  {m.descripcion}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Resumen</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stats?.total ?? 0}</p>
            <p className="text-xs text-slate-500">Atenciones encontradas</p>
          </div>

          <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Por tipo</p>
              <div className="mt-3 grid gap-2">
                {(stats?.por_tipo ?? []).slice(0, 6).map((item) => (
                  <div
                    key={item.tipo}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <span className="text-[11px] text-slate-700">{item.tipo}</span>
                    <span className="text-[11px] font-semibold text-slate-900">{item.total}</span>
                  </div>
                ))}
                {(stats?.por_tipo ?? []).length === 0 && (
                  <p className="text-xs text-slate-500">Sin datos.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Por modalidad</p>
              <div className="mt-3 grid gap-2">
                {(stats?.por_modalidad ?? []).slice(0, 6).map((item) => (
                  <div
                    key={item.modalidad}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <span className="text-[11px] text-slate-700">{item.modalidad}</span>
                    <span className="text-[11px] font-semibold text-slate-900">{item.total}</span>
                  </div>
                ))}
                {(stats?.por_modalidad ?? []).length === 0 && (
                  <p className="text-xs text-slate-500">Sin datos.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {isLoading && <p className="text-sm text-slate-500">Generando reporte...</p>}

          {isError && !isLoading && (
            <p className="text-sm text-red-600">Ocurrió un error al generar el reporte.</p>
          )}

          {!isLoading && !isError && rows.length === 0 && (
            <p className="text-sm text-slate-500">No hay resultados para los filtros seleccionados.</p>
          )}

          {!isLoading && !isError && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-[11px]">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Paciente</th>
                    <th className="px-3 py-2">Documento</th>
                    <th className="px-3 py-2">Profesional</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Modalidad</th>
                    <th className="px-3 py-2">Sede</th>
                    <th className="px-3 py-2">Historia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                  {rows.map((row) => (
                    <tr key={row.id_atencion} className="hover:bg-slate-50">
                      <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(row.fecha_hora)}</td>
                      <td className="px-3 py-2">{row.paciente}</td>
                      <td className="px-3 py-2">{row.documento}</td>
                      <td className="px-3 py-2">{row.profesional}</td>
                      <td className="px-3 py-2">{row.tipo ?? "Sin tipo"}</td>
                      <td className="px-3 py-2">{row.modalidad ?? "Sin modalidad"}</td>
                      <td className="px-3 py-2">{row.sede ?? "No registrada"}</td>
                      <td className="px-3 py-2">#{row.id_historia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
