"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/lib/api";
import { fetchTiposDocumento } from "@/services/catalogs";
import type { TipoDocumento } from "@/services/catalogs";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [isClient, setIsClient] = useState(false);
  const [form, setForm] = useState({
    nombre_completo: "",
    email: "",
    telefono: "",
    id_tipo_documento: "",
    numero_documento: "",
    activo: true,
    password_reset_required: false,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: tiposDocumento } = useQuery<TipoDocumento[]>({
    queryKey: ["tipos-documento"],
    queryFn: fetchTiposDocumento,
  });

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["user-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(`/users/${id}`);
      return res.data;
    },
  });

  useEffect(() => {
    if (user) {
      setForm({
        nombre_completo: user.nombre_completo || "",
        email: user.email || "",
        telefono: user.telefono || "",
        id_tipo_documento: user.id_tipo_documento ? String(user.id_tipo_documento) : "",
        numero_documento: user.numero_documento || "",
        activo: user.activo ?? true,
        password_reset_required: user.password_reset_required ?? false,
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        nombre_completo: form.nombre_completo,
        email: form.email || null,
        telefono: form.telefono,
        activo: form.activo,
        password_reset_required: form.password_reset_required,
      };

      if (form.id_tipo_documento) {
        payload.id_tipo_documento = Number(form.id_tipo_documento);
      }

      if (form.numero_documento) {
        payload.numero_documento = form.numero_documento;
      }

      const res = await apiClient.put(`/users/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      setError(null);
      router.push("/users");
    },
    onError: (err: any) => {
      const backendMessage = err?.response?.data?.message;
      setError(
        typeof backendMessage === "string" && backendMessage.trim().length > 0
          ? backendMessage
          : "No se pudo actualizar el usuario. Verifique los datos e intente de nuevo.",
      );
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre_completo || form.nombre_completo.trim().length === 0) {
      setError("El nombre completo es obligatorio");
      return;
    }

    if (!form.telefono || form.telefono.trim().length === 0) {
      setError("El teléfono es obligatorio");
      return;
    }

    if (form.numero_documento && !form.id_tipo_documento) {
      setError("Debe seleccionar un tipo de documento cuando ingresa número de documento");
      return;
    }

    setError(null);
    mutation.mutate();
  };

  if (!isClient) {
    return null;
  }

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Editar usuario</h1>
            <p className="mt-1 text-sm text-slate-600">
              Actualiza la información administrativa del usuario.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/users")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Volver al listado
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}

            {isLoading && (
              <p className="text-sm text-slate-500">Cargando información del usuario...</p>
            )}

            {isError && !isLoading && (
              <p className="text-sm text-red-600">
                Ocurrió un error al cargar la información del usuario.
              </p>
            )}

            {!isLoading && !isError && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nombre_completo}
                    onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Tipo de documento
                  </label>
                  <select
                    value={form.id_tipo_documento}
                    onChange={(e) => setForm({ ...form, id_tipo_documento: e.target.value })}
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Seleccione</option>
                    {(tiposDocumento ?? []).map((td) => (
                      <option key={td.id_tipo_documento} value={td.id_tipo_documento}>
                        {td.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Número de documento
                  </label>
                  <input
                    type="text"
                    value={form.numero_documento}
                    onChange={(e) => setForm({ ...form, numero_documento: e.target.value })}
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Ingrese el número de documento"
                  />
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.activo}
                      onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-xs font-medium text-slate-600">Usuario activo</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.password_reset_required}
                      onChange={(e) => setForm({ ...form, password_reset_required: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-medium text-slate-600">Requiere cambio de contraseña al iniciar sesión</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => router.push("/users")}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || isLoading}
                className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
