"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getPatientDetailById } from "@/services/patients";
import { getCompanionsByPatient, createCompanion } from "@/services/companions";
import type { Acompanante } from "@/types/companions";
import type { PacienteDetalle } from "@/types/patients";

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
      setCompanionError("No se pudo registrar el acompañante. Intente de nuevo.");
    },
  });

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
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {isLoading && (
            <p className="text-sm text-slate-500">Cargando información...</p>
          )}

          {isError && !isLoading && (
            <p className="text-sm text-red-600">
              Ocurrió un error al cargar la información del paciente.
            </p>
          )}

          {!isLoading && !isError && !data && (
            <p className="text-sm text-slate-500">Paciente no encontrado.</p>
          )}

          {data && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1 text-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Identificación
                </p>
                <p className="text-slate-800">
                  <span className="font-medium">
                    {data.tipos_documento?.codigo ?? ""}
                  </span>{" "}
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
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Contacto y ubicación
                </p>
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
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Clasificación
                </p>
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
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Condición particular
                </p>
                <p className="whitespace-pre-line text-slate-800">
                  {data.condicion_particular ?? "Sin observaciones"}
                </p>
              </div>

              <div className="space-y-2 text-sm md:col-span-2">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Acompañantes
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
                    Gestionar acompañantes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
