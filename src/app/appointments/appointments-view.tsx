"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchAppointments, cancelAppointment } from "@/services/appointments";
import {
  fetchTiposCita,
  fetchEstadosCita,
  fetchSedes,
  type TipoCita,
  type EstadoCita,
  type Sede,
} from "@/services/catalogs";
import type { AppointmentListItem, AppointmentsResponse } from "@/types/appointments";
import { getEstadoCitaBadgeClasses } from "@/lib/appointment-status";
import Swal from "sweetalert2";

const PAGE_SIZE = 5;

function normalizeText(value: string | null) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function getSedeBadgeClasses(sede: string | null) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border";

  const sedeNorm = String(sede ?? "")
    .trim()
    .toUpperCase();

  if (!sedeNorm) {
    return `${base} border-slate-200 bg-slate-50 text-slate-500`;
  }

  if (sedeNorm.includes("NEIVA")) {
    return `${base} border-indigo-200 bg-indigo-50 text-indigo-700`;
  }

  if (sedeNorm.includes("PITALITO")) {
    return `${base} border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700`;
  }

  return `${base} border-slate-200 bg-slate-50 text-slate-600`;
}

function isEstadoAttendable(estadoCita: string | null) {
  const estadoNorm = normalizeText(estadoCita);
  return estadoNorm.includes("PROGRAM") || estadoNorm.includes("CONFIRM");
}

function isEstadoProgramada(estadoCita: string | null) {
  const estadoNorm = normalizeText(estadoCita);
  return estadoNorm.includes("PROGRAM");
}

function isEstadoCancelled(estadoCita: string | null) {
  const estadoNorm = normalizeText(estadoCita);

  if (!estadoNorm) return false;
  return estadoNorm.includes("CANCEL") || estadoNorm.includes("NO ASISTE");
}

function isWithinAttendWindow(input: { inicioIso: string; finIso: string | null }) {
  const start = new Date(input.inicioIso);
  if (Number.isNaN(start.getTime())) return false;

  const end = (() => {
    if (!input.finIso) {
      const fallback = new Date(start);
      fallback.setHours(fallback.getHours() + 2);
      return fallback;
    }
    const parsed = new Date(input.finIso);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  })();

  const now = new Date();
  const earlyWindowMs = 30 * 60 * 1000; // 30 min antes
  const startWindow = new Date(start.getTime() - earlyWindowMs);
  const endWindow = end ?? start;

  return now >= startWindow && now <= endWindow;
}

function getAttendBlockReason(input: {
  estadoCita: string | null;
  inicioIso: string;
  finIso: string | null;
}) {
  const start = new Date(input.inicioIso);
  if (Number.isNaN(start.getTime())) {
    return "La cita no tiene una fecha/hora válida.";
  }

  const now = new Date();
  const earlyWindowMs = 30 * 60 * 1000;
  const startWindow = new Date(start.getTime() - earlyWindowMs);

  const end = (() => {
    if (!input.finIso) {
      const fallback = new Date(start);
      fallback.setHours(fallback.getHours() + 2);
      return fallback;
    }
    const parsed = new Date(input.finIso);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  })();

  const endWindow = end ?? start;

  if (isEstadoCancelled(input.estadoCita)) {
    return "La cita está cancelada o marcada como no asistida.";
  }

  if (!isEstadoAttendable(input.estadoCita)) {
    return `La cita no está en un estado atendible (${input.estadoCita ?? "No registrado"}).`;
  }

  if (now < startWindow) {
    return "Aún no está habilitada la atención. Solo se permite atender desde 30 minutos antes.";
  }

  if (now > endWindow) {
    return "La ventana de atención ya venció (cita pasada).";
  }

  return "No es posible atender la cita en este momento.";
}

