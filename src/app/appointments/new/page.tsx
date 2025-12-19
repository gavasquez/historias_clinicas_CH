"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import axios from "axios";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/lib/api";
import {
  dateOnlyIsoFromLocal,
  dayOfWeek1To7,
  minutesFromHHMM,
  minutesFromLocalTime,
} from "@/lib/date-time";
import { useAppointmentFormCatalogs } from "@/hooks/use-appointment-form-catalogs";
import type { AppointmentFormState, SelectOption } from "@/types/appointments-forms";
import { fetchProfessionalAvailability } from "@/services/professional-availability";
import type { ProfessionalAvailability } from "@/types/professional-availability";

const Select = dynamic(() => import("react-select"), { ssr: false });

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profesionalIdFromQuery = searchParams.get("profesionalId");

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [form, setForm] = useState<AppointmentFormState>({
    id_paciente: "",
    id_profesional: profesionalIdFromQuery ? String(profesionalIdFromQuery) : "",
    id_sede: "",
    id_tipo_cita: "",
    id_estado_cita: "",
    fecha_hora_inicio: "",
    fecha_hora_fin: "",
    motivo: "",
    canal_recordatorio: "",
  });

  const [error, setError] = useState<string | null>(null);

  const DEFAULT_APPOINTMENT_DURATION_MINUTES = 30;

  const validateProfessionalAvailability = async () => {
    const professionalId = Number(form.id_profesional);
    const sedeId = Number(form.id_sede);

    if (!Number.isInteger(professionalId) || professionalId <= 0) return;
    if (!Number.isInteger(sedeId) || sedeId <= 0) return;
    if (!form.fecha_hora_inicio) return;

    const start = new Date(form.fecha_hora_inicio);
    if (Number.isNaN(start.getTime())) return;

    let end: Date;
    if (form.fecha_hora_fin) {
      const parsedEnd = new Date(form.fecha_hora_fin);
      end = Number.isNaN(parsedEnd.getTime())
        ? new Date(start.getTime() + DEFAULT_APPOINTMENT_DURATION_MINUTES * 60_000)
        : parsedEnd;
    } else {
      end = new Date(start.getTime() + DEFAULT_APPOINTMENT_DURATION_MINUTES * 60_000);
    }

    if (end.getTime() <= start.getTime()) {
      throw new Error("La fecha y hora fin debe ser mayor que la fecha y hora inicio");
    }

    const availability: ProfessionalAvailability[] = await fetchProfessionalAvailability(
      professionalId,
      { idSede: sedeId },
    );

    const apptDate = dateOnlyIsoFromLocal(start);

    const dia = dayOfWeek1To7(start);
    const startMin = minutesFromLocalTime(start);
    const endMin = minutesFromLocalTime(end);

    const ok = availability
      .filter((a) => {
        if (a.dia_semana !== dia) return false;
        if (a.fecha_inicio_vigencia && apptDate < a.fecha_inicio_vigencia) return false;
        if (a.fecha_fin_vigencia && apptDate > a.fecha_fin_vigencia) return false;
        return true;
      })
      .some((a) => {
        const aStart = minutesFromHHMM(a.hora_inicio);
        const aEnd = minutesFromHHMM(a.hora_fin);
        if (aStart == null || aEnd == null) return false;
        return startMin >= aStart && endMin <= aEnd;
      });

    if (!ok) {
      throw new Error("El profesional no tiene disponibilidad para esa sede/horario");
    }
  };

  const {
    patientsData,
    professionalsData,
    sedesData,
    tiposCitaData,
    estadosCitaData,
    loadingPatients,
    loadingProfessionals,
  } = useAppointmentFormCatalogs();

  // Estado por defecto: PROGRAMADA, si existe en el catálogo
  useEffect(() => {
    if (!estadosCitaData || estadosCitaData.length === 0) return;
    if (form.id_estado_cita) return;

    const programada = estadosCitaData.find((e) => e.codigo === "PROGRAMADA");
    if (programada) {
      setForm((prev) => ({ ...prev, id_estado_cita: String(programada.id_estado_cita) }));
    }
  }, [estadosCitaData, form.id_estado_cita]);

  const mutation = useMutation({
    mutationFn: async () => {
      const idPacienteNum = Number(form.id_paciente);
      const idProfesionalNum = Number(form.id_profesional);
      const idSedeNum = form.id_sede ? Number(form.id_sede) : undefined;
      const idTipoCitaNum = form.id_tipo_cita ? Number(form.id_tipo_cita) : undefined;
      const idEstadoCitaNum = form.id_estado_cita ? Number(form.id_estado_cita) : undefined;

      return apiClient.post("/appointments", {
        id_paciente: idPacienteNum,
        id_profesional: idProfesionalNum,
        fecha_hora_inicio: form.fecha_hora_inicio,
        fecha_hora_fin: form.fecha_hora_fin || undefined,
        id_sede: idSedeNum,
        id_tipo_cita: idTipoCitaNum,
        id_estado_cita: idEstadoCitaNum,
        canal_recordatorio: form.canal_recordatorio || undefined,
        motivo: form.motivo || undefined,
      });
    },
    onSuccess: () => {
      setError(null);
      router.push("/appointments");
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const apiMessage = (err.response?.data as any)?.message;
        if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
          setError(apiMessage);
          return;
        }
      }
      setError("No se pudo crear la cita. Verifique los datos e intente de nuevo.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.id_paciente.trim() ||
      !form.id_profesional.trim() ||
      !form.id_sede.trim() ||
      !form.id_tipo_cita.trim() ||
      !form.fecha_hora_inicio.trim()
    ) {
      setError("Debe completar paciente, profesional, sede, tipo de cita y fecha/hora de inicio.");
      return;
    }

    try {
      await validateProfessionalAvailability();
    } catch (e) {
      setError(e instanceof Error ? e.message : "El profesional no tiene disponibilidad.");
      return;
    }

    setError(null);

    mutation.mutate();
  };

  if (!isClient) {
    // Evitamos renderizar los Select durante SSR para prevenir hydration mismatch
    return null;
  }

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Nueva cita</h1>
            <p className="mt-1 text-sm text-slate-600">
              Registre una nueva cita asociando un paciente y un profesional.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/appointments")}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Volver al listado
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Paciente <span className="text-red-500">*</span>
              </label>
              <Select
                isClearable
                isSearchable
                classNamePrefix="react-select"
                placeholder={
                  loadingPatients ? "Cargando pacientes..." : "Seleccione un paciente"
                }
                options={(patientsData?.data ?? []).map((p) => ({
                  value: p.id_paciente,
                  label: `${p.numero_documento} - ${p.nombres} ${p.apellidos}`,
                }))}
                value={(() => {
                  const id = form.id_paciente ? Number(form.id_paciente) : null;
                  if (!id) return null;
                  const opts = (patientsData?.data ?? []).map((p) => ({
                    value: p.id_paciente,
                    label: `${p.numero_documento} - ${p.nombres} ${p.apellidos}`,
                  }));
                  return opts.find((o) => o.value === id) ?? null;
                })()}
                onChange={(option: any) => {
                  const selected = option as SelectOption | null;
                  setForm((prev) => ({
                    ...prev,
                    id_paciente: selected ? String(selected.value) : "",
                  }));
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Sede <span className="text-red-500">*</span></label>
              <Select
                isClearable
                isSearchable
                classNamePrefix="react-select"
                placeholder="Seleccione una sede"
                options={(sedesData ?? []).map((sede) => ({
                  value: sede.id_sede,
                  label: sede.nombre,
                }))}
                value={(() => {
                  const id = form.id_sede ? Number(form.id_sede) : null;
                  if (!id) return null;
                  const opts = (sedesData ?? []).map((sede) => ({
                    value: sede.id_sede,
                    label: sede.nombre,
                  }));
                  return opts.find((o) => o.value === id) ?? null;
                })()}
                onChange={(option: any) => {
                  const selected = option as SelectOption | null;
                  setForm((prev) => ({
                    ...prev,
                    id_sede: selected ? String(selected.value) : "",
                  }));
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Tipo de cita <span className="text-red-500">*</span></label>
              <Select
                isClearable
                isSearchable
                classNamePrefix="react-select"
                placeholder="Seleccione un tipo de cita"
                options={(tiposCitaData ?? []).map((tipo) => ({
                  value: tipo.id_tipo_cita,
                  label: tipo.descripcion,
                }))}
                value={(() => {
                  const id = form.id_tipo_cita ? Number(form.id_tipo_cita) : null;
                  if (!id) return null;
                  const opts = (tiposCitaData ?? []).map((tipo) => ({
                    value: tipo.id_tipo_cita,
                    label: tipo.descripcion,
                  }));
                  return opts.find((o) => o.value === id) ?? null;
                })()}
                onChange={(option: any) => {
                  const selected = option as SelectOption | null;
                  setForm((prev) => ({
                    ...prev,
                    id_tipo_cita: selected ? String(selected.value) : "",
                  }));
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Profesional <span className="text-red-500">*</span>
              </label>
              <Select
                isClearable
                isSearchable
                classNamePrefix="react-select"
                placeholder={
                  loadingProfessionals
                    ? "Cargando profesionales..."
                    : "Seleccione un profesional"
                }
                options={(professionalsData?.data ?? []).map((prof) => ({
                  value: prof.id_profesional,
                  label: `${prof.nombre_completo}${
                    prof.especialidad ? ` - ${prof.especialidad}` : ""
                  }`,
                }))}
                value={(() => {
                  const id = form.id_profesional ? Number(form.id_profesional) : null;
                  if (!id) return null;
                  const opts = (professionalsData?.data ?? []).map((prof) => ({
                    value: prof.id_profesional,
                    label: `${prof.nombre_completo}${
                      prof.especialidad ? ` - ${prof.especialidad}` : ""
                    }`,
                  }));
                  return opts.find((o) => o.value === id) ?? null;
                })()}
                onChange={(option: any) => {
                  const selected = option as SelectOption | null;
                  setForm((prev) => ({
                    ...prev,
                    id_profesional: selected ? String(selected.value) : "",
                  }));
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Fecha y hora de inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.fecha_hora_inicio}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fecha_hora_inicio: e.target.value }))
                }
                className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Fecha y hora de fin
              </label>
              <input
                type="datetime-local"
                value={form.fecha_hora_fin}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fecha_hora_fin: e.target.value }))
                }
                className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-medium text-slate-600">Motivo</label>
              <textarea
                value={form.motivo}
                onChange={(e) => setForm((prev) => ({ ...prev, motivo: e.target.value }))}
                className="min-h-[64px] rounded-md border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Motivo de la cita (opcional)"
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-medium text-slate-600">
                Canal de recordatorio
              </label>
              <input
                type="text"
                value={form.canal_recordatorio}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, canal_recordatorio: e.target.value }))
                }
                className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Ej: WhatsApp, Correo, Llamada"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push("/appointments")}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? "Guardando..." : "Guardar cita"}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
