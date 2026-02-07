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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const roleName = (session?.user as any)?.role as string | undefined;

  const { data: myPermissions } = useQuery<MyPermission[]>({
    queryKey: ["me-permissions"],
    enabled: mounted && !!roleName && roleName !== "super_admin",
    queryFn: async () => {
      const res = await fetch("/api/me/permissions");
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json?.data) ? (json.data as MyPermission[]) : [];
    },
    staleTime: 60_000,
  });

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
      professionals: "citas",
      users: "admin",
      records: "historias",
      reports: "admin",
    };

    return navItems.filter((item) => {
      const moduleName = navKeyToModule[item.key] ?? item.key;

      if (moduleName === "dashboard") return true;

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
              <span className="text-slate-500">Usuario del sistema</span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