export function AppointmentsView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [profesionalFilter, setProfesionalFilter] = useState("");
  const [pacienteFilter, setPacienteFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [tipoCitaFilter, setTipoCitaFilter] = useState("");
  const [fechaFilter, setFechaFilter] = useState("");
  const [sedeFilter, setSedeFilter] = useState("0");

  const { data: tiposCita } = useQuery<TipoCita[]>({
    queryKey: ["tipos-cita"],
    queryFn: fetchTiposCita,
  });

  const { data: sedes, isLoading: loadingSedes } = useQuery<Sede[]>({
    queryKey: ["sedes"],
    queryFn: fetchSedes,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, codigoEstado }: { id: number; codigoEstado?: string }) =>
      cancelAppointment(id, codigoEstado),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "appointments",
          page,
          profesionalFilter,
          pacienteFilter,
          estadoFilter,
          tipoCitaFilter,
          fechaFilter,
          sedeFilter,
        ],
      });
    },
  });

  const { data: estadosCita } = useQuery<EstadoCita[]>({
    queryKey: ["estados-cita"],
    queryFn: fetchEstadosCita,
  });

  const { data, isLoading, isError } = useQuery<AppointmentsResponse>({
    queryKey: [
      "appointments",
      page,
      profesionalFilter,
      pacienteFilter,
      estadoFilter,
      tipoCitaFilter,
      fechaFilter,
      sedeFilter,
    ],
    queryFn: () =>
      fetchAppointments(page, {
        profesional: profesionalFilter || undefined,
        paciente: pacienteFilter || undefined,
        estado: estadoFilter || undefined,
        tipoCita: tipoCitaFilter || undefined,
        fecha: fechaFilter || undefined,
        id_sede: Number(sedeFilter) > 0 ? Number(sedeFilter) : undefined,
      }),
  });

  const appointments = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Citas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Listado general de citas del sistema.
          </p>
        </div>
        <div className="flex gap-2">
  <button
    type="button"
    onClick={() => router.push("/professionals")}
    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
  >
    Ver profesionales
  </button>
  <button
    type="button"
    onClick={() => router.push("/appointments/new")}
    className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
  >
    Nueva cita
  </button>
