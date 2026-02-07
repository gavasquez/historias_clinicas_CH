import { AppShell } from "@/components/layout/app-shell";
import Link from "next/link";

export default function ReportsPage() {
  return (
    <AppShell>
      <section className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Reportes</h1>
          <p className="mt-1 text-sm text-slate-600">
            Selecciona un reporte para ver estadísticas y exportar información.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Reporte</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Citas</h2>
            <p className="mt-1 text-sm text-slate-600">
              Citas por rango de fechas con filtros por profesional, estado y tipo. Incluye exportación CSV.
            </p>
            <div className="mt-auto pt-4">
              <Link
                href="/reports/appointments"
                className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
              >
                Ver reporte
              </Link>
            </div>
          </div>

          <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Reporte</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Atenciones</h2>
            <p className="mt-1 text-sm text-slate-600">
              Atenciones por rango de fechas y profesional. (En construcción)
            </p>
            <div className="mt-auto pt-4">
              <Link
                href="/reports/attentions"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Ver reporte
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
