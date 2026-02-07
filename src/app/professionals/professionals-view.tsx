"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchProfessionals } from "@/services/professionals";
import {
  fetchEspecialidades,
  fetchSedes,
  type Especialidad,
  type Sede,
} from "@/services/catalogs";
import type { ProfesionalSaludListItem, ProfessionalsResponse } from "@/types/professionals";

const PAGE_SIZE = 5;

export function ProfessionalsView() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [nombreFilter, setNombreFilter] = useState("");
  const [especialidadFilter, setEspecialidadFilter] = useState("");
  const [sedeFilter, setSedeFilter] = useState("");

  const { data: sedes, isLoading: loadingSedes } = useQuery<Sede[]>({
    queryKey: ["sedes"],
    queryFn: fetchSedes,
  });

  const { data: especialidades, isLoading: loadingEspecialidades } = useQuery<Especialidad[]>({
    queryKey: ["especialidades"],
    queryFn: fetchEspecialidades,
  });

  const { data, isLoading, isError } = useQuery<ProfessionalsResponse>({
    queryKey: ["professionals", page, nombreFilter, especialidadFilter, sedeFilter],
    queryFn: () =>
      fetchProfessionals(page, {
        nombre: nombreFilter || undefined,
        especialidad: especialidadFilter || undefined,
        sede: sedeFilter || undefined,
      }),
  });

  const professionals = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
            Profesionales de la salud
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Listado base de profesionales para la gestión de agenda y atenciones.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/professionals/new")}
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            Nuevo profesional
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 text-xs">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Nombre</label>
          <input
            type="text"
            value={nombreFilter}
            onChange={(e) => {
              setPage(1);
              setNombreFilter(e.target.value);
            }}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Nombre del profesional"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Especialidad</label>
          <select
            value={especialidadFilter}
            onChange={(e) => {
              setPage(1);
              setEspecialidadFilter(e.target.value);
            }}
            disabled={loadingEspecialidades}
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <option value="">Todas</option>
            {(especialidades ?? []).map((esp) => (
              <option key={esp.id_especialidad} value={esp.nombre}>
                {esp.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Sede</label>
          <select
            value={sedeFilter}
            onChange={(e) => {
              setPage(1);
              setSedeFilter(e.target.value);
            }}
            disabled={loadingSedes}
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <option value="">Todas</option>
            {(sedes ?? []).map((s) => (
              <option key={s.id_sede} value={s.nombre}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {isLoading && (
          <p className="text-sm text-slate-500">Cargando profesionales...</p>
        )}

        {isError && !isLoading && (
          <p className="text-sm text-red-600">
            Ocurrió un error al cargar los profesionales.
          </p>
        )}

        {!isLoading && !isError && professionals.length === 0 && (
          <p className="text-sm text-slate-500">No hay profesionales registrados.</p>
        )}

        {!isLoading && !isError && professionals.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[11px]">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Especialidad</th>
                  <th className="px-3 py-2">Sede</th>
                  <th className="px-3 py-2">Registro</th>
                  <th className="px-3 py-2">Teléfono</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                {professionals.map((prof: ProfesionalSaludListItem) => (
                  <tr key={prof.id_profesional} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">{prof.nombre_completo}</div>
                      {prof.email && (
                        <div className="text-[10px] text-slate-500">{prof.email}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">{prof.especialidad ?? "No registrada"}</td>
                    <td className="px-3 py-2">{prof.sede ?? "No registrada"}</td>
                    <td className="px-3 py-2">{prof.registro_medico ?? "No registrado"}</td>
                    <td className="px-3 py-2">{prof.telefono_contacto ?? "No registrado"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          prof.activo
                            ? "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
                            : "inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                        }
                      >
                        {prof.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/professionals/${prof.id_profesional}/edit`)}
                          className="rounded-lg border border-sky-300 px-2 py-1 text-[11px] font-medium text-sky-700 shadow-sm transition hover:bg-sky-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/professionals/${prof.id_profesional}`)}
                          className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                        >
                          Ver agenda
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-600">
          <span>
            Página {page} de {totalPages} ({total} profesionales)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
