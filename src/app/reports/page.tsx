import { AppShell } from "@/components/layout/app-shell";

export default function ReportsPage() {
  return (
    <AppShell>
      <section className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
            Reportes
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Este módulo permitirá generar reportes básicos y estadísticas del servicio.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-sm text-slate-500">
          Los reportes se implementarán en fases posteriores.
        </div>
      </section>
    </AppShell>
  );
}
