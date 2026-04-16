"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getProfessionalById } from "@/services/professionals";
import { cancelAppointment, fetchAppointmentsByProfessional } from "@/services/appointments";
import {
  createProfessionalAvailability,
  deleteProfessionalAvailability,
  fetchProfessionalAvailability,
  updateProfessionalAvailability,
} from "@/services/professional-availability";
import { fetchSedes, type Sede } from "@/services/catalogs";
import type { ProfessionalDetail } from "@/types/professionals";
import type { ProfessionalAppointmentListItem } from "@/types/appointments";
import type {
  ProfessionalAvailability,
  ProfessionalAvailabilityCreateInput,
} from "@/types/professional-availability";
import { getEstadoCitaBadgeClasses } from "@/lib/appointment-status";
import Swal from "sweetalert2";

export default function ProfessionalDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const queryClient = useQueryClient();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const [activeTab, setActiveTab] = useState<"datos" | "disponibilidad" | "citas">("datos");

  const [availabilityForm, setAvailabilityForm] = useState<ProfessionalAvailabilityCreateInput>({
    id_sede: 0,
    dia_semana: 1,
    hora_inicio: "08:00",
    hora_fin: "12:00",
    capacidad_simultanea: 1,
    fecha_inicio_vigencia: "",
    fecha_fin_vigencia: "",
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: (params: { availabilityId: number; input: ProfessionalAvailabilityCreateInput }) =>
      updateProfessionalAvailability(String(id), params.availabilityId, params.input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-availability", id] });
      setAvailabilityFeedback({
        type: "success",
        message: "Disponibilidad actualizada correctamente.",
      });
      setEditingAvailability(null);
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as any).response?.data?.message
          : null;
      setAvailabilityFeedback({
        type: "error",
        message:
          typeof message === "string" && message.trim().length > 0
            ? message
            : "No se pudo actualizar. Verifica la información e intenta de nuevo.",
      });
    },
  });

  const [availabilityFeedback, setAvailabilityFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [availabilityFilterSedeId, setAvailabilityFilterSedeId] = useState<number>(0);
  const [availabilityFilterDate, setAvailabilityFilterDate] = useState<string>("");
  const [availabilityPage, setAvailabilityPage] = useState<number>(1);
  const AVAILABILITY_PAGE_SIZE = 10;

  const [editingAvailability, setEditingAvailability] = useState<ProfessionalAvailability | null>(null);
  const [editAvailabilityForm, setEditAvailabilityForm] = useState<ProfessionalAvailabilityCreateInput>({
    id_sede: 0,
    dia_semana: 1,
    hora_inicio: "08:00",
    hora_fin: "12:00",
    capacidad_simultanea: 1,
    fecha_inicio_vigencia: "",
    fecha_fin_vigencia: "",
  });

  const dayLabel = (day: number) => {
    const map: Record<number, string> = {
      1: "Lunes",
      2: "Martes",
      3: "Miércoles",
      4: "Jueves",
      5: "Viernes",
      6: "Sábado",
      7: "Domingo",
    };
    return map[day] ?? String(day);
  };

  const { data, isLoading, isError } = useQuery<ProfessionalDetail | null>({
    queryKey: ["professional", id],
    enabled: !!id,
    queryFn: () => getProfessionalById(String(id)),
  });

  const hasData = !!data;

  const {
    data: appointments,
    isLoading: loadingAppointments,
    isError: appointmentsError,
  } = useQuery<ProfessionalAppointmentListItem[]>({
    queryKey: ["professional-appointments", id, selectedDate],
    enabled: !!id,
    queryFn: () => fetchAppointmentsByProfessional(String(id), { date: selectedDate }),
  });

  const { data: sedes } = useQuery<Sede[]>({
    queryKey: ["sedes"],
    queryFn: fetchSedes,
  });


  const {
    data: availability,
    isLoading: loadingAvailability,
    isError: availabilityError,
  } = useQuery<ProfessionalAvailability[]>({
    queryKey: ["professional-availability", id],
    enabled: !!id,
    queryFn: () => fetchProfessionalAvailability(String(id)),
  });

  const filteredAvailability = useMemo(() => {
    const items = availability ?? [];
    const sedeId = availabilityFilterSedeId;
    const date = availabilityFilterDate.trim();

    const filtered = items.filter((a) => {
      if (sedeId > 0 && a.id_sede !== sedeId) return false;
      if (!date) return true;
      const startOk = !a.fecha_inicio_vigencia || a.fecha_inicio_vigencia <= date;
      const endOk = !a.fecha_fin_vigencia || a.fecha_fin_vigencia >= date;
      return startOk && endOk;
    });

    return filtered;
  }, [availability, availabilityFilterSedeId, availabilityFilterDate]);

  const availabilityTotalPages = useMemo(() => {
    return Math.max(Math.ceil(filteredAvailability.length / AVAILABILITY_PAGE_SIZE), 1);
  }, [filteredAvailability.length]);

  const availabilityPageItems = useMemo(() => {
    const page = Math.min(Math.max(availabilityPage, 1), availabilityTotalPages);
    const start = (page - 1) * AVAILABILITY_PAGE_SIZE;
    return filteredAvailability.slice(start, start + AVAILABILITY_PAGE_SIZE);
  }, [filteredAvailability, availabilityPage, availabilityTotalPages]);

  const cancelMutation = useMutation({
    mutationFn: ({ citaId, codigoEstado }: { citaId: number; codigoEstado: string }) =>
      cancelAppointment(citaId, codigoEstado),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["professional-appointments", id, selectedDate],
      });
    },
  });

  const tabButtonClasses = (tab: typeof activeTab) =>
    tab === activeTab
      ? "rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
      : "rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100";

  const createAvailabilityMutation = useMutation({
    mutationFn: async (input: ProfessionalAvailabilityCreateInput) => {
      if (Number(input.dia_semana) === 0) {
        const base = { ...input };
        return Promise.all(
          [1, 2, 3, 4, 5, 6, 7].map((d) =>
            createProfessionalAvailability(String(id), {
              ...base,
              dia_semana: d,
            }),
          ),
        );
      }
      return createProfessionalAvailability(String(id), input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-availability", id] });
      setAvailabilityFeedback({
        type: "success",
        message: "Disponibilidad guardada correctamente.",
      });
    },
    onError: () => {
      setAvailabilityFeedback({
        type: "error",
        message: "No se pudo guardar. Verifica la sede, día y horario e intenta de nuevo.",
      });
    },
  });

  const deleteAvailabilityMutation = useMutation({
    mutationFn: (availabilityId: number) =>
      deleteProfessionalAvailability(String(id), availabilityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-availability", id] });
      setAvailabilityFeedback({
        type: "success",
        message: "Disponibilidad eliminada correctamente.",
      });
    },
    onError: () => {
      setAvailabilityFeedback({
        type: "error",
        message: "No se pudo eliminar. Intenta de nuevo.",
      });
    },
  });

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Detalle del profesional
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Información básica del profesional y base para la agenda de citas.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/professionals/${id}/edit`)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => router.push("/professionals")}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Volver al listado
            </button>
          </div>
        </div>
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
              onClick={() => setActiveTab("disponibilidad")}
              className={tabButtonClasses("disponibilidad")}
            >
              Disponibilidad
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("citas")}
              className={tabButtonClasses("citas")}
            >
              Citas
            </button>
          </div>
        </div>

        {activeTab === "datos" && (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {isLoading && (
              <p className="text-sm text-slate-500">Cargando información del profesional...</p>
            )}

            {isError && !isLoading && (
              <p className="text-sm text-red-600">
                Ocurrió un error al cargar la información del profesional.
              </p>
            )}

            {!isLoading && !isError && !hasData && (
              <p className="text-sm text-slate-500">Profesional no encontrado.</p>
            )}

            {!isLoading && !isError && hasData && data && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1 text-sm">
                  <p className="text-xs font-semibold uppercase text-slate-500">Identificación</p>
                  <p className="text-sm font-medium text-slate-900">{data.nombre_completo}</p>
                  {data.email && (
                    <p className="text-xs text-slate-600">{data.email}</p>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  <p className="text-xs font-semibold uppercase text-slate-500">Estado</p>
                  <span
                    className={
                      data.activo
                        ? "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                        : "inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                    }
                  >
                    {data.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <p className="text-xs font-semibold uppercase text-slate-500">Especialidad</p>
                  <p className="text-sm text-slate-800">
                    {data.especialidad?.nombre ?? "No registrada"}
                  </p>
                  {data.especialidad?.descripcion && (
                    <p className="text-xs text-slate-600">{data.especialidad.descripcion}</p>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  <p className="text-xs font-semibold uppercase text-slate-500">Sede</p>
                  <p className="text-sm text-slate-800">{data.sede?.nombre ?? "No registrada"}</p>
                  {(data.sede?.ciudad || data.sede?.departamento) && (
                    <p className="text-xs text-slate-600">
                      {[data.sede?.ciudad, data.sede?.departamento].filter(Boolean).join(" - ")}
                    </p>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  <p className="text-xs font-semibold uppercase text-slate-500">Registro médico</p>
                  <p className="text-sm text-slate-800">{data.registro_medico ?? "No registrado"}</p>
                </div>

                <div className="space-y-1 text-sm md:col-span-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">Firma digital</p>
                  {!data.firma_digital ? (
                    <p className="text-sm text-slate-800">No cargada</p>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          void Swal.fire({
                            title: "Firma digital",
                            imageUrl: data.firma_digital ?? undefined,
                            imageAlt: "Firma digital",
                            showCloseButton: true,
                            showConfirmButton: false,
                            background: "#ffffff",
                            width: 700,
                            imageWidth: 640,
                          });
                        }}
                        className="text-left text-xs font-medium text-sky-700 hover:underline"
                      >
                        Ver firma
                      </button>
                      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-2">
                        <img
                          src={data.firma_digital}
                          alt="Firma digital"
                          className="max-h-40 w-auto max-w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "disponibilidad" && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Disponibilidad</p>
                <p className="text-xs text-slate-600">
                  Configura los horarios en los que el profesional atiende por sede.
                </p>
              </div>
            </div>

          {availabilityFeedback && (
            <p
              className={
                availabilityFeedback.type === "success"
                  ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
                  : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
              }
            >
              {availabilityFeedback.message}
            </p>
          )}

          <div className="grid gap-3 md:grid-cols-6">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-medium text-slate-600">Sede</label>
              <select
                value={availabilityForm.id_sede}
                onChange={(e) =>
                  setAvailabilityForm((prev) => ({
                    ...prev,
                    id_sede: Number(e.target.value),
                  }))
                }
                className="h-8 rounded-md border border-slate-300 bg-white px-2 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value={0}>Seleccione</option>
                {(sedes ?? []).map((s) => (
                  <option key={s.id_sede} value={s.id_sede}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Día</label>
              <select
                value={availabilityForm.dia_semana}
                onChange={(e) =>
                  setAvailabilityForm((prev) => ({
                    ...prev,
                    dia_semana: Number(e.target.value),
                  }))
                }
                className="h-8 rounded-md border border-slate-300 bg-white px-2 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value={0}>Todos los días</option>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    {dayLabel(d)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Inicio</label>
              <input
                type="time"
                value={availabilityForm.hora_inicio}
                onChange={(e) =>
                  setAvailabilityForm((prev) => ({
                    ...prev,
                    hora_inicio: e.target.value,
                  }))
                }
                className="h-8 rounded-md border border-slate-300 px-2 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Fin</label>
              <input
                type="time"
                value={availabilityForm.hora_fin}
                onChange={(e) =>
                  setAvailabilityForm((prev) => ({
                    ...prev,
                    hora_fin: e.target.value,
                  }))
                }
                className="h-8 rounded-md border border-slate-300 px-2 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-3">
              <label className="text-xs font-medium text-slate-600">Vigencia</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={availabilityForm.fecha_inicio_vigencia ?? ""}
                  required
                  onChange={(e) =>
                    setAvailabilityForm((prev) => ({
                      ...prev,
                      fecha_inicio_vigencia: e.target.value,
                    }))
                  }
                  className="h-8 rounded-md border border-slate-300 px-2 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <input
                  type="date"
                  value={availabilityForm.fecha_fin_vigencia ?? ""}
                  required
                  onChange={(e) =>
                    setAvailabilityForm((prev) => ({
                      ...prev,
                      fecha_fin_vigencia: e.target.value,
                    }))
                  }
                  className="h-8 rounded-md border border-slate-300 px-2 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={createAvailabilityMutation.isPending || !id || availabilityForm.id_sede <= 0}
              onClick={() => {
                if (!availabilityForm.fecha_inicio_vigencia?.trim()) {
                  Swal.fire({
                    title: "Vigencia requerida",
                    text: "Debe diligenciar la fecha de inicio de vigencia.",
                    icon: "warning",
                    confirmButtonText: "Aceptar",
                    confirmButtonColor: "#2563eb",
                  });
                  return;
                }

                if (!availabilityForm.fecha_fin_vigencia?.trim()) {
                  Swal.fire({
                    title: "Vigencia requerida",
                    text: "Debe diligenciar la fecha fin de vigencia.",
                    icon: "warning",
                    confirmButtonText: "Aceptar",
                    confirmButtonColor: "#2563eb",
                  });
                  return;
                }

                const payload: ProfessionalAvailabilityCreateInput = {
                  ...availabilityForm,
                  fecha_inicio_vigencia: availabilityForm.fecha_inicio_vigencia,
                  fecha_fin_vigencia: availabilityForm.fecha_fin_vigencia,
                };

                createAvailabilityMutation.mutate(payload);
              }}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createAvailabilityMutation.isPending ? "Guardando..." : "Agregar disponibilidad"}
            </button>
          </div>

          {loadingAvailability && (
            <p className="text-sm text-slate-500">Cargando disponibilidad...</p>
          )}

          {availabilityError && !loadingAvailability && (
            <p className="text-sm text-red-600">
              Ocurrió un error al cargar la disponibilidad.
            </p>
          )}

          {!loadingAvailability && !availabilityError && (availability?.length ?? 0) === 0 && (
            <p className="text-sm text-slate-500">No hay disponibilidad registrada.</p>
          )}

          {!loadingAvailability && !availabilityError && (availability?.length ?? 0) > 0 && (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">Filtrar por sede</label>
                  <select
                    value={availabilityFilterSedeId}
                    onChange={(e) => {
                      setAvailabilityFilterSedeId(Number(e.target.value));
                      setAvailabilityPage(1);
                    }}
                    className="h-8 rounded-md border border-slate-300 bg-white px-2 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
                  <label className="text-xs font-medium text-slate-600">Filtrar por fecha</label>
                  <input
                    type="date"
                    value={availabilityFilterDate}
                    onChange={(e) => {
                      setAvailabilityFilterDate(e.target.value);
                      setAvailabilityPage(1);
                    }}
                    className="h-8 rounded-md border border-slate-300 bg-white px-2 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <p className="text-[11px] text-slate-500">Muestra disponibilidades vigentes para esa fecha.</p>
                </div>

                <div className="flex items-end justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAvailabilityFilterSedeId(0);
                      setAvailabilityFilterDate("");
                      setAvailabilityPage(1);
                    }}
                    className="h-8 rounded-md border border-slate-300 bg-white px-3 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>

              {filteredAvailability.length === 0 ? (
                <p className="text-sm text-slate-500">No hay resultados con los filtros seleccionados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-[11px]">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Sede</th>
                    <th className="px-3 py-2">Día</th>
                    <th className="px-3 py-2">Horario</th>
                    <th className="px-3 py-2">Vigencia desde</th>
                    <th className="px-3 py-2">Vigencia hasta</th>
                    <th className="px-3 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                  {availabilityPageItems.map((a) => (
                    <tr key={a.id_disponibilidad} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        {(sedes ?? []).find((s) => s.id_sede === a.id_sede)?.nombre ??
                          (a.id_sede ? `Sede ${a.id_sede}` : "No registrada")}
                      </td>
                      <td className="px-3 py-2">{dayLabel(a.dia_semana)}</td>
                      <td className="px-3 py-2">{a.hora_inicio} - {a.hora_fin}</td>
                      <td className="px-3 py-2">
                        {a.fecha_inicio_vigencia || (!a.fecha_inicio_vigencia && !a.fecha_fin_vigencia)
                          ? a.fecha_inicio_vigencia ?? "Sin vigencia"
                          : "-"}
                      </td>
                      <td className="px-3 py-2">
                        {a.fecha_fin_vigencia || (!a.fecha_inicio_vigencia && !a.fecha_fin_vigencia)
                          ? a.fecha_fin_vigencia ?? "Sin vigencia"
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={deleteAvailabilityMutation.isPending || updateAvailabilityMutation.isPending}
                            onClick={() => {
                              setAvailabilityFeedback(null);
                              setEditingAvailability(a);
                              setEditAvailabilityForm({
                                id_sede: a.id_sede ?? 0,
                                dia_semana: a.dia_semana,
                                hora_inicio: a.hora_inicio,
                                hora_fin: a.hora_fin,
                                capacidad_simultanea: a.capacidad_simultanea,
                                fecha_inicio_vigencia: a.fecha_inicio_vigencia ?? "",
                                fecha_fin_vigencia: a.fecha_fin_vigencia ?? "",
                              });
                            }}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            disabled={deleteAvailabilityMutation.isPending || updateAvailabilityMutation.isPending}
                            onClick={async () => {
                              const result = await Swal.fire({
                                title: "¿Eliminar disponibilidad?",
                                text: "Esta acción no se puede deshacer.",
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonText: "Eliminar",
                                cancelButtonText: "Cancelar",
                                confirmButtonColor: "#ef4444",
                                cancelButtonColor: "#6b7280",
                              });

                              if (!result.isConfirmed) return;
                              deleteAvailabilityMutation.mutate(a.id_disponibilidad);
                            }}
                            className="rounded-lg border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                  </table>
                </div>
              )}

              {filteredAvailability.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-600">
                    Mostrando {(availabilityPage - 1) * AVAILABILITY_PAGE_SIZE + 1} - {Math.min(availabilityPage * AVAILABILITY_PAGE_SIZE, filteredAvailability.length)} de {filteredAvailability.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={availabilityPage <= 1}
                      onClick={() => setAvailabilityPage((p) => Math.max(p - 1, 1))}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Anterior
                    </button>
                    <span className="text-[11px] text-slate-700">
                      Página {availabilityPage} / {availabilityTotalPages}
                    </span>
                    <button
                      type="button"
                      disabled={availabilityPage >= availabilityTotalPages}
                      onClick={() => setAvailabilityPage((p) => Math.min(p + 1, availabilityTotalPages))}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {editingAvailability && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Editar disponibilidad</h2>
                  <p className="mt-0.5 text-xs text-slate-600">Disponibilidad #{editingAvailability.id_disponibilidad}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingAvailability(null)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cerrar
                </button>
              </div>

              <div className="space-y-3 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">Sede</label>
                    <select
                      value={editAvailabilityForm.id_sede}
                      onChange={(e) =>
                        setEditAvailabilityForm((prev) => ({
                          ...prev,
                          id_sede: Number(e.target.value),
                        }))
                      }
                      className="h-8 rounded-md border border-slate-300 bg-white px-2 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value={0}>Seleccione</option>
                      {(sedes ?? []).map((s) => (
                        <option key={s.id_sede} value={s.id_sede}>
                          {s.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">Día</label>
                    <select
                      value={editAvailabilityForm.dia_semana}
                      onChange={(e) =>
                        setEditAvailabilityForm((prev) => ({
                          ...prev,
                          dia_semana: Number(e.target.value),
                        }))
                      }
                      className="h-8 rounded-md border border-slate-300 bg-white px-2 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <option key={d} value={d}>
                          {dayLabel(d)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">Inicio</label>
                    <input
                      type="time"
                      value={editAvailabilityForm.hora_inicio}
                      onChange={(e) =>
                        setEditAvailabilityForm((prev) => ({
                          ...prev,
                          hora_inicio: e.target.value,
                        }))
                      }
                      className="h-8 rounded-md border border-slate-300 px-2 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">Fin</label>
                    <input
                      type="time"
                      value={editAvailabilityForm.hora_fin}
                      onChange={(e) =>
                        setEditAvailabilityForm((prev) => ({
                          ...prev,
                          hora_fin: e.target.value,
                        }))
                      }
                      className="h-8 rounded-md border border-slate-300 px-2 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs font-medium text-slate-600">Vigencia (opcional)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={editAvailabilityForm.fecha_inicio_vigencia ?? ""}
                        onChange={(e) =>
                          setEditAvailabilityForm((prev) => ({
                            ...prev,
                            fecha_inicio_vigencia: e.target.value,
                          }))
                        }
                        className="h-8 rounded-md border border-slate-300 px-2 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                      <input
                        type="date"
                        value={editAvailabilityForm.fecha_fin_vigencia ?? ""}
                        onChange={(e) =>
                          setEditAvailabilityForm((prev) => ({
                            ...prev,
                            fecha_fin_vigencia: e.target.value,
                          }))
                        }
                        className="h-8 rounded-md border border-slate-300 px-2 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAvailability(null)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={updateAvailabilityMutation.isPending || editAvailabilityForm.id_sede <= 0}
                    onClick={() => {
                      const payload: ProfessionalAvailabilityCreateInput = {
                        ...editAvailabilityForm,
                        fecha_inicio_vigencia:
                          editAvailabilityForm.fecha_inicio_vigencia &&
                          editAvailabilityForm.fecha_inicio_vigencia.trim().length > 0
                            ? editAvailabilityForm.fecha_inicio_vigencia
                            : undefined,
                        fecha_fin_vigencia:
                          editAvailabilityForm.fecha_fin_vigencia &&
                          editAvailabilityForm.fecha_fin_vigencia.trim().length > 0
                            ? editAvailabilityForm.fecha_fin_vigencia
                            : undefined,
                      };

                      updateAvailabilityMutation.mutate({
                        availabilityId: editingAvailability.id_disponibilidad,
                        input: payload,
                      });
                    }}
                    className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {updateAvailabilityMutation.isPending ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "citas" && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Agenda de citas</p>
              <p className="text-xs text-slate-600">
                Listado de todas las citas asociadas a este profesional.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 rounded-md border border-slate-300 px-2 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => router.push(`/appointments/new?profesionalId=${id}`)}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-sky-700"
              >
                Nueva cita
              </button>
            </div>
          </div>

          {loadingAppointments && (
            <p className="text-sm text-slate-500">Cargando citas...</p>
          )}

          {appointmentsError && !loadingAppointments && (
            <p className="text-sm text-red-600">
              Ocurrió un error al cargar las citas del profesional.
            </p>
          )}

          {!loadingAppointments && !appointmentsError && (appointments?.length ?? 0) === 0 && (
            <p className="text-sm text-slate-500">No hay citas registradas para este profesional.</p>
          )}

          {!loadingAppointments && !appointmentsError && (appointments?.length ?? 0) > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-[11px]">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Fecha / Hora</th>
                    <th className="px-3 py-2">Paciente</th>
                    <th className="px-3 py-2">Documento</th>
                    <th className="px-3 py-2">Tipo de cita</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                  {appointments!.map((cita) => {
                    const isCancelled =
                      cita.estado_cita === "Cita cancelada por el paciente" ||
                      cita.estado_cita === "Cita cancelada por la institución o profesional";

                    return (
                      <tr key={cita.id_cita} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          {new Date(cita.fecha_hora_inicio).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">{cita.paciente_nombre}</td>
                        <td className="px-3 py-2">{cita.paciente_documento}</td>
                        <td className="px-3 py-2">{cita.tipo_cita ?? "No registrada"}</td>
                        <td className="px-3 py-2">
                          <span className={getEstadoCitaBadgeClasses(cita.estado_cita)}>
                            {cita.estado_cita ?? "No registrado"}
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
                                    citaId: cita.id_cita,
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
        </div>
        )}
      </section>
    </AppShell>
  );
}
