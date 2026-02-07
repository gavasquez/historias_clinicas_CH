"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/lib/api";
import { fetchPatients } from "@/services/patients";
import { fetchProfessionals } from "@/services/professionals";
import { fetchSedes, fetchTiposCita, fetchEstadosCita, type Sede, type TipoCita, type EstadoCita } from "@/services/catalogs";
import type { PatientsResponse } from "@/types/patients";
import type { ProfessionalsResponse } from "@/types/professionals";
import type { AppointmentDetail } from "@/services/appointments";
import { getAppointmentById } from "@/services/appointments";
import { fetchAttentionDiagnoses, type AttentionDiagnosis } from "@/services/attentions";
import type { AppointmentFormState, SelectOption } from "@/types/appointments-forms";
import { useAppointmentFormCatalogs } from "@/hooks/use-appointment-form-catalogs";

const Select = dynamic(() => import("react-select"), { ssr: false });

export default function EditAppointmentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [isClient, setIsClient] = useState(false);
  const [form, setForm] = useState<AppointmentFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAttentionSection, setShowAttentionSection] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    patientsData,
    professionalsData,
    sedesData,
    tiposCitaData,
    estadosCitaData,
    programasSaludData,
    loadingPatients,
    loadingProfessionals,
  } = useAppointmentFormCatalogs();

  const { data: citaData, isLoading: loadingCita } = useQuery<AppointmentDetail>({
    queryKey: ["appointment-edit", id],
    enabled: !!id,
    queryFn: () => getAppointmentById(String(id)),
  });

  const estadoIdForAttend = (() => {
    const fromForm = form?.id_estado_cita ? Number(form.id_estado_cita) : null;
    if (fromForm && Number.isInteger(fromForm) && fromForm > 0) return fromForm;
    const fromCita = citaData?.id_estado_cita ?? null;
    if (fromCita && Number.isInteger(fromCita) && fromCita > 0) return fromCita;
    return null;
  })();

  const estado =
    estadoIdForAttend && estadosCitaData
      ? estadosCitaData.find((e) => e.id_estado_cita === estadoIdForAttend) ?? null
      : null;

  const estadoCodigoNorm = (estado?.codigo ?? "").trim().toUpperCase();
  const estadoDescripcionNorm = (estado?.descripcion ?? "").trim().toUpperCase();

  const canAttend = estadoCodigoNorm === "PROGRAMADA" || estadoDescripcionNorm === "PROGRAMADA";

  const { data: diagnosesData, isLoading: loadingDiagnoses } = useQuery<AttentionDiagnosis[]>(
    {
      queryKey: ["appointment-edit-diagnoses", citaData?.ultima_atencion?.id_atencion],
      enabled: !!citaData?.ultima_atencion?.id_atencion,
      queryFn: () =>
        citaData?.ultima_atencion?.id_atencion
          ? fetchAttentionDiagnoses(citaData.ultima_atencion.id_atencion)
          : Promise.resolve([]),
    },
  );

  useEffect(() => {
    if (citaData && !form) {
      setForm({
        id_paciente: String(citaData.id_paciente),
        id_profesional: String(citaData.id_profesional),
        id_sede: citaData.id_sede ? String(citaData.id_sede) : "",
        id_tipo_cita: citaData.id_tipo_cita ? String(citaData.id_tipo_cita) : "",
        id_estado_cita: citaData.id_estado_cita ? String(citaData.id_estado_cita) : "",
        id_modalidad_atencion: citaData.id_modalidad_atencion
          ? String(citaData.id_modalidad_atencion)
          : "",
        id_programa_salud: citaData.id_programa_salud ? String(citaData.id_programa_salud) : "",
        fecha_hora_inicio: citaData.fecha_hora_inicio.slice(0, 16),
        fecha_hora_fin: citaData.fecha_hora_fin ? citaData.fecha_hora_fin.slice(0, 16) : "",
        seguimiento: citaData.seguimiento ? "SI" : "NO",
        tipo_seguimiento:
          citaData.seguimiento && citaData.tipo_seguimiento
            ? ((citaData.tipo_seguimiento as any) as "CRONICAS" | "SALUD")
            : "",
        canal_recordatorio: citaData.canal_recordatorio ?? "",
      });
    }
  }, [citaData, form]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form || !id) return;

      const idPacienteNum = Number(form.id_paciente);
      const idProfesionalNum = Number(form.id_profesional);
      const idSedeNum = form.id_sede ? Number(form.id_sede) : undefined;
      const idTipoCitaNum = form.id_tipo_cita ? Number(form.id_tipo_cita) : undefined;
      const idEstadoCitaNum = form.id_estado_cita ? Number(form.id_estado_cita) : undefined;
      const idModalidadAtencionNum = form.id_modalidad_atencion
        ? Number(form.id_modalidad_atencion)
        : undefined;
      const idProgramaSaludNum = form.id_programa_salud ? Number(form.id_programa_salud) : undefined;

      const seguimientoBool = form.seguimiento === "SI";
      const tipoSeguimientoValue = seguimientoBool ? form.tipo_seguimiento : "";

      return apiClient.put(`/appointments/${id}`, {
        id_paciente: idPacienteNum,
        id_profesional: idProfesionalNum,
        fecha_hora_inicio: form.fecha_hora_inicio,
        fecha_hora_fin: form.fecha_hora_fin || undefined,
        id_sede: idSedeNum,
        id_tipo_cita: idTipoCitaNum,
        id_estado_cita: idEstadoCitaNum,
        id_modalidad_atencion: idModalidadAtencionNum,
        id_programa_salud: idProgramaSaludNum,
        seguimiento: seguimientoBool,
        tipo_seguimiento: tipoSeguimientoValue || undefined,
        canal_recordatorio: form.canal_recordatorio || undefined,
      });
    },
    onSuccess: () => {
      setError(null);
      router.push("/appointments");
    },
    onError: (err: any) => {
      const backendMessage = err?.response?.data?.message;
      setError(
        typeof backendMessage === "string" && backendMessage.trim().length > 0
          ? backendMessage
          : "No se pudo actualizar la cita. Verifique los datos e intente de nuevo.",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    if (
      !form.id_paciente.trim() ||
      !form.id_programa_salud.trim() ||
      !form.id_profesional.trim() ||
      !form.id_sede.trim() ||
      !form.id_tipo_cita.trim() ||
      !form.fecha_hora_inicio.trim()
    ) {
      setError(
        "Debe completar paciente, programa transversal, profesional, sede, tipo de cita y fecha/hora de inicio.",
      );
      return;
    }

    mutation.mutate();
  };

  if (!isClient || loadingCita || !form) {
    return (
      <AppShell>
        <section className="space-y-4">
          <p className="text-sm text-slate-500">Cargando información de la cita...</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Editar cita</h1>
            <p className="mt-1 text-sm text-slate-600">
              Actualice los datos de la cita seleccionada.
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
            {id && (
              <button
                type="button"
                onClick={() => router.push(`/appointments/${id}/summary`)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Ver resumen clínico
              </button>
            )}
            {id &&
              citaData &&
              canAttend && (
              <button
                type="button"
                onClick={() => router.push(`/appointments/${id}/attend`)}
                className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50"
              >
                Atender cita
              </button>
            )}
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
                  const idNum = form.id_paciente ? Number(form.id_paciente) : null;
                  if (!idNum) return null;
                  const opts = (patientsData?.data ?? []).map((p) => ({
                    value: p.id_paciente,
                    label: `${p.numero_documento} - ${p.nombres} ${p.apellidos}`,
                  }));
                  return opts.find((o) => o.value === idNum) ?? null;
                })()}
                onChange={(option: any) => {
                  const selected = option as SelectOption | null;
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          id_paciente: selected ? String(selected.value) : "",
                        }
                      : prev,
                  );
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Programa Transversal <span className="text-red-500">*</span>
              </label>
              <Select
                isClearable={false}
                isSearchable
                classNamePrefix="react-select"
                placeholder="Seleccione un programa"
                options={(programasSaludData ?? []).map((p) => ({
                  value: p.id_programa_salud,
                  label: p.nombre,
                }))}
                value={(() => {
                  const idNum = form.id_programa_salud ? Number(form.id_programa_salud) : null;
                  if (!idNum) return null;
                  const opts = (programasSaludData ?? []).map((p) => ({
                    value: p.id_programa_salud,
                    label: p.nombre,
                  }));
                  return opts.find((o) => o.value === idNum) ?? null;
                })()}
                onChange={(option: any) => {
                  const selected = option as SelectOption | null;
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          id_programa_salud: selected ? String(selected.value) : "",
                        }
                      : prev,
                  );
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Estado de la cita</label>
              <Select
                isClearable
                isSearchable
                classNamePrefix="react-select"
                placeholder="Seleccione un estado (opcional)"
                options={(estadosCitaData ?? []).map((estado) => ({
                  value: estado.id_estado_cita,
                  label: estado.descripcion,
                }))}
                value={(() => {
                  const idNum = form.id_estado_cita ? Number(form.id_estado_cita) : null;
                  if (!idNum) return null;
                  const opts = (estadosCitaData ?? []).map((estado) => ({
                    value: estado.id_estado_cita,
                    label: estado.descripcion,
                  }));
                  return opts.find((o) => o.value === idNum) ?? null;
                })()}
                onChange={(option: any) => {
                  const selected = option as SelectOption | null;
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          id_estado_cita: selected ? String(selected.value) : "",
                        }
                      : prev,
                  );
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Sede <span className="text-red-500">*</span>
              </label>
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
                  const idNum = form.id_sede ? Number(form.id_sede) : null;
                  if (!idNum) return null;
                  const opts = (sedesData ?? []).map((sede) => ({
                    value: sede.id_sede,
                    label: sede.nombre,
                  }));
                  return opts.find((o) => o.value === idNum) ?? null;
                })()}
                onChange={(option: any) => {
                  const selected = option as SelectOption | null;
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          id_sede: selected ? String(selected.value) : "",
                        }
                      : prev,
                  );
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Tipo de cita <span className="text-red-500">*</span>
              </label>
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
                  const idNum = form.id_tipo_cita ? Number(form.id_tipo_cita) : null;
                  if (!idNum) return null;
                  const opts = (tiposCitaData ?? []).map((tipo) => ({
                    value: tipo.id_tipo_cita,
                    label: tipo.descripcion,
                  }));
                  return opts.find((o) => o.value === idNum) ?? null;
                })()}
                onChange={(option: any) => {
                  const selected = option as SelectOption | null;
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          id_tipo_cita: selected ? String(selected.value) : "",
                        }
                      : prev,
                  );
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
                  const idNum = form.id_profesional ? Number(form.id_profesional) : null;
                  if (!idNum) return null;
                  const opts = (professionalsData?.data ?? []).map((prof) => ({
                    value: prof.id_profesional,
                    label: `${prof.nombre_completo}${
                      prof.especialidad ? ` - ${prof.especialidad}` : ""
                    }`,
                  }));
                  return opts.find((o) => o.value === idNum) ?? null;
                })()}
                onChange={(option: any) => {
                  const selected = option as SelectOption | null;
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          id_profesional: selected ? String(selected.value) : "",
                        }
                      : prev,
                  );
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
                  setForm((prev) =>
                    prev ? { ...prev, fecha_hora_inicio: e.target.value } : prev,
                  )
                }
                className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Fecha y hora de fin</label>
              <input
                type="datetime-local"
                value={form.fecha_hora_fin}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, fecha_hora_fin: e.target.value } : prev,
                  )
                }
                className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Seguimiento</label>
              <select
                value={form.seguimiento}
                onChange={(e) => {
                  const next = e.target.value === "SI" ? "SI" : "NO";
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          seguimiento: next,
                          tipo_seguimiento: next === "SI" ? prev.tipo_seguimiento : "",
                        }
                      : prev,
                  );
                }}
                className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="NO">No</option>
                <option value="SI">Sí</option>
              </select>
            </div>

            {form.seguimiento === "SI" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Tipo de seguimiento</label>
                <select
                  value={form.tipo_seguimiento}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            tipo_seguimiento: v === "CRONICAS" || v === "SALUD" ? v : "",
                          }
                        : prev,
                    );
                  }}
                  className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Seleccione...</option>
                  <option value="CRONICAS">Condiciones crónicas</option>
                  <option value="SALUD">Situaciones de salud</option>
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-medium text-slate-600">Canal de recordatorio</label>
              <input
                type="text"
                value={form.canal_recordatorio}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, canal_recordatorio: e.target.value } : prev,
                  )
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
              {mutation.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
