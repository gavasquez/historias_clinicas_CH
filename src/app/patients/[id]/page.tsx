"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import {
  fetchPatientAppointments,
  getPatientDetailById,
  type PatientAppointmentsFilters,
} from "@/services/patients";
import { getCompanionsByPatient, createCompanion } from "@/services/companions";
import { fetchEstadosCita, fetchSedes, type EstadoCita, type Sede } from "@/services/catalogs";
import { getEstadoCitaBadgeClasses } from "@/lib/appointment-status";
import type { Acompanante } from "@/types/companions";
import type { PacienteDetalle } from "@/types/patients";
import type {
  PatientAppointmentListItem,
  PatientAppointmentsResponse,
} from "@/types/patient-appointments";

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<PacienteDetalle | null>({
    queryKey: ["patient", id],
    enabled: !!id,
    queryFn: () => getPatientDetailById(String(id)),
  });

  const [activeTab, setActiveTab] = useState<"datos" | "acompanantes" | "citas">("datos");

  const {
    data: companions,
    isLoading: loadingCompanions,
    isError: companionsError,
  } = useQuery<Acompanante[]>({
    queryKey: ["companions", id],
    enabled: !!id,
    queryFn: () => getCompanionsByPatient(String(id)),
  });

  const [companionForm, setCompanionForm] = useState({
    nombre: "",
    relacion_con_paciente: "",
    telefono: "",
    direccion: "",
  });

  const [companionError, setCompanionError] = useState<string | null>(null);

  const [appointmentsPage, setAppointmentsPage] = useState<number>(1);
  const [appointmentsFilters, setAppointmentsFilters] = useState<PatientAppointmentsFilters>({
    desde: "",
    hasta: "",
    id_estado_cita: 0,
    id_sede: 0,
    profesional: "",
  });

  const { data: estadosCita } = useQuery<EstadoCita[]>({
    queryKey: ["estados-cita"],
    queryFn: fetchEstadosCita,
  });

  const { data: sedes } = useQuery<Sede[]>({
    queryKey: ["sedes"],
    queryFn: fetchSedes,
  });

  const {
    data: patientAppointments,
    isLoading: loadingPatientAppointments,
    isError: patientAppointmentsError,
  } = useQuery<PatientAppointmentsResponse>({
    queryKey: ["patient-appointments", id, appointmentsPage, appointmentsFilters],
    enabled: !!id,
    queryFn: () =>
      fetchPatientAppointments(String(id), {
        page: appointmentsPage,
        filters: {
          desde: appointmentsFilters.desde?.trim() || undefined,
          hasta: appointmentsFilters.hasta?.trim() || undefined,
          id_estado_cita:
            appointmentsFilters.id_estado_cita && appointmentsFilters.id_estado_cita > 0
              ? appointmentsFilters.id_estado_cita
              : undefined,
          id_sede:
            appointmentsFilters.id_sede && appointmentsFilters.id_sede > 0
              ? appointmentsFilters.id_sede
              : undefined,
          profesional: appointmentsFilters.profesional?.trim() || undefined,
        },
      }),
  });

  const appointmentsTotalPages = patientAppointments?.pagination.totalPages ?? 1;

  const companionMutation = useMutation({
    mutationFn: () =>
      createCompanion(String(id), {
        nombre: companionForm.nombre,
        relacion_con_paciente: companionForm.relacion_con_paciente || undefined,
        telefono: companionForm.telefono || undefined,
        direccion: companionForm.direccion || undefined,
      }),
    onSuccess: async () => {
      setCompanionForm({ nombre: "", relacion_con_paciente: "", telefono: "", direccion: "" });
      setCompanionError(null);
      await queryClient.invalidateQueries({ queryKey: ["companions", id] });
    },
    onError: () => {
      setCompanionError("No se pudo registrar el contacto de emergencia. Intente de nuevo.");
    },
  });

  const tabButtonClasses = (tab: typeof activeTab) =>
    tab === activeTab
      ? "rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
      : "rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100";

  const estadoBadgeClasses = (activo?: boolean) => {
    const base =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border";
    if (activo === false) return `${base} border-slate-200 bg-slate-50 text-slate-500`;
    return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
  };

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Detalle del paciente
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Consulta de la información básica del paciente.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/patients")}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Volver al listado
            </button>
            <button
              type="button"
              onClick={() => router.push(`/patients/${id}/edit`)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Editar paciente
            </button>
            <button
              type="button"
              onClick={() => router.push(`/patients/${id}/records`)}
              className="rounded-lg border border-sky-500 px-3 py-1.5 text-xs font-medium text-sky-700 shadow-sm transition hover:bg-sky-50"
            >
              Historias clínicas
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {isLoading && <p className="text-sm text-slate-500">Cargando información...</p>}

          {isError && !isLoading && (
            <p className="text-sm text-red-600">
              Ocurrió un error al cargar la información del paciente.
            </p>
          )}

          {!isLoading && !isError && !data && (
            <p className="text-sm text-slate-500">Paciente no encontrado.</p>
          )}

          {data && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("datos")}
                    className={tabButtonClasses("datos")}
                  >
                    Datos
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("acompanantes")}
                    className={tabButtonClasses("acompanantes")}
                  >
                    Contacto de Emergencia
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("citas")}
                    className={tabButtonClasses("citas")}
                  >
                    Citas
                  </button>
                </div>

                <span className={estadoBadgeClasses(data.activo)}>
                  {data.activo === false ? "Inactivo" : "Activo"}
                </span>
              </div>

              {activeTab === "datos" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1 text-sm">
                    <p className="text-xs font-semibold uppercase text-slate-500">Identificación</p>
                    <p className="text-slate-800">
                      <span className="font-medium">{data.tipos_documento?.codigo ?? ""}</span>{" "}
                      {data.numero_documento}
                    </p>
                    <p className="text-slate-800">
                      <span className="font-medium">Nombre completo: </span>
                      {data.nombres} {data.apellidos}
                    </p>
                    <p className="text-slate-800">
                      <span className="font-medium">Fecha de nacimiento: </span>
                      {data.fecha_nacimiento}
                    </p>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-xs font-semibold uppercase text-slate-500">Contacto y ubicación</p>
                    <p className="text-slate-800">
                      <span className="font-medium">Correo: </span>
                      {data.email?.trim() || "No registrado"}
                    </p>
                    <p className="text-slate-800">
                      <span className="font-medium">Teléfono: </span>
                      {data.telefono?.trim() || "No registrado"}
                    </p>
                    <p className="text-slate-800">
                      <span className="font-medium">Dirección: </span>
                      {data.direccion?.trim() || "No registrada"}
                    </p>
                    <p className="text-slate-800">
                      <span className="font-medium">Sede: </span>
                      {data.sedes?.nombre ?? "No registrada"}
                    </p>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-xs font-semibold uppercase text-slate-500">Clasificación</p>
                    <p className="text-slate-800">
                      <span className="font-medium">Tipo de usuario: </span>
                      {data.tipos_usuario?.descripcion ?? "No registrado"}
                    </p>
                    <p className="text-slate-800">
                      <span className="font-medium">Programa/Área: </span>
                      {data.programas_academicos?.nombre ?? "No registrado"}
                    </p>
                    <p className="text-slate-800">
                      <span className="font-medium">Género: </span>
                      {data.generos?.descripcion ?? "No registrado"}
                    </p>
                    <p className="text-slate-800">
                      <span className="font-medium">Estado civil: </span>
                      {data.estados_civiles?.descripcion ?? "No registrado"}
                    </p>
                    <p className="text-slate-800">
                      <span className="font-medium">Tipo de sangre: </span>
                      {data.tipos_sangre?.descripcion ?? "No registrado"}
                    </p>
                    <p className="text-slate-800">
                      <span className="font-medium">EPS: </span>
                      {data.eps?.nombre ?? "No registrada"}
                    </p>
                  </div>

                  <div className="space-y-1 text-sm md:col-span-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">Condición particular</p>
                    <p className="whitespace-pre-line text-slate-800">
                      {data.condicion_particular ?? "Sin observaciones"}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "acompanantes" && (
                <div className="space-y-2 text-sm">
                  {loadingCompanions && (
                    <p className="text-sm text-slate-500">Cargando contacto de emergencia...</p>
                  )}

                  {companionsError && !loadingCompanions && (
                    <p className="text-sm text-red-600">
                      Ocurrió un error al cargar el contacto de emergencia.
                    </p>
                  )}

                  {!loadingCompanions && !companionsError && (companions?.length ?? 0) === 0 && (
                    <p className="text-sm text-slate-500">No hay contacto de emergencia registrado.</p>
                  )}

                  {(companions?.length ?? 0) > 0 && (
                    <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-slate-50">
                      {companions?.map((acomp) => (
                        <li
                          key={acomp.id_acompanante}
                          className="flex items-start justify-between gap-3 px-3 py-2"
                        >
                          <div>
                            <p className="text-xs font-medium text-slate-800">
                              {acomp.nombre}
                              {acomp.relacion_con_paciente
                                ? ` (${acomp.relacion_con_paciente})`
                                : null}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              <span className="font-medium">Teléfono:</span>{" "}
                              {acomp.telefono?.trim() || "No registrado"}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              <span className="font-medium">Dirección:</span>{" "}
                              {acomp.direccion?.trim() || "No registrada"}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => router.push(`/patients/${id}/companions`)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                    >
                      Gestionar contacto de emergencia
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "citas" && (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-5">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-600">Desde</label>
                      <input
                        type="date"
                        value={appointmentsFilters.desde ?? ""}
                        onChange={(e) => {
                          setAppointmentsPage(1);
                          setAppointmentsFilters((prev) => ({ ...prev, desde: e.target.value }));
                        }}
                        className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-600">Hasta</label>
                      <input
                        type="date"
                        value={appointmentsFilters.hasta ?? ""}
                        onChange={(e) => {
                          setAppointmentsPage(1);
                          setAppointmentsFilters((prev) => ({ ...prev, hasta: e.target.value }));
                        }}
                        className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-600">Estado</label>
                      <select
                        value={appointmentsFilters.id_estado_cita ?? 0}
                        onChange={(e) => {
                          setAppointmentsPage(1);
                          setAppointmentsFilters((prev) => ({
                            ...prev,
                            id_estado_cita: Number(e.target.value),
                          }));
                        }}
                        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      >
                        <option value={0}>Todos</option>
                        {(estadosCita ?? []).map((e) => (
                          <option key={e.id_estado_cita} value={e.id_estado_cita}>
                            {e.descripcion}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-600">Sede</label>
                      <select
                        value={appointmentsFilters.id_sede ?? 0}
                        onChange={(e) => {
                          setAppointmentsPage(1);
                          setAppointmentsFilters((prev) => ({
                            ...prev,
                            id_sede: Number(e.target.value),
                          }));
                        }}
                        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      >
                        <option value={0}>Todas</option>
                        {(sedes ?? []).map((s) => (
                          <option key={s.id_sede} value={s.id_sede}>
                            {s.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-600">Profesional</label>
                      <input
                        type="text"
                        value={appointmentsFilters.profesional ?? ""}
                        onChange={(e) => {
                          setAppointmentsPage(1);
                          setAppointmentsFilters((prev) => ({
                            ...prev,
                            profesional: e.target.value,
                          }));
                        }}
                        placeholder="Nombre del profesional"
                        className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  {loadingPatientAppointments && (
                    <p className="text-sm text-slate-500">Cargando historial de citas...</p>
                  )}

                  {patientAppointmentsError && !loadingPatientAppointments && (
                    <p className="text-sm text-red-600">Ocurrió un error al cargar el historial.</p>
                  )}

                  {!loadingPatientAppointments &&
                    !patientAppointmentsError &&
                    (patientAppointments?.data?.length ?? 0) === 0 && (
                      <p className="text-sm text-slate-500">
                        No hay citas para los filtros seleccionados.
                      </p>
                    )}

                  {!loadingPatientAppointments &&
                    !patientAppointmentsError &&
                    (patientAppointments?.data?.length ?? 0) > 0 && (
                      <div className="space-y-3">
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-left text-[11px]">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              <tr>
                                <th className="px-3 py-2">Fecha / Hora</th>
                                <th className="px-3 py-2">Profesional</th>
                                <th className="px-3 py-2">Sede</th>
                                <th className="px-3 py-2">Tipo</th>
                                <th className="px-3 py-2">Estado</th>
                                <th className="px-3 py-2 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                              {(patientAppointments?.data ?? []).map(
                                (cita: PatientAppointmentListItem) => (
                                  <tr key={cita.id_cita} className="hover:bg-slate-50">
                                    <td className="px-3 py-2">
                                      {new Date(cita.fecha_hora_inicio).toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2">
                                      {cita.profesional_nombre ?? "No registrado"}
                                    </td>
                                    <td className="px-3 py-2">{cita.sede ?? "No registrada"}</td>
                                    <td className="px-3 py-2">
                                      {cita.tipo_cita ?? "No registrada"}
                                    </td>
                                    <td className="px-3 py-2">
                                      <span className={getEstadoCitaBadgeClasses(cita.estado_cita)}>
                                        {cita.estado_cita ?? "No registrado"}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          router.push(`/appointments/${cita.id_cita}/edit`)
                                        }
                                        className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                                      >
                                        Editar
                                      </button>
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-slate-500">
                            Página {patientAppointments?.pagination.page} de{" "}
                            {appointmentsTotalPages}
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={appointmentsPage <= 1}
                              onClick={() => setAppointmentsPage((p) => Math.max(p - 1, 1))}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Anterior
                            </button>
                            <button
                              type="button"
                              disabled={appointmentsPage >= appointmentsTotalPages}
                              onClick={() =>
                                setAppointmentsPage((p) =>
                                  Math.min(p + 1, appointmentsTotalPages),
                                )
                              }
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
