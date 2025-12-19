"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import type { PatientsResponse } from "@/types/patients";
import { fetchPatients, togglePatientActive } from "@/services/patients";
import Swal from "sweetalert2";

export function PatientsView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [documento, setDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("");
  const [programa, setPrograma] = useState("");

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => togglePatientActive(id, activo),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  const estadoBadgeClasses = (activo?: boolean) => {
    const base =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border";
    if (activo === false) return `${base} border-slate-200 bg-slate-50 text-slate-500`;
    return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
  };

  const { data, isLoading, isError } = useQuery<PatientsResponse>({
    queryKey: [
      "patients",
      page,
      { documento, nombre, tipoUsuario, programa },
    ],
    queryFn: () =>
      fetchPatients(page, {
        documento,
        nombre,
        tipoUsuario,
        programa,
      }),
  });

  const patients = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Pacientes
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Consulta básica de pacientes registrados en el sistema.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push("/patients/new")}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              Nuevo paciente
            </button>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">
              Documento
            </label>
            <input
              type="text"
              value={documento}
              onChange={(e) => {
                setPage(1);
                setDocumento(e.target.value);
              }}
              className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Número de documento"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">
              Nombre / Apellido
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => {
                setPage(1);
                setNombre(e.target.value);
              }}
              className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Buscar por nombre o apellido"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">
              Tipo de usuario
            </label>
            <input
              type="text"
              value={tipoUsuario}
              onChange={(e) => {
                setPage(1);
                setTipoUsuario(e.target.value);
              }}
              className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Ej: Estudiante, Docente"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">
              Programa académico
            </label>
            <input
              type="text"
              value={programa}
              onChange={(e) => {
                setPage(1);
                setPrograma(e.target.value);
              }}
              className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Nombre del programa"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Tipo usuario</th>
                  <th className="px-4 py-3">Programa</th>
                  <th className="px-4 py-3">Sede</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-slate-500"
                    >
                      Cargando pacientes...
                    </td>
                  </tr>
                )}

                {isError && !isLoading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-red-600"
                    >
                      Ocurrió un error al cargar los pacientes.
                    </td>
                  </tr>
                )}

                {!isLoading && !isError && patients.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-slate-500"
                    >
                      No hay pacientes registrados.
                    </td>
                  </tr>
                )}

                {!isLoading && !isError &&
                  patients.map((p) => (
                    <tr
                      key={p.id_paciente}
                      className="border-t border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-3 text-xs md:text-sm">
                        <span className="font-medium text-slate-800">
                          {p.tipos_documento?.codigo ?? ""}
                        </span>{" "}
                        <span className="text-slate-700">
                          {p.numero_documento}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm">
                        {p.nombres} {p.apellidos}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm">
                        {p.tipos_usuario?.descripcion ?? ""}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm">
                        {p.programas_academicos?.nombre ?? ""}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm">
                        {p.sedes?.nombre ?? ""}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm">
                        <span className={estadoBadgeClasses(p.activo)}>
                          {p.activo === false ? "Inactivo" : "Activo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs md:text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(`/patients/${p.id_paciente}`)}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                          >
                            Ver
                          </button>
                          <button
                            type="button"
                            disabled={toggleActiveMutation.isPending}
                            onClick={async () => {
                              const nextActive = p.activo === false;
                              const result = await Swal.fire({
                                title: nextActive ? "¿Activar paciente?" : "¿Inactivar paciente?",
                                text: nextActive
                                  ? "El paciente volverá a estar disponible en el sistema."
                                  : "El paciente quedará inactivo en el sistema.",
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonText: nextActive ? "Activar" : "Inactivar",
                                cancelButtonText: "Cancelar",
                                confirmButtonColor: nextActive ? "#0ea5e9" : "#ef4444",
                                cancelButtonColor: "#6b7280",
                              });

                              if (!result.isConfirmed) return;
                              toggleActiveMutation.mutate({
                                id: String(p.id_paciente),
                                activo: nextActive,
                              });
                            }}
                            className={
                              p.activo === false
                                ? "rounded-lg border border-sky-300 px-2 py-1 text-xs font-medium text-sky-700 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                                : "rounded-lg border border-red-300 px-2 py-1 text-xs font-medium text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            }
                          >
                            {p.activo === false ? "Activar" : "Inactivar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <span>
                Página {pagination.page} de {pagination.totalPages} · {" "}
                {pagination.total} pacientes
              </span>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  Anterior
                </button>
                <button
                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPage((currentPage: number) =>
                      pagination
                        ? Math.min(currentPage + 1, pagination.totalPages)
                        : currentPage,
                    )
                  }
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
