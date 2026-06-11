"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/lib/api";
import { fetchPatients } from "@/services/patients";
import { fetchMedicalProfessionals } from "@/services/professionals";
import { fetchSedes, fetchTiposCita, fetchEstadosCita, type Sede, type TipoCita, type EstadoCita } from "@/services/catalogs";
import type { PatientsResponse } from "@/types/patients";
import type { ProfessionalsResponse } from "@/types/professionals";
import type { AppointmentDetail } from "@/services/appointments";
import { getAppointmentById } from "@/services/appointments";
import { fetchAttentionDiagnoses, type AttentionDiagnosis } from "@/services/attentions";
import type { AppointmentFormState, SelectOption } from "@/types/appointments-forms";
import { useAppointmentFormCatalogs } from "@/hooks/use-appointment-form-catalogs";
import { fetchAppointmentsByProfessional } from "@/services/appointments";
import { fetchProfessionalAvailability } from "@/services/professional-availability";
import type { ProfessionalAvailability } from "@/types/professional-availability";

const Select = dynamic(() => import("react-select"), { ssr: false });

export default function EditAppointmentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [isClient, setIsClient] = useState(false);
  const [form, setForm] = useState<AppointmentFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAttentionSection, setShowAttentionSection] = useState(true);

  const clearedScheduleBackupRef = useRef<{ start: string; end: string } | null>(null);
  const wasScheduleClearedRef = useRef(false);

  const DEFAULT_APPOINTMENT_DURATION_MINUTES = 20;
  const DEFAULT_AVAILABILITY_LOOKAHEAD_DAYS = 7;
  const MAX_AVAILABILITY_LOOKAHEAD_DAYS = 31;

  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState<string>(() => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [availabilitySlots, setAvailabilitySlots] = useState<string[]>([]);
  const [availabilityByDate, setAvailabilityByDate] = useState<{ date: string; slots: string[] }[]>(
    [],
  );
  const [availabilitySelectedDate, setAvailabilitySelectedDate] = useState<string>(availabilityDate);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const closeAvailabilityModal = () => {
    setShowAvailabilityModal(false);
    if (!wasScheduleClearedRef.current) return;
    const backup = clearedScheduleBackupRef.current;
    if (!backup) return;

    setForm((prev) =>
      prev
        ? {
            ...prev,
            fecha_hora_inicio: backup.start,
            fecha_hora_fin: backup.end,
          }
        : prev,
    );

    wasScheduleClearedRef.current = false;
    clearedScheduleBackupRef.current = null;
  };

  const computedStartDateTime = (() => {
    if (!availabilitySelectedDate || selectedSlots.length === 0) return "";
    const sorted = Array.from(new Set(selectedSlots)).sort();
    return `${availabilitySelectedDate}T${sorted[0]}`;
  })();

  const computedEndDateTime = (() => {
    if (!availabilitySelectedDate || selectedSlots.length === 0) return "";
    const sorted = Array.from(new Set(selectedSlots)).sort();
    const startSlot = sorted[0];
    const startDate = new Date(`${availabilitySelectedDate}T${startSlot}:00`);
    if (Number.isNaN(startDate.getTime())) return "";
    const endDate = new Date(
      startDate.getTime() + sorted.length * DEFAULT_APPOINTMENT_DURATION_MINUTES * 60_000,
    );
    const endHH = String(endDate.getHours()).padStart(2, "0");
    const endMM = String(endDate.getMinutes()).padStart(2, "0");
    return `${availabilitySelectedDate}T${endHH}:${endMM}`;
  })();

  const formatDateOnly = (d: Date) => {
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDateTimeLocalInput = (d: Date) => {
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const dayOfWeek1To7 = (d: Date) => {
    const jsDay = d.getDay();
    return jsDay === 0 ? 7 : jsDay;
  };

  const minutesFromHHMM = (hhmm: string) => {
    const [h, m] = hhmm.split(":");
    const hh = Number(h);
    const mm = Number(m);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  };

  useEffect(() => {
    if (!showAvailabilityModal) return;

    setAvailabilityByDate([]);
    setAvailabilitySlots([]);
    setAvailabilityError(null);

    setSelectedSlots([]);
    setAvailabilitySelectedDate(availabilityDate);

    loadAvailabilityLookahead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAvailabilityModal]);

  const computeAvailabilitySlots = (params: {
    date: string;
    availability: ProfessionalAvailability[];
    appointments: { fecha_hora_inicio: string; fecha_hora_fin: string | null }[];
  }) => {
    const { date, availability, appointments } = params;

    if (!date) return [] as string[];

    const startOfDayLocal = new Date(`${date}T00:00:00`);
    if (Number.isNaN(startOfDayLocal.getTime())) return [] as string[];

    const dia = dayOfWeek1To7(startOfDayLocal);

    const dayAvailability = availability
      .filter((a) => {
        if (a.es_excepcion) return false;
        if (a.dia_semana !== dia) return false;
        if (a.fecha_inicio_vigencia && date < a.fecha_inicio_vigencia) return false;
        if (a.fecha_fin_vigencia && date > a.fecha_fin_vigencia) return false;
        return true;
      })
      .sort(
        (a, b) => (minutesFromHHMM(a.hora_inicio) ?? 0) - (minutesFromHHMM(b.hora_inicio) ?? 0),
      );

    if (dayAvailability.length === 0) return [] as string[];

    const normalizedAppointments = appointments
      .map((a) => {
        const s = new Date(a.fecha_hora_inicio);
        if (Number.isNaN(s.getTime())) return null;
        let e: Date;
        if (a.fecha_hora_fin) {
          const parsed = new Date(a.fecha_hora_fin);
          e = Number.isNaN(parsed.getTime())
            ? new Date(s.getTime() + DEFAULT_APPOINTMENT_DURATION_MINUTES * 60_000)
            : parsed;
        } else {
          e = new Date(s.getTime() + DEFAULT_APPOINTMENT_DURATION_MINUTES * 60_000);
        }
        return { start: s, end: e };
      })
      .filter(Boolean) as { start: Date; end: Date }[];

    const slots: string[] = [];
    const duration = DEFAULT_APPOINTMENT_DURATION_MINUTES;

    const todayDateOnly = formatDateOnly(new Date());
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const minSlotStartForToday =
      date === todayDateOnly ? Math.ceil(nowMin / duration) * duration : null;

    for (const a of dayAvailability) {
      const aStartMin = minutesFromHHMM(a.hora_inicio);
      const aEndMin = minutesFromHHMM(a.hora_fin);
      if (aStartMin == null || aEndMin == null) continue;

      const startMin =
        minSlotStartForToday != null ? Math.max(aStartMin, minSlotStartForToday) : aStartMin;

      for (let m = startMin; m + duration <= aEndMin; m += duration) {
        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const min = String(m % 60).padStart(2, "0");
        const slotHHMM = `${hh}:${min}`;

        const slotStart = new Date(`${date}T${slotHHMM}:00`);
        const slotEnd = new Date(slotStart.getTime() + duration * 60_000);
        if (Number.isNaN(slotStart.getTime()) || Number.isNaN(slotEnd.getTime())) continue;

        const capacity = Number.isInteger(a.capacidad_simultanea)
          ? Math.max(a.capacidad_simultanea, 1)
          : 1;

        const overlaps = normalizedAppointments.reduce((acc, ap) => {
          const isOverlap = ap.start < slotEnd && ap.end > slotStart;
          return acc + (isOverlap ? 1 : 0);
        }, 0);

        if (overlaps < capacity) {
          slots.push(slotHHMM);
        }
      }
    }

    return Array.from(new Set(slots));
  };

  const loadAvailabilityLookahead = async () => {
    const professionalId = Number(form?.id_profesional);
    const sedeId = Number(form?.id_sede);

    if (!Number.isInteger(professionalId) || professionalId <= 0) {
      setAvailabilityError("Seleccione un profesional.");
      setAvailabilityByDate([]);
      return;
    }

    if (!Number.isInteger(sedeId) || sedeId <= 0) {
      setAvailabilityError("Seleccione una sede para consultar la disponibilidad.");
      setAvailabilityByDate([]);
      return;
    }

    setAvailabilityLoading(true);
    setAvailabilityError(null);
    setAvailabilityByDate([]);
    setAvailabilitySlots([]);
    setSelectedSlots([]);

    try {
      const availability = await fetchProfessionalAvailability(professionalId, { idSede: sedeId });

      const today = new Date();
      const todayDateOnly = formatDateOnly(today);

      const minStartDateOnly = availability
        .map((a) => a.fecha_inicio_vigencia)
        .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
        .sort()[0];

      const maxEndDateOnly = availability
        .map((a) => a.fecha_fin_vigencia)
        .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
        .sort()
        .slice(-1)[0];

      const startDateOnly = minStartDateOnly && minStartDateOnly > todayDateOnly
        ? minStartDateOnly
        : todayDateOnly;

      const rangeStart = new Date(`${startDateOnly}T00:00:00`);
      const computedEnd = maxEndDateOnly ? new Date(`${maxEndDateOnly}T00:00:00`) : null;

      const dates: string[] = [];
      for (let i = 0; i < MAX_AVAILABILITY_LOOKAHEAD_DAYS; i++) {
        const d = new Date(rangeStart);
        d.setDate(d.getDate() + i);
        const dateOnly = formatDateOnly(d);

        if (computedEnd && d.getTime() > computedEnd.getTime()) break;

        dates.push(dateOnly);
      }

      if (dates.length === 0) {
        setAvailabilityError("No se encontraron fechas para consultar disponibilidad.");
        return;
      }

      if (!maxEndDateOnly && dates.length === MAX_AVAILABILITY_LOOKAHEAD_DAYS) {
        dates.splice(DEFAULT_AVAILABILITY_LOOKAHEAD_DAYS);
      }

      const results = await Promise.all(
        dates.map(async (date) => {
          const appointments = await fetchAppointmentsByProfessional(professionalId, { date });
          const slots = computeAvailabilitySlots({ date, availability, appointments });
          return { date, slots };
        }),
      );

      const nonEmpty = results.filter((r) => r.slots.length > 0);
      setAvailabilityByDate(nonEmpty);

      if (nonEmpty.length === 0) {
        setAvailabilityError("No se encontraron horarios disponibles en los próximos días.");
        return;
      }

      const preferredDate = availabilitySelectedDate;
      const selectedDate = nonEmpty.some((r) => r.date === preferredDate)
        ? preferredDate
        : nonEmpty[0].date;
      const selectedRow = nonEmpty.find((r) => r.date === selectedDate) ?? nonEmpty[0];
      setAvailabilitySelectedDate(selectedDate);
      setAvailabilitySlots(selectedRow.slots);
    } catch {
      setAvailabilityByDate([]);
      setAvailabilitySlots([]);
      setAvailabilityError("No se pudo consultar la disponibilidad. Intente de nuevo.");
    } finally {
      setAvailabilityLoading(false);
    }
  };

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

  const { data: followupRecordsData } = useQuery<any>({
    queryKey: ["edit-appointment-followup-records", form?.id_paciente],
    enabled: form?.seguimiento === "SI" && !!form?.id_paciente?.trim(),
    queryFn: async () => {
      const res = await apiClient.get(`/patients/${form?.id_paciente}/records`);
      return res.data?.data ?? [];
    },
  });

  const followupRecordsOptions = useMemo<SelectOption[]>(() => {
    const rows = Array.isArray(followupRecordsData) ? followupRecordsData : [];
    return rows
      .filter((r: any) => String(r?.estado ?? "").trim() === "Seguimiento")
      .map((r: any) => {
        const fecha = String(r?.fecha_apertura ?? "");
        const estado = String(r?.estado ?? "").trim();
        const tipo = String(r?.tipo_historia ?? "").trim();
        const label = [fecha ? fecha.slice(0, 10) : "", tipo, estado ? `Estado: ${estado}` : ""]
          .filter(Boolean)
          .join(" | ");
        return { value: Number(r.id_historia), label };
      })
      .filter((o) => Number.isInteger(o.value) && o.value > 0);
  }, [followupRecordsData]);

  const selectedFollowupRecord = useMemo(() => {
    const rows = Array.isArray(followupRecordsData) ? followupRecordsData : [];
    const target = form?.id_historia_vinculada ? Number(form.id_historia_vinculada) : NaN;
    if (!Number.isInteger(target) || target <= 0) return null;
    return rows.find((r: any) => Number(r?.id_historia) === target) ?? null;
  }, [followupRecordsData, form?.id_historia_vinculada]);

  useEffect(() => {
    if (!form) return;
    if (form.seguimiento !== "SI") return;
    if (form.id_historia_vinculada?.trim()) return;
    if (followupRecordsOptions.length === 0) return;

    setForm((prev) => {
      if (!prev) return prev;
      if (prev.seguimiento !== "SI") return prev;
      if (prev.id_historia_vinculada?.trim()) return prev;
      return {
        ...prev,
        id_historia_vinculada: String(followupRecordsOptions[0].value),
      };
    });
  }, [followupRecordsOptions, form]);

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
      const startISO = String(citaData.fecha_hora_inicio ?? "");
      const endISO = String(citaData.fecha_hora_fin ?? "");

      const startDate = startISO ? new Date(startISO) : null;
      const endDate = endISO ? new Date(endISO) : null;

      const startLocal = startDate && !Number.isNaN(startDate.getTime()) ? startDate : null;
      const endLocal = endDate && !Number.isNaN(endDate.getTime()) ? endDate : null;

      const startDateOnly = startLocal ? formatDateOnly(startLocal) : startISO.slice(0, 10);
      setAvailabilityDate(startDateOnly);
      setAvailabilitySelectedDate(startDateOnly);
      setForm({
        id_paciente: String(citaData.id_paciente),
        id_profesional: String(citaData.id_profesional),
        id_sede: citaData.id_sede ? String(citaData.id_sede) : "",
        id_tipo_cita: citaData.id_tipo_cita ? String(citaData.id_tipo_cita) : "",
        id_estado_cita: citaData.id_estado_cita ? String(citaData.id_estado_cita) : "",
        id_modalidad_atencion:
          citaData.id_modalidad_atencion != null
            ? String(citaData.id_modalidad_atencion)
            : "",
        id_programa_salud: citaData.id_programa_salud ? String(citaData.id_programa_salud) : "",
        id_tipo_historia: citaData.id_tipo_historia ? String(citaData.id_tipo_historia) : "",
        fecha_hora_inicio: startLocal ? formatDateTimeLocalInput(startLocal) : startISO.slice(0, 16),
        fecha_hora_fin: endLocal ? formatDateTimeLocalInput(endLocal) : endISO ? endISO.slice(0, 16) : "",
        seguimiento: citaData.seguimiento ? "SI" : "NO",
        tipo_seguimiento: (() => {
          if (!citaData.seguimiento || !citaData.tipo_seguimiento) return "";
          const raw = String(citaData.tipo_seguimiento).trim().toUpperCase();
          if (raw === "CRONICAS" || raw === "SALUD") return raw;
          return "";
        })(),
        id_historia_vinculada:
          citaData.seguimiento && (citaData as any).id_historia_vinculada
            ? String((citaData as any).id_historia_vinculada)
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
        id_historia_vinculada:
          seguimientoBool && form.id_historia_vinculada?.trim()
            ? Number(form.id_historia_vinculada)
            : undefined,
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

    if (form.seguimiento === "SI") {
      if (followupRecordsOptions.length === 0) {
        setError("El paciente no tiene historias en estado Seguimiento para vincular.");
        return;
      }
      if (!form.id_historia_vinculada.trim()) {
        setError("Debe seleccionar una historia en seguimiento para vincular.");
        return;
      }
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
                          id_historia_vinculada: next === "SI" ? prev.id_historia_vinculada : "",
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
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-600">
                  Historia en seguimiento a vincular <span className="text-red-500">*</span>
                </label>
                <Select
                  isClearable
                  isSearchable
                  classNamePrefix="react-select"
                  placeholder={
                    followupRecordsOptions.length > 0
                      ? "Seleccione la historia"
                      : "No hay historias en Seguimiento"
                  }
                  options={followupRecordsOptions}
                  value={(() => {
                    const target = form.id_historia_vinculada ? Number(form.id_historia_vinculada) : NaN;
                    if (!Number.isInteger(target) || target <= 0) return null;
                    return followupRecordsOptions.find((o) => o.value === target) ?? null;
                  })()}
                  onChange={(option: any) => {
                    const selected = option as SelectOption | null;
                    setForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            id_historia_vinculada: selected ? String(selected.value) : "",
                          }
                        : prev,
                    );
                  }}
                />

                {selectedFollowupRecord && (
                  <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    <div className="grid gap-1 md:grid-cols-2">
                      <div>
                        <span className="font-semibold">Fecha apertura:</span>{" "}
                        {String(selectedFollowupRecord?.fecha_apertura ?? "").slice(0, 10) || "-"}
                      </div>
                      <div>
                        <span className="font-semibold">Estado:</span>{" "}
                        {String(selectedFollowupRecord?.estado ?? "") || "-"}
                      </div>
                      <div>
                        <span className="font-semibold">Tipo:</span>{" "}
                        {String(selectedFollowupRecord?.tipo_historia ?? "") || "-"}
                      </div>
                      <div>
                        <span className="font-semibold">Profesional:</span>{" "}
                        {String(selectedFollowupRecord?.profesional_responsable ?? "") || "-"}
                      </div>
                      <div>
                        <span className="font-semibold">Última atención:</span>{" "}
                        {String(selectedFollowupRecord?.last_attention_tipo ?? "") || "-"}
                      </div>
                      <div>
                        <span className="font-semibold">Modalidad:</span>{" "}
                        {String(selectedFollowupRecord?.last_attention_modalidad ?? "") || "-"}
                      </div>
                      <div>
                        <span className="font-semibold">Fecha última atención:</span>{" "}
                        {selectedFollowupRecord?.last_attention_fecha_hora
                          ? String(selectedFollowupRecord.last_attention_fecha_hora)
                              .replace("T", " ")
                              .slice(0, 16)
                          : "-"}
                      </div>
                      <div>
                        <span className="font-semibold">Dx principal:</span>{" "}
                        {selectedFollowupRecord?.last_attention_principal_cie10_codigo
                          ? `${String(selectedFollowupRecord.last_attention_principal_cie10_codigo)} - ${String(selectedFollowupRecord?.last_attention_principal_cie10_nombre ?? "")}`
                          : "-"}
                      </div>
                    </div>
                  </div>
                )}
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

          {form.fecha_hora_inicio.trim().length > 0 && (
            <div className="rounded-xl bg-slate-50">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Horario seleccionado
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">Fecha y hora de inicio</label>
                  <input
                    type="datetime-local"
                    value={form.fecha_hora_inicio}
                    readOnly
                    className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 shadow-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">Fecha y hora de fin</label>
                  <input
                    type="datetime-local"
                    value={form.fecha_hora_fin}
                    readOnly
                    className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              {form.fecha_hora_inicio.trim().length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowAvailabilityModal(true)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Cambiar horario
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (form.fecha_hora_inicio.trim().length > 0) {
                        clearedScheduleBackupRef.current = {
                          start: form.fecha_hora_inicio,
                          end: form.fecha_hora_fin,
                        };
                        wasScheduleClearedRef.current = true;
                      }
                      setSelectedSlots([]);
                      setAvailabilityError(null);
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              fecha_hora_inicio: "",
                              fecha_hora_fin: "",
                            }
                          : prev,
                      );
                    }}
                    className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50"
                  >
                    Quitar horario
                  </button>
                </>
              )}

              {form.fecha_hora_inicio.trim().length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowAvailabilityModal(true)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Agregar horario
                </button>
              )}
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
              disabled={mutation.isPending || !form.fecha_hora_inicio.trim()}
              className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
            </div>
          </div>
        </form>

        {showAvailabilityModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Disponibilidad del profesional</h2>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Selecciona un horario de {DEFAULT_APPOINTMENT_DURATION_MINUTES} minutos.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeAvailabilityModal}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-slate-800">Próximos días con disponibilidad</p>
                  <button
                    type="button"
                    onClick={loadAvailabilityLookahead}
                    disabled={availabilityLoading}
                    className="h-8 rounded-md bg-sky-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {availabilityLoading ? "Consultando..." : "Actualizar"}
                  </button>
                </div>

                {availabilityError && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {availabilityError}
                  </p>
                )}

                {!availabilityLoading && availabilityByDate.length === 0 && !availabilityError && (
                  <p className="text-xs text-slate-500">Consultando disponibilidad...</p>
                )}

                {availabilityByDate.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {availabilityByDate.map((d) => (
                        <button
                          key={d.date}
                          type="button"
                          onClick={() => {
                            setAvailabilitySelectedDate(d.date);
                            setAvailabilitySlots(d.slots);
                            setSelectedSlots([]);
                          }}
                          className={`rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm transition ${
                            availabilitySelectedDate === d.date
                              ? "border-sky-400 bg-sky-50 text-sky-800"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {d.date}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-800">
                        Horarios disponibles para {availabilitySelectedDate}
                      </p>

                      {availabilitySlots.length === 0 && (
                        <p className="text-xs text-slate-500">No hay horarios para esta fecha.</p>
                      )}

                      {availabilitySlots.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {availabilitySlots.map((hhmm) => {
                            const startDate = new Date(`${availabilitySelectedDate}T${hhmm}:00`);
                            const endDate = new Date(
                              startDate.getTime() + DEFAULT_APPOINTMENT_DURATION_MINUTES * 60_000,
                            );
                            const endHH = String(endDate.getHours()).padStart(2, "0");
                            const endMM = String(endDate.getMinutes()).padStart(2, "0");
                            const endHHMM = `${endHH}:${endMM}`;

                            const isSelected = selectedSlots.includes(hhmm);

                            const toggleSlot = () => {
                              const current = new Set(selectedSlots);
                              if (current.has(hhmm)) {
                                current.delete(hhmm);
                              } else {
                                current.add(hhmm);
                              }

                              const next = Array.from(current).sort();
                              if (next.length <= 1) {
                                setSelectedSlots(next);
                                return;
                              }

                              const minutes = next
                                .map((t) => minutesFromHHMM(t) ?? -1)
                                .filter((m) => m >= 0)
                                .sort((a, b) => a - b);

                              const isContiguous = minutes.every((m, idx) => {
                                if (idx === 0) return true;
                                return m - minutes[idx - 1] === DEFAULT_APPOINTMENT_DURATION_MINUTES;
                              });

                              if (!isContiguous) {
                                setAvailabilityError(
                                  "Seleccione bloques contiguos (sin espacios) para calcular la hora final.",
                                );
                                return;
                              }

                              setAvailabilityError(null);
                              setSelectedSlots(next);
                            };

                            return (
                              <label
                                key={hhmm}
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleSlot();
                                }}
                                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs shadow-sm transition ${
                                  isSelected
                                    ? "border-sky-400 bg-sky-50"
                                    : "border-slate-200 bg-white hover:bg-slate-50"
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-slate-900">
                                    {hhmm} - {endHHMM}
                                  </p>
                                  <p className="text-[11px] text-slate-600">Disponible</p>
                                </div>
                                <input
                                  type="checkbox"
                                  name="availability_slot"
                                  checked={isSelected}
                                  readOnly
                                  className="h-4 w-4"
                                />
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={closeAvailabilityModal}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={selectedSlots.length === 0}
                        onClick={() => {
                          if (selectedSlots.length === 0) return;
                          setAvailabilityDate(availabilitySelectedDate);
                          setForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  fecha_hora_inicio: computedStartDateTime,
                                  fecha_hora_fin: computedEndDateTime,
                                }
                              : prev,
                          );
                          wasScheduleClearedRef.current = false;
                          clearedScheduleBackupRef.current = null;
                          setShowAvailabilityModal(false);
                        }}
                        className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Usar este horario
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
