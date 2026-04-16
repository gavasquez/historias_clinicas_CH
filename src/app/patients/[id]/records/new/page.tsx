"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getPatientDetailById } from "@/services/patients";
import { fetchProfessionals } from "@/services/professionals";
import { fetchTiposHistoriaClinica } from "@/services/catalogs";
import type { PacienteDetalle } from "@/types/patients";
import type { ProfesionalSaludListItem } from "@/types/professionals";
import type { TipoHistoriaClinica } from "@/services/catalogs";
import { apiClient } from "@/lib/api";

const Select = dynamic(() => import("react-select"), { ssr: false });

interface HistoriaFormState {
  id_tipo_historia: string;
  id_profesional_responsable: string;
  motivo_consulta: string;
  enfermedad_actual: string;
  antecedentes_personales: string;
  antecedentes_familiares: string;
}

export default function NewPatientRecordPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params?.id;

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const idTipoFromQuery = searchParams.get("id_tipo_historia");
    const parsed = idTipoFromQuery ? Number(idTipoFromQuery) : null;
    if (!parsed || !Number.isInteger(parsed) || parsed <= 0) return;
    setForm((prev) => ({
      ...prev,
      id_tipo_historia: String(parsed),
    }));
  }, [searchParams]);

  const [form, setForm] = useState<HistoriaFormState>({
    id_tipo_historia: "",
    id_profesional_responsable: "",
    motivo_consulta: "",
    enfermedad_actual: "",
    antecedentes_personales: "",
    antecedentes_familiares: "",
  });
  const [error, setError] = useState<string | null>(null);

  const { data: patient, isLoading, isError } = useQuery<PacienteDetalle | null>({
    queryKey: ["patient-records-new", id],
    enabled: !!id,
    queryFn: () => getPatientDetailById(String(id)),
  });

  const { data: professionalsData, isLoading: loadingProfessionals } = useQuery({
    queryKey: ["professionals-for-record"],
    queryFn: () => fetchProfessionals(1, {}),
  });

  const { data: tiposHistoriaData, isLoading: loadingTiposHistoria } = useQuery({
    queryKey: ["tipos-historia-clinica"],
    queryFn: () => fetchTiposHistoriaClinica(),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const payload: any = {
        id_tipo_historia: Number(form.id_tipo_historia),
        motivo_consulta: form.motivo_consulta || undefined,
        enfermedad_actual: form.enfermedad_actual || undefined,
        antecedentes_personales: form.antecedentes_personales || undefined,
        antecedentes_familiares: form.antecedentes_familiares || undefined,
      };
      if (form.id_profesional_responsable.trim()) {
        payload.id_profesional_responsable = Number(form.id_profesional_responsable);
      }
      return apiClient.post(`/patients/${id}/records`, payload);
    },
    onSuccess: () => {
      setError(null);
      router.push(`/patients/${id}/records`);
    },
    onError: (err: any) => {
      const backendMessage = err?.response?.data?.message;
      setError(
        typeof backendMessage === "string" && backendMessage.trim().length > 0
          ? backendMessage
          : "No se pudo crear la historia clínica. Verifique los datos e intente de nuevo.",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id_tipo_historia.trim()) {
      setError("Debe seleccionar el tipo de historia clínica.");
      return;
    }
    mutation.mutate();
  };

  if (!isClient) {
    // Evitamos renderizar Select durante SSR para prevenir hydration mismatch
    return null;
  }

  if (isLoading || !patient) {
    return (
      <AppShell>
        <section className="space-y-4">
          <p className="text-sm text-slate-500">Cargando información del paciente...</p>
        </section>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell>
        <section className="space-y-4">
          <p className="text-sm text-red-600">
            Ocurrió un error al cargar la información del paciente.
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Nueva historia clínica
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Registre la información principal de la historia clínica del paciente.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/patients/${id}/records`)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Volver a historias
            </button>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-1 text-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Paciente</p>
            <p className="text-sm font-medium text-slate-900">
              {patient.nombres} {patient.apellidos}
            </p>
            <p className="text-xs text-slate-600">
              {patient.tipos_documento?.codigo ?? ""} {patient.numero_documento}
            </p>
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Tipo de historia clínica</label>
                <Select
                  classNamePrefix="react-select"
                  placeholder={
                    loadingTiposHistoria
                      ? "Cargando tipos de historia..."
                      : "Seleccione el tipo de historia"
                  }
                  isClearable
                  options={(tiposHistoriaData ?? []).map((t: TipoHistoriaClinica) => ({
                    value: t.id_tipo_historia,
                    label: t.descripcion,
                  }))}
                  value={(() => {
                    const idTipo = form.id_tipo_historia ? Number(form.id_tipo_historia) : null;
                    if (!idTipo) return null;
                    const opts = (tiposHistoriaData ?? []).map((t: TipoHistoriaClinica) => ({
                      value: t.id_tipo_historia,
                      label: t.descripcion,
                    }));
                    return opts.find((o) => o.value === idTipo) ?? null;
                  })()}
                  onChange={(option: any) => {
                    const selected = option as { value: number; label: string } | null;
                    setForm((prev) => ({
                      ...prev,
                      id_tipo_historia: selected ? String(selected.value) : "",
                    }));
                  }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Profesional responsable</label>
                <Select
                  isClearable
                  isSearchable
                  classNamePrefix="react-select"
                  placeholder={
                    loadingProfessionals
                      ? "Cargando profesionales..."
                      : "Seleccione un profesional (opcional)"
                  }
                  options={(professionalsData?.data ?? []).map((prof: ProfesionalSaludListItem) => ({
                    value: prof.id_profesional,
                    label: prof.nombre_completo,
                  }))}
                  value={(() => {
                    const idProf = form.id_profesional_responsable
                      ? Number(form.id_profesional_responsable)
                      : null;
                    if (!idProf) return null;
                    const opts = (professionalsData?.data ?? []).map(
                      (prof: ProfesionalSaludListItem) => ({
                        value: prof.id_profesional,
                        label: prof.nombre_completo,
                      }),
                    );
                    return opts.find((o) => o.value === idProf) ?? null;
                  })()}
                  onChange={(option: any) => {
                    const selected = option as { value: number; label: string } | null;
                    setForm((prev) => ({
                      ...prev,
                      id_profesional_responsable: selected ? String(selected.value) : "",
                    }));
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Motivo de consulta</label>
              <textarea
                value={form.motivo_consulta}
                onChange={(e) => setForm((prev) => ({ ...prev, motivo_consulta: e.target.value }))}
                className="min-h-[60px] w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Enfermedad actual</label>
              <textarea
                value={form.enfermedad_actual}
                onChange={(e) => setForm((prev) => ({ ...prev, enfermedad_actual: e.target.value }))}
                className="min-h-[60px] w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Antecedentes personales</label>
                <textarea
                  value={form.antecedentes_personales}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, antecedentes_personales: e.target.value }))
                  }
                  className="min-h-[60px] w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Antecedentes familiares</label>
                <textarea
                  value={form.antecedentes_familiares}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, antecedentes_familiares: e.target.value }))
                  }
                  className="min-h-[60px] w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push(`/patients/${id}/records`)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending ? "Guardando..." : "Guardar historia"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
