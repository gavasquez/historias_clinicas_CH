import { AppShell } from "@/components/layout/app-shell";

export default function AppointmentsPage() {
  return (
    <AppShell>
      <section className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
            Citas
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Desde aquí podrás gestionar la agenda de los profesionales y las citas de los pacientes.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-sm text-slate-500">
          El módulo de agenda y citas se implementará en la Fase 3.
        </div>
      </section>
    </AppShell>
  );
}
