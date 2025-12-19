"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchAppointments, cancelAppointment } from "@/services/appointments";
import { fetchTiposCita, fetchEstadosCita, type TipoCita, type EstadoCita } from "@/services/catalogs";
import type { AppointmentListItem, AppointmentsResponse } from "@/types/appointments";
import { getEstadoCitaBadgeClasses } from "@/lib/appointment-status";
import Swal from "sweetalert2";

const PAGE_SIZE = 10;

export function AppointmentsView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [profesionalFilter, setProfesionalFilter] = useState("");
  const [pacienteFilter, setPacienteFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [tipoCitaFilter, setTipoCitaFilter] = useState("");

  const { data: tiposCita } = useQuery<TipoCita[]>({
    queryKey: ["tipos-cita"],
    queryFn: fetchTiposCita,
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
    ],
    queryFn: () =>
      fetchAppointments(page, {
        profesional: profesionalFilter || undefined,
        paciente: pacienteFilter || undefined,
        estado: estadoFilter || undefined,
        tipoCita: tipoCitaFilter || undefined,
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

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4 text-xs">
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
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Fecha / Hora</th>
                    <th className="px-3 py-2">Profesional</th>
                    <th className="px-3 py-2">Paciente</th>
                    <th className="px-3 py-2">Documento</th>
                    <th className="px-3 py-2">Tipo de cita</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Sede</th>
                    <th className="px-3 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                  {appointments.map((cita: AppointmentListItem) => {
                    const isCancelled =
                      cita.estado_cita === "Cita cancelada por el paciente" ||
                      cita.estado_cita === "Cita cancelada por la institución o profesional";

                    return (
                      <tr key={cita.id_cita} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          {new Date(cita.fecha_hora_inicio).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">{cita.profesional_nombre}</td>
                        <td className="px-3 py-2">{cita.paciente_nombre}</td>
                        <td className="px-3 py-2">{cita.paciente_documento}</td>
                        <td className="px-3 py-2">{cita.tipo_cita ?? "No registrada"}</td>
                        <td className="px-3 py-2">
                          <span className={getEstadoCitaBadgeClasses(cita.estado_cita)}>
                            {cita.estado_cita ?? "No registrado"}
                          </span>
                        </td>
                        <td className="px-3 py-2">{cita.sede ?? "No registrada"}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => router.push(`/appointments/${cita.id_cita}/edit`)}
                              className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                            >
                              Editar
                            </button>
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
                                      CANCELADA_INST: "Cancelada por la institución o profesional",
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
                      </tr>
                    );
                  })}
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
