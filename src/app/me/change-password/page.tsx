"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AppShell } from "@/components/layout/app-shell";
import Swal from "sweetalert2";
import { signOut } from "next-auth/react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/api/me/change-password", {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      return res.data;
    },
    onSuccess: async () => {
      setError(null);
      
      // Invalidar el query de usuario para recargar el estado actualizado
      await queryClient.invalidateQueries({ queryKey: ["me-user"] });
      
      await Swal.fire({
        icon: "success",
        title: "Contraseña actualizada",
        text: "Tu contraseña fue actualizada correctamente.",
        confirmButtonText: "Continuar",
        confirmButtonColor: "#0ea5e9",
      });
      
      // Cerrar sesión y redirigir al login
      await signOut({ callbackUrl: "/login" });
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const apiMessage = (err.response?.data as any)?.message;
        if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
          setError(apiMessage);
          return;
        }
      }
      setError("No se pudo actualizar la contraseña. Verifique los datos e intente de nuevo.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.current_password || form.current_password.length < 6) {
      setError("La contraseña actual debe tener al menos 6 caracteres");
      return;
    }

    if (!form.new_password || form.new_password.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (form.new_password !== form.confirm_password) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    if (form.current_password === form.new_password) {
      setError("La nueva contraseña debe ser diferente a la actual");
      return;
    }

    setError(null);
    mutation.mutate();
  };

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Cambiar contraseña</h1>
            <p className="mt-1 text-sm text-slate-600">
              Actualiza tu contraseña de acceso al sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Volver
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-1">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Contraseña actual <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={form.current_password}
                  onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Ingresa tu contraseña actual"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Nueva contraseña <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={form.new_password}
                  onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Ingresa tu nueva contraseña (mínimo 6 caracteres)"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Confirmar nueva contraseña <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Confirma tu nueva contraseña"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
