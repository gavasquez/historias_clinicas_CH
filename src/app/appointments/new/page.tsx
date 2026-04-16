"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import axios from "axios";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/lib/api";
import {
  dayOfWeek1To7,
  minutesFromHHMM,
} from "@/lib/date-time";
import { useAppointmentFormCatalogs } from "@/hooks/use-appointment-form-catalogs";
import type { AppointmentFormState, SelectOption } from "@/types/appointments-forms";
import { fetchProfessionalAvailability } from "@/services/professional-availability";
import type { ProfessionalAvailability } from "@/types/professional-availability";
import { fetchAppointmentsByProfessional } from "@/services/appointments";
import { fetchPatients } from "@/services/patients";
import { fetchProfessionals, getProfessionalById } from "@/services/professionals";

const Select = dynamic(() => import("react-select"), { ssr: false });

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profesionalIdFromQuery = searchParams.get("profesionalId");

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const selectMenuPortalTarget = typeof document !== "undefined" ? document.body : null;
  const selectStyles = {
    menuPortal: (base: any) => ({ ...base, zIndex: 60 }),
    menu: (base: any) => ({ ...base, zIndex: 60 }),
    option: (base: any) => ({ ...base, color: '#000' }),
    optionText: (base: any) => ({ ...base, color: '#000' }),
  };

  const [form, setForm] = useState<AppointmentFormState>({
    id_paciente: "",
    id_profesional: profesionalIdFromQuery ? String(profesionalIdFromQuery) : "",
    id_sede: "",
    id_tipo_cita: "",
    id_estado_cita: "",
    id_modalidad_atencion: "",
    id_programa_salud: "",
    fecha_hora_inicio: "",
    fecha_hora_fin: "",
    seguimiento: "NO",
    tipo_seguimiento: "",
    canal_recordatorio: "",
  });

  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [validatingProfessional, setValidatingProfessional] = useState(false);

  const DEFAULT_APPOINTMENT_DURATION_MINUTES = 20;

  const DEFAULT_AVAILABILITY_LOOKAHEAD_DAYS = 7;
  const MAX_AVAILABILITY_LOOKAHEAD_DAYS = 31;

  const [patientsSearch, setPatientsSearch] = useState("");
  const [professionalsSearch, setProfessionalsSearch] = useState("");

  const [debouncedPatientsSearch, setDebouncedPatientsSearch] = useState("");
  const [debouncedProfessionalsSearch, setDebouncedProfessionalsSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPatientsSearch(patientsSearch.trim()), 250);
    return () => clearTimeout(t);
  }, [patientsSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedProfessionalsSearch(professionalsSearch.trim()), 250);
    return () => clearTimeout(t);
  }, [professionalsSearch]);

  const [availabilityDate, setAvailabilityDate] = useState<string>(() => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [availabilitySlots, setAvailabilitySlots] = useState<string[]>([]);
  const [availabilityByDate, setAvailabilityByDate] = useState<
    { date: string; slots: string[] }[]
  >([]);
  const [availabilitySelectedDate, setAvailabilitySelectedDate] = useState<string>(availabilityDate);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const effectiveAvailabilityDate = selectedSlots.length > 0 ? availabilitySelectedDate : availabilityDate;

  const computedStartDateTime = (() => {
    if (!effectiveAvailabilityDate || selectedSlots.length === 0) return "";
    const sorted = Array.from(new Set(selectedSlots)).sort();
    return `${effectiveAvailabilityDate}T${sorted[0]}`;
  })();

  const computedEndDateTime = (() => {
    if (!effectiveAvailabilityDate || selectedSlots.length === 0) return "";
    const sorted = Array.from(new Set(selectedSlots)).sort();
    const startSlot = sorted[0];
    const startDate = new Date(`${effectiveAvailabilityDate}T${startSlot}:00`);
    if (Number.isNaN(startDate.getTime())) return "";
    const endDate = new Date(
      startDate.getTime() + sorted.length * DEFAULT_APPOINTMENT_DURATION_MINUTES * 60_000,
    );
    const endHH = String(endDate.getHours()).padStart(2, "0");
    const endMM = String(endDate.getMinutes()).padStart(2, "0");
    return `${effectiveAvailabilityDate}T${endHH}:${endMM}`;
  })();

  const formatDateOnly = (d: Date) => {
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    if (step !== 4) return;

    setAvailabilityByDate([]);
    setAvailabilitySlots([]);
    setAvailabilityError(null);
    setSelectedSlots([]);
    setAvailabilitySelectedDate(availabilityDate);

    loadAvailabilityLookahead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

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
      .sort((a, b) => (minutesFromHHMM(a.hora_inicio) ?? 0) - (minutesFromHHMM(b.hora_inicio) ?? 0));

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
      date === todayDateOnly
        ? Math.ceil(nowMin / duration) * duration
        : null;

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

  const loadAvailability = async (opts?: { date?: string }) => {
    const professionalId = Number(form.id_profesional);
    const sedeId = Number(form.id_sede);
    const date = (opts?.date ?? availabilityDate).trim();

    if (!Number.isInteger(professionalId) || professionalId <= 0) {
      setAvailabilityError("Seleccione un profesional.");
      setAvailabilitySlots([]);
      return;
    }

    if (!Number.isInteger(sedeId) || sedeId <= 0) {
      setAvailabilityError("Seleccione una sede para consultar la disponibilidad.");
      setAvailabilitySlots([]);
      return;
    }

    if (!date) {
      setAvailabilityError("Seleccione una fecha para consultar la disponibilidad.");
      setAvailabilitySlots([]);
      return;
    }

    setAvailabilityLoading(true);
    setAvailabilityError(null);
    setSelectedSlots([]);

    try {
      const [availability, appointments] = await Promise.all([
        fetchProfessionalAvailability(professionalId, { idSede: sedeId }),
        fetchAppointmentsByProfessional(professionalId, { date }),
      ]);

      const slots = computeAvailabilitySlots({
        date,
        availability,
        appointments,
      });

      setAvailabilitySlots(slots);
      if (slots.length === 0) {
        setAvailabilityError("No se encontraron horarios disponibles para esa fecha.");
      }
    } catch (e) {
      setAvailabilitySlots([]);
      setAvailabilityError("No se pudo consultar la disponibilidad. Intente de nuevo.");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const loadAvailabilityLookahead = async (): Promise<boolean> => {
    const professionalId = Number(form.id_profesional);
    const sedeId = Number(form.id_sede);

    if (!Number.isInteger(professionalId) || professionalId <= 0) {
      setAvailabilityError("Seleccione un profesional.");
      setAvailabilityByDate([]);
      return false;
    }

    if (!Number.isInteger(sedeId) || sedeId <= 0) {
      setAvailabilityError("Seleccione una sede para consultar la disponibilidad.");
      setAvailabilityByDate([]);
      return false;
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
        return false;
      }

      if (!maxEndDateOnly && dates.length === MAX_AVAILABILITY_LOOKAHEAD_DAYS) {
        // si no hay vigencia fin, mantenemos el lookahead por defecto
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
        return false;
      }

      const firstDate = nonEmpty[0].date;
      setAvailabilitySelectedDate(firstDate);
      setAvailabilitySlots(nonEmpty[0].slots);

      return true;
    } catch (e) {
      setAvailabilityByDate([]);
      setAvailabilitySlots([]);
      setAvailabilityError("No se pudo consultar la disponibilidad. Intente de nuevo.");
      return false;
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const {
    sedesData,
    tiposCitaData,
    estadosCitaData,
    modalidadesAtencionData,
    programasSaludData,
  } = useAppointmentFormCatalogs();

  const patientsQuery = useQuery({
    queryKey: ["patients-select", debouncedPatientsSearch],
    queryFn: () => {
      const q = debouncedPatientsSearch;
      const isNumeric = /^\d+$/.test(q);
      return fetchPatients(1, q ? (isNumeric ? { documento: q } : { nombre: q }) : {});
    },
  });

  const professionalsQuery = useQuery({
    queryKey: ["professionals-select", debouncedProfessionalsSearch],
    queryFn: () => {
      return fetchProfessionals(1, {
        nombre: debouncedProfessionalsSearch || undefined,
      });
    },
    enabled: true,
  });

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
      const idModalidadAtencionNum = form.id_modalidad_atencion
        ? Number(form.id_modalidad_atencion)
        : undefined;
      const idProgramaSaludNum = form.id_programa_salud ? Number(form.id_programa_salud) : undefined;

      const seguimientoBool = form.seguimiento === "SI";
      const tipoSeguimientoValue = seguimientoBool ? form.tipo_seguimiento : "";

      const sorted = Array.from(new Set(selectedSlots)).sort();
      const startSlot = sorted[0];

      const appointmentDateOnly = availabilitySelectedDate || availabilityDate;

      const startDateTime = `${appointmentDateOnly}T${startSlot}`;
      const startDate = new Date(`${appointmentDateOnly}T${startSlot}:00`);
      const endDate = new Date(
        startDate.getTime() + sorted.length * DEFAULT_APPOINTMENT_DURATION_MINUTES * 60_000,
      );
      const endHH = String(endDate.getHours()).padStart(2, "0");
      const endMM = String(endDate.getMinutes()).padStart(2, "0");
      const endDateTime = `${appointmentDateOnly}T${endHH}:${endMM}`;

      return apiClient.post("/appointments", {
        id_paciente: idPacienteNum,
        id_profesional: idProfesionalNum,
        fecha_hora_inicio: startDateTime,
        fecha_hora_fin: endDateTime,
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

    const goNext = () => setStep((prev) => (prev < 5 ? ((prev + 1) as any) : prev));

    if (step === 1) {
      if (!form.id_paciente.trim()) {
        setError("Seleccione un paciente para continuar.");
        return;
      }
      setError(null);
      goNext();
      return;
    }

    if (step === 2) {
      if (!form.id_programa_salud.trim() || !form.id_modalidad_atencion.trim() || !form.id_tipo_cita.trim()) {
        setError("Debe completar programa transversal, modalidad de atención y tipo de cita.");
        return;
      }
      if (form.seguimiento === "SI" && !form.tipo_seguimiento.trim()) {
        setError("Seleccione el tipo de seguimiento.");
        return;
      }
      setError(null);
      goNext();
      return;
    }

    if (step === 3) {
      if (!form.id_sede.trim() || !form.id_profesional.trim()) {
        setError("Debe seleccionar sede y profesional.");
        return;
      }

      setError(null);

      setValidatingProfessional(true);
      try {
        const ok = await loadAvailabilityLookahead();
        if (!ok) {
          setError(
            "El profesional seleccionado no tiene disponibilidad en los próximos días para la sede elegida. Seleccione otro profesional.",
          );
          return;
        }
      } finally {
        setValidatingProfessional(false);
      }

      goNext();
      return;
    }

    if (step === 4) {
      if (selectedSlots.length === 0) {
        setError("Seleccione al menos un bloque de horario disponible.");
        return;
      }
      setError(null);
      goNext();
      return;
    }

    if (
      !form.id_paciente.trim() ||
      !form.id_programa_salud.trim() ||
      !form.id_modalidad_atencion.trim() ||
      !form.id_profesional.trim() ||
      !form.id_sede.trim() ||
      !form.id_tipo_cita.trim()
    ) {
      setError("Verifique que todos los datos obligatorios estén completos.");
      return;
    }

    if (form.seguimiento === "SI" && !form.tipo_seguimiento.trim()) {
      setError("Seleccione el tipo de seguimiento.");
      return;
    }

    if (selectedSlots.length === 0) {
      setError("Seleccione al menos un bloque de horario disponible.");
      return;
    }

    setError(null);
    mutation.mutate();
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => (prev > 1 ? ((prev - 1) as any) : prev));
  };

  const steps = [
    { id: 1, label: "Paciente" },
    { id: 2, label: "Detalles" },
    { id: 3, label: "Profesional" },
    { id: 4, label: "Horario" },
    { id: 5, label: "Revisión" },
  ] as const;

  const stepDescriptions: Record<(typeof steps)[number]["id"], string> = {
    1: "Busca y selecciona el paciente.",
    2: "Define el contexto y características de la cita.",
    3: "Selecciona sede y profesional. Validaremos la disponibilidad al continuar.",
    4: "Elige uno o varios bloques contiguos para definir la duración.",
    5: "Revisa la información antes de guardar.",
  };

  const progressPct = ((step - 1) / (steps.length - 1)) * 100;

  const selectedPacienteLabel = (() => {
    const id = form.id_paciente ? Number(form.id_paciente) : null;
    if (!id) return "";
    const p = (patientsQuery.data?.data ?? []).find((x) => x.id_paciente === id);
    return p ? `${p.numero_documento} - ${p.nombres} ${p.apellidos}` : "";
  })();

  const selectedSedeName = (() => {
    const sedeId = form.id_sede ? Number(form.id_sede) : null;
    if (!sedeId) return "";
    const sede = (sedesData ?? []).find((s) => s.id_sede === sedeId);
    return sede?.nombre ?? "";
  })();

  const selectedProfessionalId = form.id_profesional ? Number(form.id_profesional) : null;
  const selectedProfessionalFromList = (() => {
    if (!selectedProfessionalId) return null;
    return (professionalsQuery.data?.data ?? []).find((x) => x.id_profesional === selectedProfessionalId) ?? null;
  })();

  const selectedProfessionalDetailQuery = useQuery({
    queryKey: ["professional-by-id", selectedProfessionalId],
    queryFn: () => getProfessionalById(String(selectedProfessionalId)),
    enabled: Number.isInteger(selectedProfessionalId) && (selectedProfessionalId ?? 0) > 0 && !selectedProfessionalFromList,
  });

  const selectedProfessionalLabel = (() => {
    if (selectedProfessionalFromList) {
      return `${selectedProfessionalFromList.nombre_completo}${
        selectedProfessionalFromList.especialidad ? ` - ${selectedProfessionalFromList.especialidad}` : ""
      }`;
    }

    const d = selectedProfessionalDetailQuery.data;
    if (!d) return "";

    const specialty = d.especialidad?.nombre ? ` - ${d.especialidad.nombre}` : "";
    return `${d.nombre_completo}${specialty}`;
  })();

  const selectedProfessionalOption = (() => {
    if (!selectedProfessionalId) return null;
    if (selectedProfessionalFromList) {
      return {
        value: selectedProfessionalFromList.id_profesional,
        label: `${selectedProfessionalFromList.nombre_completo}${selectedProfessionalFromList.especialidad ? ` - ${selectedProfessionalFromList.especialidad}` : ""}`,
      };
    }

    const d = selectedProfessionalDetailQuery.data;
    if (!d) return null;

    return {
      value: d.id_profesional,
      label: `${d.nombre_completo}${d.especialidad?.nombre ? ` - ${d.especialidad.nombre}` : ""}`,
    };
  })();

  const selectedProgramaLabel = (() => {
    const id = form.id_programa_salud ? Number(form.id_programa_salud) : null;
    if (!id) return "";
    const p = (programasSaludData ?? []).find((x) => x.id_programa_salud === id);
    return p?.nombre ?? "";
  })();

  const selectedModalidadLabel = (() => {
    const id = form.id_modalidad_atencion ? Number(form.id_modalidad_atencion) : null;
    if (!id) return "";
    const m = (modalidadesAtencionData ?? []).find((x) => x.id_modalidad_atencion === id);
    return m?.descripcion ?? "";
  })();

  const selectedTipoCitaLabel = (() => {
    const id = form.id_tipo_cita ? Number(form.id_tipo_cita) : null;
    if (!id) return "";
    const t = (tiposCitaData ?? []).find((x) => x.id_tipo_cita === id);
    return t?.descripcion ?? "";
  })();

  if (!isClient) {
    // Evitamos renderizar los Select durante SSR para prevenir hydration mismatch
    return null;
  }

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="w-full space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Nueva cita</h1>
              <p className="mt-1 text-sm text-slate-600">
                Complete todos los pasos para crear una nueva cita: seleccione paciente, detalles de atención, profesional y horario disponible.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/appointments")}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Volver al listado
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-sky-50 to-white px-4 py-4">
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Paso {step} de {steps.length}
                </p>
                <h2 className="mt-0.5 text-base font-semibold text-slate-900">
                  {steps.find((s) => s.id === step)?.label}
                </h2>
                <p className="mt-1 text-xs text-slate-600">{stepDescriptions[step]}</p>
              </div>

              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
                  <div
                    className="h-2 rounded-full bg-sky-600 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {selectedPacienteLabel && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs">
                    <span className="font-semibold text-slate-600">Paciente</span>
                    <span className="text-slate-900">{selectedPacienteLabel}</span>
                  </span>
                )}
                {selectedSedeName && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs">
                    <span className="font-semibold text-slate-600">Sede</span>
                    <span className="text-slate-900">{selectedSedeName}</span>
                  </span>
                )}
                {selectedProfessionalLabel && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs">
                    <span className="font-semibold text-slate-600">Profesional</span>
                    <span className="text-slate-900">{selectedProfessionalLabel}</span>
                  </span>
                )}
                {computedStartDateTime && computedEndDateTime && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs">
                    <span className="font-semibold text-slate-600">Horario</span>
                    <span className="text-slate-900">
                      {computedStartDateTime.replace("T", " ")} - {computedEndDateTime.replace("T", " ").slice(11)}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="space-y-4 p-4">
              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}

              <div className="grid gap-4 md:grid-cols-2">
            {step === 1 && (
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-600">
                  Paciente <span className="text-red-500">*</span>
                </label>
                <Select
                  isClearable
                  isSearchable
                  classNamePrefix="react-select"
                  menuPortalTarget={selectMenuPortalTarget}
                  menuPosition="fixed"
                  styles={selectStyles}
                  placeholder={patientsQuery.isLoading ? "Cargando pacientes..." : "Buscar paciente por documento o nombre"}
                  options={(patientsQuery.data?.data ?? []).map((p) => ({
                    value: p.id_paciente,
                    label: `${p.numero_documento} - ${p.nombres} ${p.apellidos}`,
                  }))}
                  value={(() => {
                    const id = form.id_paciente ? Number(form.id_paciente) : null;
                    if (!id) return null;
                    const opts = (patientsQuery.data?.data ?? []).map((p) => ({
                      value: p.id_paciente,
                      label: `${p.numero_documento} - ${p.nombres} ${p.apellidos}`,
                    }));
                    return opts.find((o) => o.value === id) ?? null;
                  })()}
                  onInputChange={(v: string) => {
                    setPatientsSearch(v);
                    return v;
                  }}
                  onChange={(option: any) => {
                    const selected = option as SelectOption | null;
                    setForm((prev) => ({
                      ...prev,
                      id_paciente: selected ? String(selected.value) : "",
                    }));
                  }}
                />
              </div>
            )}

            {step === 2 && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Programa Transversal <span className="text-red-500">*</span>
                  </label>
                  <Select
                    isClearable={false}
                    isSearchable
                    classNamePrefix="react-select"
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition="fixed"
                    styles={selectStyles}
                    placeholder="Seleccione un programa"
                    options={(programasSaludData ?? []).map((p) => ({
                      value: p.id_programa_salud,
                      label: p.nombre,
                    }))}
                    value={(() => {
                      const id = form.id_programa_salud ? Number(form.id_programa_salud) : null;
                      if (!id) return null;
                      const opts = (programasSaludData ?? []).map((p) => ({
                        value: p.id_programa_salud,
                        label: p.nombre,
                      }));
                      return opts.find((o) => o.value === id) ?? null;
                    })()}
                    onChange={(option: any) => {
                      const selected = option as SelectOption | null;
                      setForm((prev) => ({
                        ...prev,
                        id_programa_salud: selected ? String(selected.value) : "",
                      }));
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Modalidad de atención <span className="text-red-500">*</span>
                  </label>
                  <Select
                    isClearable
                    isSearchable
                    classNamePrefix="react-select"
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition="fixed"
                    styles={selectStyles}
                    placeholder="Seleccione una modalidad"
                    options={(modalidadesAtencionData ?? []).map((m) => ({
                      value: m.id_modalidad_atencion,
                      label: m.descripcion,
                    }))}
                    value={(() => {
                      const id = form.id_modalidad_atencion
                        ? Number(form.id_modalidad_atencion)
                        : null;
                      if (!id) return null;
                      const opts = (modalidadesAtencionData ?? []).map((m) => ({
                        value: m.id_modalidad_atencion,
                        label: m.descripcion,
                      }));
                      return opts.find((o) => o.value === id) ?? null;
                    })()}
                    onChange={(option: any) => {
                      const selected = option as SelectOption | null;
                      setForm((prev) => ({
                        ...prev,
                        id_modalidad_atencion: selected ? String(selected.value) : "",
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
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition="fixed"
                    styles={selectStyles}
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
                  <label className="text-xs font-medium text-slate-600">Seguimiento <span className="text-red-500">*</span></label>
                  <select
                    value={form.seguimiento}
                    onChange={(e) => {
                      const next = e.target.value === "SI" ? "SI" : "NO";
                      setForm((prev) => ({
                        ...prev,
                        seguimiento: next,
                        tipo_seguimiento: next === "SI" ? prev.tipo_seguimiento : "",
                      }));
                    }}
                    className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="NO">No</option>
                    <option value="SI">Sí</option>
                  </select>
                </div>

                {form.seguimiento === "SI" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">Tipo de seguimiento <span className="text-red-500">*</span></label>
                    <select
                      value={form.tipo_seguimiento}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          tipo_seguimiento: v === "CRONICAS" || v === "SALUD" ? v : "",
                        }));
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
                      setForm((prev) => ({ ...prev, canal_recordatorio: e.target.value }))
                    }
                    className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Ej: WhatsApp, Correo, Llamada"
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">Sede <span className="text-red-500">*</span></label>
                  <Select
                    isClearable
                    isSearchable
                    classNamePrefix="react-select"
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition="fixed"
                    styles={selectStyles}
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
                      const nextSede = selected ? String(selected.value) : "";

                      setProfessionalsSearch("");
                      setForm((prev) => ({
                        ...prev,
                        id_sede: nextSede,
                        id_profesional: "",
                        fecha_hora_inicio: "",
                        fecha_hora_fin: "",
                      }));
                      setAvailabilityByDate([]);
                      setAvailabilitySlots([]);
                      setSelectedSlots([]);
                      setAvailabilityError(null);
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">Profesional <span className="text-red-500">*</span></label>
                  <Select
                    isClearable
                    isSearchable
                    classNamePrefix="react-select"
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition="fixed"
                    styles={selectStyles}
                    placeholder={
                      professionalsQuery.isLoading
                        ? "Cargando profesionales..."
                        : form.id_sede.trim()
                          ? "Buscar profesional por nombre"
                          : "Seleccione una sede primero"
                    }
                    isDisabled={!form.id_sede.trim()}
                    options={(professionalsQuery.data?.data ?? []).map((prof) => ({
                      value: prof.id_profesional,
                      label: `${prof.nombre_completo}${prof.especialidad ? ` - ${prof.especialidad}` : ""}`,
                    }))}
                    value={(() => {
                      return selectedProfessionalOption;
                    })()}
                    onInputChange={(v: string) => {
                      setProfessionalsSearch(v);
                      return v;
                    }}
                    onChange={(option: any) => {
                      const selected = option as SelectOption | null;

                      if (!form.id_sede.trim()) {
                        setError("Seleccione una sede antes de elegir el profesional.");
                        return;
                      }

                      setForm((prev) => ({
                        ...prev,
                        id_profesional: selected ? String(selected.value) : "",
                      }));
                      setAvailabilitySlots([]);
                      setAvailabilityByDate([]);
                      setAvailabilityError(null);
                      setSelectedSlots([]);
                    }}
                  />
                </div>
              </>
            )}

            {step === 4 && (
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Disponibilidad del profesional</p>
                    <p className="text-[11px] text-slate-600">
                      Selecciona un horario de {DEFAULT_APPOINTMENT_DURATION_MINUTES} minutos.
                    </p>
                  </div>
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

                {!form.id_profesional.trim() || !form.id_sede.trim() ? (
                  <p className="text-xs text-slate-500">
                    Selecciona sede y profesional en el paso anterior para consultar disponibilidad.
                  </p>
                ) : (
                  <>
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
                                    setAvailabilityError(null);
                                    return;
                                  }

                                  const minutes = next
                                    .map((t) => minutesFromHHMM(t) ?? -1)
                                    .filter((m) => m >= 0)
                                    .sort((a, b) => a - b);

                                  const isContiguous = minutes.every((m, idx) => {
                                    if (idx === 0) return true;
                                    return (
                                      m - minutes[idx - 1] === DEFAULT_APPOINTMENT_DURATION_MINUTES
                                    );
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
                                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs shadow-sm transition ${
                                      isSelected
                                        ? "border-sky-400 bg-sky-50"
                                        : "border-slate-200 bg-white hover:bg-slate-50"
                                    }`}
                                  >
                                    <div className="space-y-0.5">
                                      <p className="font-semibold text-slate-900">{hhmm} - {endHHMM}</p>
                                      <p className="text-[11px] text-slate-600">Disponible</p>
                                      {selectedSedeName && (
                                        <p className="text-[11px] text-slate-600">Sede: {selectedSedeName}</p>
                                      )}
                                    </div>
                                    <input
                                      type="checkbox"
                                      name="availability_slot"
                                      checked={isSelected}
                                      onChange={toggleSlot}
                                      className="h-4 w-4"
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedSlots.length > 0 && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSlots([]);
                          setAvailabilityError(null);
                          setForm((prev) => ({
                            ...prev,
                            fecha_hora_inicio: "",
                            fecha_hora_fin: "",
                          }));
                        }}
                        className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50"
                      >
                        Quitar horario
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedSlots.length === 0) return;
                          setAvailabilityDate(availabilitySelectedDate);
                          setForm((prev) => ({
                            ...prev,
                            fecha_hora_inicio: computedStartDateTime,
                            fecha_hora_fin: computedEndDateTime,
                          }));
                        }}
                        className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
                      >
                        Usar este horario
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="md:col-span-2 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-900">Revisión</p>
                  <div className="mt-2 grid gap-2 text-xs text-slate-700 md:grid-cols-2">
                    <div>
                      <span className="font-semibold">Paciente:</span> {selectedPacienteLabel || "-"}
                    </div>
                    <div>
                      <span className="font-semibold">Programa:</span> {selectedProgramaLabel || "-"}
                    </div>
                    <div>
                      <span className="font-semibold">Modalidad:</span> {selectedModalidadLabel || "-"}
                    </div>
                    <div>
                      <span className="font-semibold">Tipo de cita:</span> {selectedTipoCitaLabel || "-"}
                    </div>
                    <div>
                      <span className="font-semibold">Sede:</span> {selectedSedeName || "-"}
                    </div>
                    <div>
                      <span className="font-semibold">Profesional:</span> {selectedProfessionalLabel || "-"}
                    </div>
                    <div>
                      <span className="font-semibold">Inicio:</span> {computedStartDateTime ? computedStartDateTime.replace("T", " ") : "-"}
                    </div>
                    <div>
                      <span className="font-semibold">Fin:</span> {computedEndDateTime ? computedEndDateTime.replace("T", " ") : "-"}
                    </div>
                    <div>
                      <span className="font-semibold">Seguimiento:</span> {form.seguimiento}
                    </div>
                    <div>
                      <span className="font-semibold">Tipo seguimiento:</span> {form.seguimiento === "SI" ? (form.tipo_seguimiento || "-") : "-"}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-semibold">Canal recordatorio:</span> {form.canal_recordatorio || "-"}
                    </div>
                  </div>
                </div>
              </div>
            )}
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={step === 1 || mutation.isPending || validatingProfessional}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Atrás
                  </button>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => router.push("/appointments")}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={mutation.isPending || validatingProfessional}
                    className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {mutation.isPending ? (
                      "Guardando..."
                    ) : validatingProfessional ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                        Validando disponibilidad...
                      </span>
                    ) : step < 5 ? (
                      "Siguiente"
                    ) : (
                      "Guardar cita"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
