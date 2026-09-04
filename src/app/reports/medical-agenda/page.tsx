"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getEstadoCitaBadgeClasses } from "@/lib/appointment-status";
import { fetchSedes, type Sede } from "@/services/catalogs";
import {
  buildMedicalAgendaXlsxUrl,
  downloadMedicalAgendaPdf,
  fetchMedicalAgendaMedics,
  fetchMedicalAgendaReport,
  type MedicalAgendaFilters,
  type MedicalAgendaMedic,
  type MedicalAgendaResponse,
} from "@/services/medical-agenda";

const DAY_OPTIONS = [
  { value: 0, label: "Todos" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

function formatDateRange(from: string, to: string) {
  if (from && to) return `${from} - ${to}`;
  if (from) return from;
  if (to) return to;
  return "Todas";
}

export default function MedicalAgendaReportPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [from, setFrom] = useState<string>(today);
  const [to, setTo] = useState<string>(today);
  const [medico, setMedico] = useState<string>("");
  const [sede, setSede] = useState<string>("");
  const [dia, setDia] = useState<string>("0");

  const filters: MedicalAgendaFilters = useMemo(() => {
    return {
      medico: medico ? Number(medico) : undefined,
      sede: sede ? Number(sede) : undefined,
      from: from || undefined,
      to: to || undefined,
      dia: dia ? Number(dia) : undefined,
    };
  }, [medico, sede, from, to, dia]);

  const isDateRangeValid = useMemo(() => {
    if (!from || !to) return true;
    return from <= to;
  }, [from, to]);

  const { data: sedes } = useQuery<Sede[]>({
    queryKey: ["sedes"],
    queryFn: fetchSedes,
  });

  const { data: medicos } = useQuery<MedicalAgendaMedic[]>({
    queryKey: ["medical-agenda-medics"],
    queryFn: fetchMedicalAgendaMedics,
  });

  const { data, isLoading, isError, error } = useQuery<MedicalAgendaResponse>({
    queryKey: ["report-medical-agenda", filters],
    queryFn: () => fetchMedicalAgendaReport(filters),
    enabled: isDateRangeValid,
  });

  const rows = data?.data ?? [];
  const stats = data?.stats;

  const xlsxUrl = useMemo(() => buildMedicalAgendaXlsxUrl(filters), [filters]);

  const selectedMedicoLabel = useMemo(() => {
    if (!medico) return "Todos";
    return medicos?.find((m) => String(m.id_profesional) === medico)?.nombre_completo ?? "Seleccionado";
  }, [medico, medicos]);

  const selectedSedeLabel = useMemo(() => {
    if (!sede) return "Todas";
    return sedes?.find((s) => String(s.id_sede) === sede)?.nombre ?? "Seleccionada";
  }, [sede, sedes]);

  const selectedDiaLabel = useMemo(() => {
    return DAY_OPTIONS.find((d) => String(d.value) === dia)?.label ?? "Todos";
  }, [dia]);

  const handleExportPdf = () => {
    if (rows.length === 0) return;
    void downloadMedicalAgendaPdf(rows, {
      medico: selectedMedicoLabel,
      sede: selectedSedeLabel,
      fecha: formatDateRange(from, to),
      dia: selectedDiaLabel,
    });
  };

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Agenda Médica
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Consulta y exporta la agenda de citas de los médicos por rango de fechas, sede y día.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={xlsxUrl}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Exportar Excel
            </a>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={rows.length === 0}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Exportar PDF
            </button>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6 text-xs">
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-medium text-slate-600">Médico</label>
            <select
              value={medico}
              onChange={(e) => setMedico(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">Todos los médicos</option>
              {(medicos ?? []).map((m) => (
                <option key={m.id_profesional} value={m.id_profesional}>
                  {m.nombre_completo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Sede</label>
            <select
              value={sede}
              onChange={(e) => setSede(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">Todas las sedes</option>
              {(sedes ?? []).map((s) => (
                <option key={s.id_sede} value={s.id_sede}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Fecha inicial</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Fecha final</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Día</label>
            <select
              value={dia}
              onChange={(e) => setDia(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {DAY_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!isDateRangeValid && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            La fecha inicial no puede ser posterior a la fecha final.
          </p>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Resumen</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {stats?.total ?? 0}
            </p>
            <p className="text-xs text-slate-500">Citas encontradas</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Por sede</p>
            <div className="mt-3 grid gap-2">
              {(stats?.por_sede ?? []).slice(0, 6).map((item) => (
                <div
                  key={item.sede}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <span className="text-[11px] text-slate-700">{item.sede}</span>
                  <span className="text-[11px] font-semibold text-slate-900">{item.total}</span>
                </div>
              ))}
              {(stats?.por_sede ?? []).length === 0 && (
                <p className="text-xs text-slate-500">Sin datos.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Por estado</p>
            <div className="mt-3 grid gap-2">
              {(stats?.por_estado ?? []).slice(0, 6).map((item) => (
                <div
                  key={item.estado}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <span className="text-[11px] text-slate-700">{item.estado}</span>
                  <span className="text-[11px] font-semibold text-slate-900">{item.total}</span>
                </div>
              ))}
              {(stats?.por_estado ?? []).length === 0 && (
                <p className="text-xs text-slate-500">Sin datos.</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {isLoading && <p className="text-sm text-slate-500">Generando reporte...</p>}

          {isError && !isLoading && (
            <p className="text-sm text-red-600">
              {error instanceof Error ? error.message : "Ocurrió un error al generar el reporte."}
            </p>
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
                    <th className="px-3 py-2">Día</th>
                    <th className="px-3 py-2">Hora inicio</th>
                    <th className="px-3 py-2">Hora fin</th>
                    <th className="px-3 py-2">Médico</th>
                    <th className="px-3 py-2">Sede</th>
                    <th className="px-3 py-2">Paciente</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                  {rows.map((row) => (
                    <tr key={row.id_cita} className="hover:bg-slate-50">
                      <td className="px-3 py-2 whitespace-nowrap">{row.fecha}</td>
                      <td className="px-3 py-2">{row.dia_nombre}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{row.hora}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{row.hora_fin ?? "-"}</td>
                      <td className="px-3 py-2">{row.profesional}</td>
                      <td className="px-3 py-2">{row.sede ?? "No registrada"}</td>
                      <td className="px-3 py-2">{row.paciente}</td>
                      <td className="px-3 py-2">
                        <span className={getEstadoCitaBadgeClasses(row.estado)}>
                          {row.estado ?? "Atendido sin cita"}
                        </span>
                      </td>
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
