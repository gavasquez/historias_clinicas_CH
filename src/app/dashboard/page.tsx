import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { AppShell } from "@/components/layout/app-shell";
import { CalendarDays, FileText, Stethoscope, Users } from "lucide-react";
import prisma from "@/lib/prisma";
import {
  DEFAULT_TIME_ZONE,
  endOfDayInZone,
  startOfDayInZone,
} from "@/lib/date-time";

function formatTimeInZone(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: DEFAULT_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: number;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
          {icon}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const now = new Date();
  const startOfTodayUtc = startOfDayInZone(now);
  const endOfTodayUtc = endOfDayInZone(now);

  const role = session.user?.role;
  const userId = Number(session.user?.id);

  const profesional =
    (role === "medico" || role === "enfermera") && Number.isFinite(userId)
      ? await prisma.profesionales_salud.findFirst({
          where: { id_usuario: userId, activo: true },
          select: { id_profesional: true },
        })
      : null;

  if (role === "medico" && profesional) {
    const idProfesional = profesional.id_profesional;

    const [todaysAppointmentsCount, myAttentionsCount, myPatientsRows, todaysAppointments] =
      await Promise.all([
        prisma.citas.count({
          where: {
            id_profesional: idProfesional,
            fecha_hora_inicio: {
              gte: startOfTodayUtc,
              lte: endOfTodayUtc,
            },
          },
        }),
        prisma.atenciones_salud.count({
          where: { id_profesional: idProfesional },
        }),
        prisma.citas.findMany({
          where: { id_profesional: idProfesional },
          select: { id_paciente: true },
          distinct: ["id_paciente"],
        }),
        prisma.citas.findMany({
          where: {
            id_profesional: idProfesional,
            fecha_hora_inicio: {
              gte: startOfTodayUtc,
              lte: endOfTodayUtc,
            },
          },
          orderBy: { fecha_hora_inicio: "asc" },
          include: {
            pacientes: {
              select: { nombres: true, apellidos: true },
            },
            estados_cita: { select: { descripcion: true } },
          },
        }),
      ]);

    const myPatientsCount = myPatientsRows.length;

    return (
      <AppShell>
        <section className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Bienvenido, {session.user?.name ?? "profesional"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Este es tu resumen personal: agenda y atenciones registradas a tu
              nombre.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Mis citas de hoy"
              value={todaysAppointmentsCount}
              hint="Citas programadas para ti el día de hoy."
              icon={<CalendarDays className="h-5 w-5" />}
            />
            <StatCard
              title="Mis atenciones"
              value={myAttentionsCount}
              hint="Atenciones de salud que has registrado."
              icon={<Stethoscope className="h-5 w-5" />}
            />
            <StatCard
              title="Mis pacientes"
              value={myPatientsCount}
              hint="Pacientes diferentes con citas asignadas a ti."
              icon={<Users className="h-5 w-5" />}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Mi agenda de hoy
            </h2>
            {todaysAppointments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No tienes citas programadas para hoy.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {todaysAppointments.map((cita) => (
                  <li
                    key={cita.id_cita}
                    className="flex items-center justify-between gap-4 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-14 text-sm font-medium text-slate-900">
                        {formatTimeInZone(cita.fecha_hora_inicio)}
                      </span>
                      <span className="text-sm text-slate-700">
                        {cita.pacientes.nombres} {cita.pacientes.apellidos}
                      </span>
                    </div>
                    {cita.estados_cita?.descripcion ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {cita.estados_cita.descripcion}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </AppShell>
    );
  }

  if (role === "enfermera") {
    const idProfesional = profesional?.id_profesional ?? null;

    const [todaysAppointmentsCount, myAttentionsCount, scheduledByMeCount, todaysAppointments] =
      await Promise.all([
        prisma.citas.count({
          where: {
            fecha_hora_inicio: {
              gte: startOfTodayUtc,
              lte: endOfTodayUtc,
            },
          },
        }),
        idProfesional
          ? prisma.atenciones_salud.count({
              where: { id_profesional: idProfesional },
            })
          : Promise.resolve(0),
        prisma.citas.count({
          where: { id_usuario_agenda: userId },
        }),
        prisma.citas.findMany({
          where: {
            fecha_hora_inicio: {
              gte: startOfTodayUtc,
              lte: endOfTodayUtc,
            },
          },
          orderBy: { fecha_hora_inicio: "asc" },
          include: {
            pacientes: {
              select: { nombres: true, apellidos: true },
            },
            profesionales_salud: {
              include: {
                usuarios: { select: { nombre_completo: true } },
              },
            },
            estados_cita: { select: { descripcion: true } },
          },
        }),
      ]);

    return (
      <AppShell>
        <section className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Bienvenido, {session.user?.name ?? "profesional"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Resumen de la agenda del día y de tus atenciones registradas.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Citas de hoy"
              value={todaysAppointmentsCount}
              hint="Todas las citas programadas para el día de hoy."
              icon={<CalendarDays className="h-5 w-5" />}
            />
            <StatCard
              title="Mis atenciones"
              value={myAttentionsCount}
              hint="Atenciones de salud que has registrado."
              icon={<Stethoscope className="h-5 w-5" />}
            />
            <StatCard
              title="Citas agendadas por mí"
              value={scheduledByMeCount}
              hint="Citas que has programado en el sistema."
              icon={<FileText className="h-5 w-5" />}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Agenda de hoy
            </h2>
            {todaysAppointments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No hay citas programadas para hoy.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {todaysAppointments.map((cita) => (
                  <li
                    key={cita.id_cita}
                    className="flex items-center justify-between gap-4 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-14 text-sm font-medium text-slate-900">
                        {formatTimeInZone(cita.fecha_hora_inicio)}
                      </span>
                      <span className="text-sm text-slate-700">
                        {cita.pacientes.nombres} {cita.pacientes.apellidos}
                      </span>
                      <span className="text-xs text-slate-500">
                        {cita.profesionales_salud.usuarios.nombre_completo}
                      </span>
                    </div>
                    {cita.estados_cita?.descripcion ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {cita.estados_cita.descripcion}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </AppShell>
    );
  }

  const [patientsCount, todaysAppointmentsCount, recordsCount] = await Promise.all([
    prisma.pacientes.count(),
    prisma.citas.count({
      where: {
        fecha_hora_inicio: {
          gte: startOfTodayUtc,
          lte: endOfTodayUtc,
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
          <StatCard
            title="Pacientes"
            value={patientsCount}
            hint="Próximo: módulo de registro y búsqueda de pacientes."
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Citas de hoy"
            value={todaysAppointmentsCount}
            hint="Próximo: agenda médica y asignación de citas."
            icon={<CalendarDays className="h-5 w-5" />}
          />
          <StatCard
            title="Historias clínicas"
            value={recordsCount}
            hint="Próximo: creación y consulta de historias clínicas."
            icon={<FileText className="h-5 w-5" />}
          />
        </div>
      </section>
    </AppShell>
  );
}
