"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { fetchUsers, markUserAsProfessional, toggleUserActive } from "@/services/users";
import type { UserListItem } from "@/types/users";
import Swal from "sweetalert2";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["users", page, { search }],
    queryFn: () => fetchUsers(page, search),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      toggleUserActive(id, activo),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const markProfessionalMutation = useMutation({
    mutationFn: (id_usuario: number) => markUserAsProfessional(id_usuario),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 5;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Usuarios del sistema
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Consulta básica de usuarios que pueden acceder al sistema.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => window.location.assign("/users/new")}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              Nuevo usuario
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">
              Buscar usuario
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Nombre completo o email"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isFetching}
            >
              {isFetching ? "Buscando..." : "Aplicar filtro"}
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Nombre completo</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Profesional</th>
                  <th className="px-4 py-3">Creación</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-6 text-center text-[11px] text-slate-500"
                    >
                      Cargando usuarios...
                    </td>
                  </tr>
                )}

                {isError && !isLoading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-6 text-center text-[11px] text-red-600"
                    >
                      Ocurrió un error al cargar los usuarios.
                    </td>
                  </tr>
                )}

                {!isLoading && !isError && users.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-6 text-center text-[11px] text-slate-500"
                    >
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}

                {!isLoading && !isError &&
                  users.map((u) => (
                    <tr
                      key={u.id_usuario}
                      className="border-t border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {u.username ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        {u.nombre_completo}
                      </td>
                      <td className="px-4 py-3">
                        {u.email ?? "Sin email"}
                      </td>
                      <td className="px-4 py-3">
                        {u.telefono || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="font-medium text-slate-800">
                            {u.rol?.nombre ?? "-"}
                          </div>
                          {u.rol?.descripcion && (
                            <div className="text-[11px] text-slate-500">
                              {u.rol.descripcion}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            u.profesional
                              ? "inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700"
                              : "inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500"
                          }
                        >
                          {u.profesional ? "Sí" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.fecha_creacion
                          ? new Date(u.fecha_creacion).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            u.activo
                              ? "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                              : "inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500"
                          }
                        >
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={markProfessionalMutation.isPending || toggleActiveMutation.isPending}
                            onClick={async () => {
                              if (u.profesional?.id_profesional) {
                                router.push(`/professionals/${u.profesional.id_profesional}`);
                                return;
                              }

                              const result = await Swal.fire({
                                title: "¿Crear profesional de salud?",
                                html: `Se creará el registro en <b>profesionales de salud</b> para:<br/><br/><b>${u.nombre_completo}</b><br/>Usuario: <b>${u.username ?? "-"}</b><br/>Email: <b>${u.email ?? "Sin email"}</b><br/>Teléfono: <b>${u.telefono || "-"}</b>`,
                                icon: "question",
                                showCancelButton: true,
                                confirmButtonText: "Confirmar",
                                cancelButtonText: "Cancelar",
                                confirmButtonColor: "#4f46e5",
                                cancelButtonColor: "#6b7280",
                              });

                              if (!result.isConfirmed) return;
                              try {
                                const created = await markProfessionalMutation.mutateAsync(
                                  u.id_usuario,
                                );
                                const goResult = await Swal.fire({
                                  title: created.alreadyExists
                                    ? "Este usuario ya es profesional"
                                    : "Profesional creado",
                                  text: "¿Desea ir al detalle del profesional?",
                                  icon: "success",
                                  showCancelButton: true,
                                  confirmButtonText: "Ir al profesional",
                                  cancelButtonText: "Cerrar",
                                  confirmButtonColor: "#0ea5e9",
                                  cancelButtonColor: "#6b7280",
                                });

                                if (goResult.isConfirmed) {
                                  router.push(`/professionals/${created.id_profesional}`);
                                }
                              } catch {
                                // error ya manejado por react-query; no duplicamos mensajes
                              }
                            }}
                            className={
                              u.profesional
                                ? "rounded-lg border border-indigo-300 px-2 py-1 text-xs font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                                : "rounded-lg border border-indigo-300 px-2 py-1 text-xs font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                            }
                          >
                            {u.profesional ? "Ver/Editar profesional" : "Crear profesional"}
                          </button>

                          <button
                            type="button"
                            disabled={toggleActiveMutation.isPending}
                            onClick={async () => {
                              const nextActive = !u.activo;
                              const result = await Swal.fire({
                                title: nextActive
                                  ? "¿Activar usuario?"
                                  : "¿Inactivar usuario?",
                                text: nextActive
                                  ? "El usuario podrá volver a iniciar sesión."
                                  : "El usuario no podrá iniciar sesión.",
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonText: nextActive ? "Activar" : "Inactivar",
                                cancelButtonText: "Cancelar",
                                confirmButtonColor: nextActive ? "#0ea5e9" : "#ef4444",
                                cancelButtonColor: "#6b7280",
                              });

                              if (!result.isConfirmed) return;
                              toggleActiveMutation.mutate({
                                id: u.id_usuario,
                                activo: nextActive,
                              });
                            }}
                            className={
                              u.activo
                                ? "rounded-lg border border-red-300 px-2 py-1 text-xs font-medium text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                : "rounded-lg border border-sky-300 px-2 py-1 text-xs font-medium text-sky-700 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                            }
                          >
                            {u.activo ? "Inactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-slate-600">
            Página <span className="font-semibold text-slate-900">{page}</span> de{" "}
            <span className="font-semibold text-slate-900">{totalPages}</span> · Total: {total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1 || isFetching}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages || isFetching}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
