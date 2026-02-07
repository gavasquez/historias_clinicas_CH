import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AppShell } from "@/components/layout/app-shell";
import { CalendarDays, FileText, Users } from "lucide-react";
import prisma from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const now = new Date();
  const startOfTodayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const startOfTomorrowUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0),
  );

  const [patientsCount, todaysAppointmentsCount, recordsCount] = await Promise.all([
    prisma.pacientes.count(),
    prisma.citas.count({
      where: {
        fecha_hora_inicio: {
          gte: startOfTodayUtc,
          lt: startOfTomorrowUtc,
        },
      },
    }),
    prisma.historias_clinicas.count(),
  ]);

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
            Bienvenido al panel de historias clínicas
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Desde aquí podrás gestionar pacientes, citas, historias clínicas y
            reportes del programa de bienestar institucional.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Pacientes
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {patientsCount}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Próximo: módulo de registro y búsqueda de pacientes.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Citas de hoy
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {todaysAppointmentsCount}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Próximo: agenda médica y asignación de citas.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Historias clínicas
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {recordsCount}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Próximo: creación y consulta de historias clínicas.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
