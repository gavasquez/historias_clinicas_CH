"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getPatientDetailById } from "@/services/patients";
import { getCompanionsByPatient, createCompanion, updateCompanion } from "@/services/companions";
import type { PacienteDetalle } from "@/types/patients";
import type { Acompanante } from "@/types/companions";

interface CompanionFormProps {
  title: string;
  values: {
    nombre: string;
    relacion_con_paciente: string;
    telefono: string;
    direccion: string;
  };
  error: string | null;
  isSubmitting: boolean;
  onChange: (fields: {
    nombre?: string;
    relacion_con_paciente?: string;
    telefono?: string;
    direccion?: string;
  }) => void;
  onSubmit: () => void;
  onCancel?: () => void;
}

function CompanionForm({
  title,
  values,
  error,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
}: CompanionFormProps) {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-700">{title}</p>

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <form
        className="grid gap-2 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!values.nombre.trim() || isSubmitting) return;
          onSubmit();
        }}
      >
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-slate-600">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={values.nombre}
            onChange={(e) => onChange({ nombre: e.target.value })}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Nombre del acompañante"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-slate-600">
            Relación con el paciente
          </label>
          <input
            type="text"
            value={values.relacion_con_paciente}
            onChange={(e) => onChange({ relacion_con_paciente: e.target.value })}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Ej: Madre, Padre, Tutor, Esposo(a)"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-slate-600">Teléfono</label>
          <input
            type="text"
            value={values.telefono}
            onChange={(e) => onChange({ telefono: e.target.value })}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Teléfono de contacto"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-slate-600">Dirección</label>
          <input
            type="text"
            value={values.direccion}
            onChange={(e) => onChange({ direccion: e.target.value })}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Dirección del acompañante"
          />
        </div>

        <div className="md:col-span-2 flex justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PatientCompanionsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const queryClient = useQueryClient();

  const { data: patient } = useQuery<PacienteDetalle | null>({
    queryKey: ["patient", id],
    enabled: !!id,
    queryFn: () => getPatientDetailById(String(id)),
  });

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

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (toast) {
      const idTimeout = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(idTimeout);
    }
  }, [toast]);

  const [companionError, setCompanionError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    relacion_con_paciente: "",
    telefono: "",
    direccion: "",
  });

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
      setToast({ type: "success", message: "Acompañante registrado correctamente" });
    },
    onError: () => {
      setCompanionError("No se pudo registrar el acompañante. Intente de nuevo.");
      setToast({ type: "error", message: "No se pudo registrar el acompañante" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateCompanion(String(id), editingId!, {
        nombre: editForm.nombre,
        relacion_con_paciente: editForm.relacion_con_paciente || undefined,
        telefono: editForm.telefono || undefined,
        direccion: editForm.direccion || undefined,
      }),
    onSuccess: async () => {
      setEditingId(null);
      await queryClient.invalidateQueries({ queryKey: ["companions", id] });
      setToast({ type: "success", message: "Acompañante actualizado correctamente" });
    },
    onError: () => {
      setCompanionError("No se pudo actualizar el acompañante. Intente de nuevo.");
      setToast({ type: "error", message: "No se pudo actualizar el acompañante" });
    },
  });

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Acompañantes del paciente
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Gestione los acompañantes asociados al paciente.
            </p>
            {patient && (
              <p className="mt-1 text-xs text-slate-500">
                Paciente: <span className="font-medium">{patient.nombres} {patient.apellidos}</span> 
                ({patient.tipos_documento?.codigo ?? ""} {patient.numero_documento})
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/patients/${id}`)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Volver al detalle
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <div className="space-y-2 text-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Lista de acompañantes
            </p>

            {loadingCompanions && (
              <p className="text-sm text-slate-500">Cargando acompañantes...</p>
            )}

            {companionsError && !loadingCompanions && (
              <p className="text-sm text-red-600">
                Ocurrió un error al cargar los acompañantes.
              </p>
            )}

            {!loadingCompanions && !companionsError && (companions?.length ?? 0) === 0 && (
              <p className="text-sm text-slate-500">No hay acompañantes registrados.</p>
            )}

            {(companions?.length ?? 0) > 0 && (
              <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-slate-50">
                {companions?.map((acomp) => (
                  <li
                    key={acomp.id_acompanante}
                    className="flex flex-col gap-2 px-3 py-2 md:flex-row md:items-start md:justify-between"
                  >
                    {editingId === acomp.id_acompanante ? (
                      <form
                        className="grid flex-1 gap-2 text-xs md:grid-cols-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!editForm.nombre.trim() || updateMutation.isPending) return;
                          updateMutation.mutate();
                        }}
                      >
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-slate-600">
                            Nombre completo <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editForm.nombre}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, nombre: e.target.value }))
                            }
                            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-slate-600">
                            Relación con el paciente
                          </label>
                          <input
                            type="text"
                            value={editForm.relacion_con_paciente}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                relacion_con_paciente: e.target.value,
                              }))
                            }
                            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-slate-600">
                            Teléfono
                          </label>
                          <input
                            type="text"
                            value={editForm.telefono}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, telefono: e.target.value }))
                            }
                            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-slate-600">
                            Dirección
                          </label>
                          <input
                            type="text"
                            value={editForm.direccion}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, direccion: e.target.value }))
                            }
                            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setCompanionError(null);
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex-1">
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
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(acomp.id_acompanante);
                              setEditForm({
                                nombre: acomp.nombre,
                                relacion_con_paciente: acomp.relacion_con_paciente ?? "",
                                telefono: acomp.telefono ?? "",
                                direccion: acomp.direccion ?? "",
                              });
                              setCompanionError(null);
                            }}
                            className="rounded-lg border border-sky-600 px-3 py-1.5 text-[11px] font-medium text-sky-700 shadow-sm transition hover:bg-sky-50"
                          >
                            Editar
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <CompanionForm
            title="Registrar nuevo acompañante"
            values={companionForm}
            error={companionError}
            isSubmitting={companionMutation.isPending}
            onChange={(fields) =>
              setCompanionForm((prev) => ({ ...prev, ...fields }))
            }
            onSubmit={() => companionMutation.mutate()}
          />
        </div>
      </section>
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-md border border-slate-200 bg-white px-4 py-2 text-xs shadow-lg">
          <p
            className={
              toast.type === "success"
                ? "font-medium text-emerald-700"
                : "font-medium text-red-700"
            }
          >
            {toast.message}
          </p>
        </div>
      )}
    </AppShell>
  );
}
