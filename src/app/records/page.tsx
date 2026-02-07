"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { fetchPatients } from "@/services/patients";
import type { Paciente } from "@/types/patients";

export default function RecordsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Paciente[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setNotFound(false);
      return;
    }
    setIsSearching(true);
    setNotFound(false);
    setResults(null);

    try {
      // Primero intentamos buscar por documento
      let allPatients: Paciente[] = [];
      const byDocRes = await fetchPatients(1, { documento: trimmed });
      allPatients = byDocRes.data ?? [];

      // Si no hay resultados por documento, intentamos por nombre
      if (allPatients.length === 0) {
        const byNameRes = await fetchPatients(1, { nombre: trimmed });
        allPatients = byNameRes.data ?? [];
      }

      if (allPatients.length === 0) {
        setNotFound(true);
      } else {
        setResults(allPatients);
      }
    } catch {
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <AppShell>
      <section className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
            Historias clínicas
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            La consulta y gestión de historias clínicas se realiza siempre en el
            contexto de un paciente específico.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-slate-600">
            Para ver o crear historias clínicas:
          </p>
          <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-xs text-slate-600">
            <li>Ve al módulo de pacientes.</li>
            <li>Busca y selecciona el paciente deseado.</li>
            <li>
              En el detalle del paciente, abre la pestaña
              {" "}
              <span className="font-medium">Historias clínicas</span> para
              consultar o registrar historias y atenciones.
            </li>
          </ol>

          <div className="mt-3">
            <Link
              href="/patients"
              className="inline-flex items-center justify-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              Ir al listado de pacientes
            </Link>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
          >
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Buscar paciente
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Documento, nombre o apellido"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                {isSearching ? "Buscando..." : "Buscar paciente"}
              </button>
            </div>
          </form>

          {/* Resultados de búsqueda */}
          <div className="mt-3 space-y-2 text-xs">
            {notFound && !isSearching && (
              <p className="text-xs text-red-600">
                No se encontraron pacientes con los criterios ingresados.
              </p>
            )}

            {results && results.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Resultados de la búsqueda
                </div>
                <ul className="divide-y divide-slate-100">
                  {results.map((p) => (
                    <li
                      key={p.id_paciente}
                      className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-800">
                          {p.nombres} {p.apellidos}
                        </p>
                        <p className="text-xs text-slate-500">
                          {p.tipos_documento?.codigo ?? ""} {p.numero_documento}
                        </p>
                        <p className="text-xs text-slate-500">
                          {p.tipos_usuario?.descripcion ?? ""}
                          {p.programas_academicos?.nombre
                            ? ` · ${p.programas_academicos.nombre}`
                            : ""}
                          {p.sedes?.nombre ? ` · ${p.sedes.nombre}` : ""}
                        </p>
                        <p className="text-xs">
                          <span
                            className={
                              p.activo === false
                                ? "inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                                : "inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                            }
                          >
                            {p.activo === false ? "Inactivo" : "Activo"}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(`/patients/${p.id_paciente}/records`)}
                        className="rounded-md border border-sky-300 px-2.5 py-1 text-[11px] font-medium text-sky-700 shadow-sm hover:bg-sky-50"
                      >
                        Ver historias clínicas
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
