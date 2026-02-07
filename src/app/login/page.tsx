"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { useAuthStore } from "@/store/auth-store";
import { AlertCircle, Stethoscope } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export default function LoginPage() {
  const router = useRouter();
  const { isLoggingIn, setIsLoggingIn } = useAuthStore();
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});

  async function handleSubmit(formData: FormData) {
    setErrors({});

    const username = formData.get("username")?.toString() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    const parse = loginSchema.safeParse({ username, password });
    if (!parse.success) {
      const fieldErrors: { username?: string; password?: string } = {};
      for (const issue of parse.error.issues) {
        if (issue.path[0] === "username") fieldErrors.username = issue.message;
        if (issue.path[0] === "password") fieldErrors.password = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsLoggingIn(true);
      const result = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (result?.error) {
        setErrors({ general: "Usuario o contraseña incorrectos" });
        return;
      }

      router.push("/dashboard");
    } catch (e) {
      setErrors({ general: "Ocurrió un error al iniciar sesión" });
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-sky-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">HC CORHUILA</h1>
            <p className="text-sm text-slate-500">Acceso al sistema de historias clínicas</p>
          </div>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="username">
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="ej. admin"
            />
            {errors.username && (
              <p className="text-xs text-red-600">{errors.username}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          {errors.general && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.general}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="flex w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoggingIn ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
