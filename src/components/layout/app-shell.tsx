"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  BarChart3,
  LogOut,
  Stethoscope,
} from "lucide-react";

const navItems = [
  { key: "dashboard", href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { key: "patients", href: "/patients", label: "Pacientes", icon: Users },
  { key: "appointments", href: "/appointments", label: "Citas", icon: CalendarDays },
  { key: "professionals", href: "/professionals", label: "Profesionales", icon: Stethoscope },
  { key: "users", href: "/users", label: "Usuarios", icon: Users },
  { key: "records", href: "/records", label: "Historias clínicas", icon: FileText },
  { key: "reports", href: "/reports", label: "Reportes", icon: BarChart3 },
];

type MyPermission = {
  id_permiso: number;
  codigo: string;
  modulo: string;
};

type PermissionsResponse = {
  roleDescription: string | null;
  data: MyPermission[];
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const roleName = (session?.user as any)?.role as string | undefined;

  const { data: permissionsData } = useQuery<PermissionsResponse>({
    queryKey: ["me-permissions"],
    enabled: mounted && !!roleName,
    queryFn: async () => {
      const res = await fetch("/api/me/permissions");
      if (!res.ok) return { roleDescription: null, data: [] };
      const json = await res.json();
      return {
        roleDescription: json.roleDescription ?? null,
        data: Array.isArray(json?.data) ? (json.data as MyPermission[]) : [],
      };
    },
    staleTime: 60_000,
  });

  const { data: userData } = useQuery({
    queryKey: ["me-user"],
    enabled: mounted && !!session?.user,
    queryFn: async () => {
      const res = await fetch("/api/me/user");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: myProfessional } = useQuery({
    queryKey: ["my-professional"],
    enabled: mounted && !!session?.user,
    queryFn: async () => {
      const res = await fetch("/api/me/professional");
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data ?? null;
    },
  });

  useEffect(() => {
    if (userData?.password_reset_required && pathname !== "/me/change-password") {
      router.push("/me/change-password");
    }
  }, [userData?.password_reset_required, pathname, router]);

  const myPermissions = permissionsData?.data ?? [];
  const roleDescription = permissionsData?.roleDescription ?? (roleName === "super_admin" ? "Super Administrador" : "Usuario del sistema");

  const allowedNavItems = useMemo(() => {
    if (!roleName) return navItems;
    if (roleName === "super_admin") return navItems;

    const modules = new Set(
      (myPermissions ?? [])
        .map((p) => (typeof p.modulo === "string" ? p.modulo.trim().toLowerCase() : ""))
        .filter(Boolean),
    );

    if (modules.size === 0) return navItems;

    const navKeyToModule: Record<string, string> = {
      dashboard: "dashboard",
      patients: "pacientes",
      appointments: "citas",
      professionals: "profesionales",
      users: "admin",
      records: "historias",
      reports: "admin",
    };

    return navItems.filter((item) => {
      const moduleName = navKeyToModule[item.key] ?? item.key;

      if (moduleName === "dashboard") return true;

      // Regla especial para Profesionales:
      // - Visible si el usuario NO es "medico" y tiene módulo "profesionales" o (compatibilidad) "citas".
      if (item.key === "professionals") {
        if (roleName === "medico") return false;
        return modules.has("profesionales") || modules.has("citas");
      }

      return modules.has(moduleName);
    });
  }, [roleName, myPermissions]);

  const userName = session?.user?.name ?? "Usuario";

  const initials = useMemo(() => {
    const parts = userName.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "US";
    if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
    return (
      parts[0]!.charAt(0).toUpperCase() +
      parts[parts.length - 1]!.charAt(0).toUpperCase()
    );
  }, [userName]);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white/90 px-4 py-6 shadow-sm md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white text-sm font-semibold">
            HC
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">HC CORHUILA</p>
            <p className="text-xs text-slate-500">Historias clínicas</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 text-sm">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <button
                key={`${item.href}-${item.label}`}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-sky-50 cursor-pointer ${
                  active
                    ? "bg-sky-100 text-sky-700"
                    : "text-slate-600 hover:text-sky-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-xs font-semibold text-white">
              HC
            </div>
            <span className="text-sm font-semibold text-slate-900">HC CORHUILA</span>
          </div>

          <div className="hidden text-sm font-medium text-slate-700 md:block">Panel de control</div>

          <div className="flex items-center gap-3 text-xs md:text-sm">
            <div className="flex flex-col text-right">
              <span className="font-medium text-slate-800">{userName}</span>
              <span className="text-slate-500">{roleDescription}</span>
            </div>
            {(() => {
              const editRoute =
                roleName === "medico" && (myProfessional as any)?.id_profesional
                  ? `/professionals/${(myProfessional as any).id_profesional}/edit`
                  : userData?.id_usuario
                  ? `/users/${userData.id_usuario}/edit`
                  : null;

              return (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu((v) => !v)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-sky-300 cursor-pointer hover:bg-sky-700"
                    aria-haspopup="menu"
                    aria-expanded={showUserMenu}
                  >
                    {initials}
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-lg">
                      {/* Editar datos de usuario */}
                      <button
                        type="button"
                        disabled={!userData?.id_usuario}
                        onClick={() => {
                          if (userData?.id_usuario) router.push(`/users/${userData.id_usuario}/edit`);
                          setShowUserMenu(false);
                        }}
                        className={
                          userData?.id_usuario
                            ? "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                            : "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-slate-400 cursor-not-allowed"
                        }
                      >
                        Editar datos de usuario
                      </button>
                      {/* Editar datos del profesional (solo médico/enfermera y si existe profesional) */}
                      {(roleName === "medico" || roleName === "enfermera") && (myProfessional as any)?.id_profesional ? (
                        <button
                          type="button"
                          onClick={() => {
                            const idProf = (myProfessional as any)?.id_profesional;
                            if (idProf) router.push(`/professionals/${idProf}/edit`);
                            setShowUserMenu(false);
                          }}
                          className="mt-0.5 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          Editar datos del profesional
                        </button>
                      ) : null}
                      {/* Cerrar sesión */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          signOut({ callbackUrl: "/login" });
                        }}
                        className="mt-0.5 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