</div>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-xs md:grid-cols-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Profesional</label>
          <input
            type="text"
            value={profesionalFilter}
            onChange={(e) => {
              setPage(1);
              setProfesionalFilter(e.target.value);
            }}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Nombre del profesional"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Paciente</label>
          <input
            type="text"
            value={pacienteFilter}
            onChange={(e) => {
              setPage(1);
              setPacienteFilter(e.target.value);
            }}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Nombre o documento"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Estado</label>
          <select
            value={estadoFilter}
            onChange={(e) => {
              setPage(1);
              setEstadoFilter(e.target.value);
            }}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Todos</option>
            {(estadosCita ?? []).map((estado) => (
              <option key={estado.id_estado_cita} value={estado.descripcion}>
                {estado.descripcion}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Tipo de cita</label>
          <select
            value={tipoCitaFilter}
            onChange={(e) => {
              setPage(1);
              setTipoCitaFilter(e.target.value);
            }}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Todos</option>
            {(tiposCita ?? []).map((tipo) => (
              <option key={tipo.id_tipo_cita} value={tipo.descripcion}>
                {tipo.descripcion}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Fecha</label>
          <input
            type="date"
            value={fechaFilter}
            onChange={(e) => {
              setPage(1);
              setFechaFilter(e.target.value);
            }}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Sede</label>
          <select
            value={sedeFilter}
            onChange={(e) => {
              setPage(1);
              setSedeFilter(e.target.value);
            }}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="0">{loadingSedes ? "Cargando sedes..." : "Todas"}</option>
            {(sedes ?? []).map((s) => (
              <option key={s.id_sede} value={s.id_sede}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {isLoading && (
            <p className="text-sm text-slate-500">Cargando citas...</p>
          )}

          {isError && !isLoading && (
            <p className="text-sm text-red-600">Ocurrió un error al cargar las citas.</p>
          )}

          {!isLoading && !isError && appointments.length === 0 && (
            <p className="text-sm text-slate-500">No hay citas registradas.</p>
          )}

          {!isLoading && !isError && appointments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-[11px]">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Fecha / Hora</th>
                    <th className="px-3 py-2">Profesional</th>
                    <th className="px-3 py-2">Documento</th>
                    <th className="px-3 py-2">Paciente</th>
                    <th className="px-3 py-2">Tipo de cita</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Sede</th>
                    <th className="px-3 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                  {(() => {
                    const groups = new Map<string, AppointmentListItem[]>();

                    for (const cita of appointments) {
                      const key = String(cita.fecha_hora_inicio).slice(0, 10);
                      const arr = groups.get(key) ?? [];
                      arr.push(cita);
                      groups.set(key, arr);
                    }

                    const dateKeys = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1));

                    const rows: React.ReactNode[] = [];

                    for (const dateKey of dateKeys) {
                      const dayItems = groups.get(dateKey) ?? [];

                      rows.push(
                        <tr key={`group-${dateKey}`} className="bg-slate-50">
                          <td colSpan={8} className="px-3 py-2 text-[11px] font-semibold text-slate-700">
                            {new Date(`${dateKey}T00:00:00`).toLocaleDateString()}
                          </td>
                        </tr>,
                      );

                      for (const cita of dayItems) {
                        const isCancelled = isEstadoCancelled(cita.estado_cita);
                        const isProgramada = isEstadoProgramada(cita.estado_cita);

                        const startDate = new Date(cita.fecha_hora_inicio);
                        const hasValidStartDate = !Number.isNaN(startDate.getTime());

                        const canAttendByTime = hasValidStartDate
                          ? isWithinAttendWindow({
                              inicioIso: cita.fecha_hora_inicio,
                              finIso: cita.fecha_hora_fin ?? null,
                            })
                          : false;

                        const canAttend = isProgramada && !isCancelled && hasValidStartDate && canAttendByTime;
                        const shouldShowAttendButton = (isProgramada && !isCancelled) || !hasValidStartDate;

                        rows.push(
                          <tr key={cita.id_cita} className="hover:bg-slate-50">
                            <td className="px-3 py-2">
                              {(() => {
                                const start = new Date(cita.fecha_hora_inicio);
                                const end = cita.fecha_hora_fin ? new Date(cita.fecha_hora_fin) : null;
                                const startText = Number.isNaN(start.getTime())
                                  ? String(cita.fecha_hora_inicio)
                                  : start.toLocaleString();
                                const endText =
                                  end && !Number.isNaN(end.getTime())
                                    ? end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                    : null;
                                return endText ? `${startText} - ${endText}` : startText;
                              })()}
                            </td>
                            <td className="px-3 py-2">{cita.profesional_nombre}</td>
                            <td className="px-3 py-2">{cita.paciente_documento}</td>
                            <td className="px-3 py-2">{cita.paciente_nombre}</td>
                            <td className="px-3 py-2">{cita.tipo_cita ?? "No registrada"}</td>
                            <td className="px-3 py-2">
                              <span className={getEstadoCitaBadgeClasses(cita.estado_cita)}>
                                {cita.estado_cita ?? "No registrado"}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={getSedeBadgeClasses(cita.sede)}>
                                {cita.sede ?? "No registrada"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => router.push(`/appointments/${cita.id_cita}/edit`)}
                                  className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                                >
                                  Editar
                                </button>
                                {shouldShowAttendButton && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!hasValidStartDate) {
                                        await Swal.fire({
                                          title: "No se puede atender",
                                          text: "La cita no tiene una fecha/hora válida.",
                                          icon: "info",
                                          confirmButtonText: "Entendido",
                                          confirmButtonColor: "#0ea5e9",
                                        });
                                        return;
                                      }

                                      if (canAttend) {
                                        router.push(`/appointments/${cita.id_cita}/attend`);
                                        return;
                                      }

                                      const reason = getAttendBlockReason({
                                        estadoCita: cita.estado_cita,
                                        inicioIso: cita.fecha_hora_inicio,
                                        finIso: cita.fecha_hora_fin ?? null,
                                      });

                                      await Swal.fire({
                                        title: "No se puede atender",
                                        text: reason,
                                        icon: "info",
                                        confirmButtonText: "Entendido",
                                        confirmButtonColor: "#0ea5e9",
                                      });
                                    }}
                                    className={
                                      canAttend
                                        ? "rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md ring-1 ring-sky-300 transition hover:bg-sky-700"
                                        : "rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-sky-700 shadow-sm ring-1 ring-sky-100 transition hover:bg-sky-50"
                                    }
                                  >
                                    Atender
                                  </button>
                                )}
                                {!isCancelled && (
                                  <button
                                    type="button"
                                    disabled={cancelMutation.isPending}
                                    onClick={async () => {
                                      const result = await Swal.fire<string>({
                                        title: "¿Cancelar cita?",
                                        text: "Seleccione el tipo de cancelación.",
                                        icon: "warning",
                                        showCancelButton: true,
                                        confirmButtonText: "Aceptar",
                                        cancelButtonText: "Cerrar",
                                        confirmButtonColor: "#0ea5e9",
                                        cancelButtonColor: "#6b7280",
                                        input: "select",
                                        inputOptions: {
                                          CANCELADA_PAC: "Cancelada por el paciente",
                                          CANCELADA_INST: "Cancelada por la Institucion",
                                          NO_ASISTE: "Paciente no Asiste",
                                        },
                                        inputPlaceholder: "Seleccione un motivo",
                                        inputValidator: (value) => {
                                          if (!value) {
                                            return "Debe seleccionar un tipo de cancelación";
                                          }
                                          return undefined;
                                        },
                                      });

                                      if (!result.value) return;

                                      cancelMutation.mutate({
                                        id: cita.id_cita,
                                        codigoEstado: result.value,
                                      });
                                    }}
                                    className="rounded-lg border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {cancelMutation.isPending ? "Cancelando..." : "Cancelar"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>,
                        );
                      }
                    }

                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-600">
            <span>
              Página {page} de {totalPages} ({total} citas)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </section>
  );
}
