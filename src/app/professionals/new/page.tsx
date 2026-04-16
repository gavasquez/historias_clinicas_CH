"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { AppShell } from "@/components/layout/app-shell";
import { createProfessional } from "@/services/professionals";
import { fetchSedes, fetchEspecialidades } from "@/services/catalogs";
import type { Sede, Especialidad } from "@/services/catalogs";
import { fetchUsers } from "@/services/users";
import type { UserListItem, UsersResponse } from "@/types/users";

interface FormState {
  id_usuario: string;
  id_sede: string;
  id_especialidad: string;
  registro_medico: string;
  firma_digital: string;
  activo: boolean;
}

export default function NewProfessionalPage() {
  const router = useRouter();

  const firmaInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormState>({
    id_usuario: "",
    id_sede: "",
    id_especialidad: "",
    registro_medico: "",
    firma_digital: "",
    activo: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);

  const { data: sedes, isLoading: loadingSedes } = useQuery<Sede[]>({
    queryKey: ["sedes"],
    queryFn: fetchSedes,
  });

  const { data: especialidades, isLoading: loadingEspecialidades } = useQuery<Especialidad[]>({
    queryKey: ["especialidades"],
    queryFn: fetchEspecialidades,
  });

  const { data: usersResponse, isLoading: loadingUsers } = useQuery<UsersResponse>({
    queryKey: ["users"],
    queryFn: () => fetchUsers(1),
  });

  const users: UserListItem[] = usersResponse?.data ?? [];

  const mutation = useMutation({
    mutationFn: async () => {
      const idUsuarioNum = Number(form.id_usuario);
      const idSedeNum = form.id_sede ? Number(form.id_sede) : undefined;
      const idEspecialidadNum = form.id_especialidad
        ? Number(form.id_especialidad)
        : undefined;

      return createProfessional({
        id_usuario: idUsuarioNum,
        id_sede: idSedeNum,
        id_especialidad: idEspecialidadNum,
        registro_medico: form.registro_medico || undefined,
        firma_digital: form.firma_digital || undefined,
        activo: form.activo,
      });
    },
    onSuccess: () => {
      setError(null);
      router.push("/professionals");
    },
    onError: () => {
      setError("No se pudo registrar el profesional. Verifique los datos e intente de nuevo.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError("Debe seleccionar un usuario.");
      return;
    }
    mutation.mutate();
  };

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Registrar profesional de la salud
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Formulario simple para crear un profesional de salud asociado a un usuario existente.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/professionals")}
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
                Usuario del sistema <span className="text-red-500">*</span>
              </label>
              <select
                value={form.id_usuario}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    setSelectedUser(null);
                    setForm((prev) => ({ ...prev, id_usuario: "" }));
                    return;
                  }

                  const id = Number(value);
                  const list = users;
                  const found = list.find((u) => u.id_usuario === id) ?? null;
                  setSelectedUser(found);
                  setForm((prev) => ({ ...prev, id_usuario: value }));
                }}
                className="mt-1 h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">
                  {loadingUsers ? "Cargando usuarios..." : "Seleccione un usuario"}
                </option>
                {users
                  .filter((user) => {
                    const q = userSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      user.nombre_completo.toLowerCase().includes(q) ||
                      (user.email ?? "").toLowerCase().includes(q)
                    );
                  })
                  .map((user) => (
                    <option key={user.id_usuario} value={user.id_usuario}>
                      {user.nombre_completo}
                      {user.email ? ` (${user.email})` : ""}
                    </option>
                  ))}
              </select>
              {selectedUser && (
                <p className="mt-1 text-[11px] text-emerald-700">
                  Usuario seleccionado: {selectedUser.nombre_completo}
                  {selectedUser.email ? ` (${selectedUser.email})` : ""}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Sede</label>
              <select
                value={form.id_sede}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, id_sede: e.target.value }))
                }
                className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">
                  {loadingSedes ? "Cargando sedes..." : "Seleccione una sede (opcional)"}
                </option>
                {(sedes ?? []).map((sede: Sede) => (
                  <option key={sede.id_sede} value={sede.id_sede}>
                    {sede.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Especialidad</label>
              <select
                value={form.id_especialidad}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, id_especialidad: e.target.value }))
                }
                className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">
                  {loadingEspecialidades
                    ? "Cargando especialidades..."
                    : "Seleccione una especialidad (opcional)"}
                </option>
                {(especialidades ?? []).map((esp: Especialidad) => (
                  <option key={esp.id_especialidad} value={esp.id_especialidad}>
                    {esp.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Registro médico</label>
              <input
                type="text"
                value={form.registro_medico}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, registro_medico: e.target.value }))
                }
                className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Registro médico (opcional)"
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-medium text-slate-600">Firma digital (imagen)</label>
              <input
                type="file"
                accept="image/*"
                ref={firmaInputRef}
                onClick={(e) => {
                  (e.currentTarget as HTMLInputElement).value = "";
                }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    setForm((prev) => ({ ...prev, firma_digital: "" }));
                    return;
                  }

                  if (!file.type.startsWith("image/")) {
                    setError("El archivo de firma debe ser una imagen.");
                    setForm((prev) => ({ ...prev, firma_digital: "" }));
                    return;
                  }

                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = typeof reader.result === "string" ? reader.result : "";
                    setForm((prev) => ({ ...prev, firma_digital: result }));
                    setError(null);
                  };
                  reader.onerror = () => {
                    setError("No se pudo leer el archivo de firma. Intente de nuevo.");
                    setForm((prev) => ({ ...prev, firma_digital: "" }));
                  };
                  reader.readAsDataURL(file);
                }}
                className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs leading-9 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 file:mr-3 file:h-9 file:border-0 file:bg-slate-100 file:px-3 file:text-xs file:font-medium file:text-slate-700 file:leading-9"
              />
              {form.firma_digital && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void Swal.fire({
                        title: "Firma digital",
                        imageUrl: form.firma_digital,
                        imageAlt: "Firma digital",
                        showCloseButton: true,
                        showConfirmButton: false,
                        background: "#ffffff",
                        width: 700,
                        imageWidth: 640,
                      });
                    }}
                    className="w-fit rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Ver firma
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, firma_digital: "" }));
                      if (firmaInputRef.current) {
                        firmaInputRef.current.value = "";
                      }
                    }}
                    className="w-fit rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 transition hover:bg-red-100"
                  >
                    Quitar firma
                  </button>
                </div>
              )}
              {form.firma_digital ? (
                <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                  <p className="text-[11px] font-medium text-slate-600">Vista previa</p>
                  <img
                    src={form.firma_digital}
                    alt="Firma digital"
                    className="mt-2 max-h-24 w-auto rounded bg-white p-1"
                  />
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-slate-500">
                  Opcional. Recomendado: PNG con fondo transparente.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="activo"
                type="checkbox"
                checked={form.activo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, activo: e.target.checked }))
                }
                className="h-3 w-3 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <label htmlFor="activo" className="text-xs text-slate-700">
                Profesional activo
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push("/professionals")}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? "Guardando..." : "Guardar profesional"}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
