import { AppShell } from "@/components/layout/app-shell";

export default function RecordsPage() {
  return (
    <AppShell>
      <section className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
            Historias clínicas
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Aquí podrás consultar y gestionar las historias clínicas (consulta externa e ingreso).
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-sm text-slate-500">
          El módulo de historias clínicas se implementará en la Fase 4.
        </div>
      </section>
    </AppShell>
  );
}
