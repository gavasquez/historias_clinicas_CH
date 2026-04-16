"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { createUser, UserCreateInput } from "@/services/users";
import { fetchRoles, type Role } from "@/services/catalogs";

export default function NewUserPage() {
  const router = useRouter();

  const [form, setForm] = useState<UserCreateInput>({
    username: "",
    nombre_completo: "",
    email: "",
    telefono: "",
    password: "",
    id_rol: 2,
  });

  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);

  const { data: roles, isLoading: loadingRoles, isError: rolesError } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: fetchRoles,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.username.trim()) {
        throw new Error("El nombre de usuario es obligatorio.");
      }

      if (!form.nombre_completo.trim()) {
        throw new Error("El nombre completo es obligatorio.");
      }

      const email = (form.email ?? "").trim();

      if (!email) {
        throw new Error("El email es obligatorio.");
      }

      const telefono = (form.telefono ?? "").trim();

      if (!telefono) {
        throw new Error("El teléfono es obligatorio.");
      }

      if (!form.id_rol || form.id_rol <= 0) {
        throw new Error("El rol del usuario es obligatorio.");
      }

      if (!form.password || form.password.length < 6) {
        throw new Error("La contraseña es obligatoria y debe tener al menos 6 caracteres.");
      }

      if (form.password !== confirmPassword) {
        throw new Error("Las contraseñas no coinciden.");
      }

      const payload: UserCreateInput = {
        username: form.username.trim(),
        nombre_completo: form.nombre_completo.trim(),
        email,
        telefono,
        password: form.password,
        id_rol: form.id_rol,
      };

      return createUser(payload);
    },
    onSuccess: () => {
      setError(null);
      router.push("/users");
    },
    onError: async (err: any) => {
      if (err instanceof Error) {
        setError(err.message);
        return;
      }

      const backendMessage = err?.response?.data?.message;
      setError(
        typeof backendMessage === "string" && backendMessage.trim().length > 0
          ? backendMessage
          : "No se pudo crear el usuario. Verifique los datos e intente de nuevo.",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Nuevo usuario del sistema
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Registre los datos básicos de un usuario que podrá acceder al sistema.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/users")}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Volver al listado
            </button>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Nombre de usuario <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                  required
                  className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Usuario para iniciar sesión"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Nombre completo <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.nombre_completo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nombre_completo: e.target.value }))
                  }
                  required
                  className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Nombre y apellidos"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Correo electrónico"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Teléfono <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  value={form.telefono || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, telefono: e.target.value }))
                  }
                  required
                  className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Teléfono"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Contraseña <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Confirmar contraseña <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Repita la contraseña"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Rol del usuario <span className="text-red-600">*</span>
                </label>
                <select
                  value={form.id_rol}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, id_rol: Number(e.target.value) || 0 }))
                  }
                  required
                  className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  disabled={loadingRoles || rolesError}
                >
                  <option value={0} disabled>
                    {loadingRoles
                      ? "Cargando roles..."
                      : rolesError
                      ? "Error cargando roles"
                      : "Seleccione un rol"}
                  </option>
                  {roles?.map((r) => (
                    <option key={r.id_rol} value={r.id_rol}>
                      {r.nombre}
                      {r.descripcion ? ` — ${r.descripcion}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push("/users")}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending ? "Guardando..." : "Crear usuario"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
