"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { AppShell } from "@/components/layout/app-shell";
import { getProfessionalById, updateProfessional } from "@/services/professionals";
import { fetchEspecialidades, fetchSedes, type Especialidad, type Sede } from "@/services/catalogs";
import type { ProfessionalDetail } from "@/types/professionals";

export default function EditProfessionalPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const firmaInputRef = useRef<HTMLInputElement | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<ProfessionalDetail | null>({
    queryKey: ["professional", id],
    enabled: !!id,
    queryFn: () => getProfessionalById(String(id)),
  });

  const { data: sedes, isLoading: loadingSedes } = useQuery<Sede[]>({
    queryKey: ["sedes"],
    queryFn: fetchSedes,
  });

  const { data: especialidades, isLoading: loadingEspecialidades } = useQuery<Especialidad[]>({
    queryKey: ["especialidades"],
    queryFn: fetchEspecialidades,
  });

  const [form, setForm] = useState({
    id_sede: 0,
    id_especialidad: 0,
    registro_medico: "",
    firma_digital: "",
    activo: true,
  });

  const sedeIdFromName = useMemo(() => {
    if (!data?.sede?.nombre) return 0;
    return (sedes ?? []).find((s) => s.nombre === data.sede?.nombre)?.id_sede ?? 0;
  }, [data?.sede?.nombre, sedes]);

  const especialidadIdFromName = useMemo(() => {
    if (!data?.especialidad?.nombre) return 0;
    return (especialidades ?? []).find((e) => e.nombre === data.especialidad?.nombre)
      ?.id_especialidad ?? 0;
  }, [data?.especialidad?.nombre, especialidades]);

  useEffect(() => {
    if (!data) return;
    setForm({
      id_sede: sedeIdFromName,
      id_especialidad: especialidadIdFromName,
      registro_medico: data.registro_medico ?? "",
      firma_digital: data.firma_digital ?? "",
      activo: data.activo,
    });
  }, [data, sedeIdFromName, especialidadIdFromName]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("ID inválido");
      return updateProfessional(id, {
        id_sede: form.id_sede,
        id_especialidad: form.id_especialidad,
        registro_medico: form.registro_medico,
        firma_digital: form.firma_digital,
        activo: form.activo,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["professional", id] });
      await Swal.fire({
        title: "Actualizado",
        text: "Los datos del profesional se actualizaron correctamente.",
        icon: "success",
        confirmButtonText: "Volver al detalle",
        confirmButtonColor: "#0ea5e9",
      });
      router.push(`/professionals/${id}`);
    },
    onError: async (err: any) => {
      const message = err?.response?.data?.message;
      await Swal.fire({
        title: "Error",
        text:
          typeof message === "string" && message.trim().length > 0
            ? message
            : "No se pudieron actualizar los datos del profesional.",
        icon: "error",
        confirmButtonText: "Cerrar",
        confirmButtonColor: "#ef4444",
      });
    },
  });

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Editar profesional
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Actualiza los datos básicos del profesional.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/professionals/${id}`)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Volver al detalle
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {isLoading && (
            <p className="text-sm text-slate-500">Cargando información del profesional...</p>
          )}

          {isError && !isLoading && (
            <p className="text-sm text-red-600">Ocurrió un error al cargar el profesional.</p>
          )}

          {!isLoading && !isError && !data && (
            <p className="text-sm text-slate-500">Profesional no encontrado.</p>
          )}

          {!isLoading && !isError && data && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Sede</label>
                  <select
                    value={form.id_sede}
                    onChange={(e) => setForm((prev) => ({ ...prev, id_sede: Number(e.target.value) || 0 }))}
                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    disabled={loadingSedes}
                  >
                    <option value={0}>
                      {loadingSedes ? "Cargando sedes..." : "Seleccione una sede"}
                    </option>
                    {(sedes ?? []).map((s) => (
                      <option key={s.id_sede} value={s.id_sede}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Especialidad</label>
                  <select
                    value={form.id_especialidad}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        id_especialidad: Number(e.target.value) || 0,
                      }))
                    }
                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    disabled={loadingEspecialidades}
                  >
                    <option value={0}>
                      {loadingEspecialidades
                        ? "Cargando especialidades..."
                        : "Seleccione una especialidad"}
                    </option>
                    {(especialidades ?? []).map((esp) => (
                      <option key={esp.id_especialidad} value={esp.id_especialidad}>
                        {esp.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Registro médico</label>
                  <input
                    type="text"
                    value={form.registro_medico}
                    onChange={(e) => setForm((prev) => ({ ...prev, registro_medico: e.target.value }))}
                    className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Ej: RM-12345"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
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
                      if (!file) return;

                      if (!file.type.startsWith("image/")) {
                        Swal.fire({
                          title: "Archivo inválido",
                          text: "El archivo de firma debe ser una imagen.",
                          icon: "error",
                          confirmButtonText: "Cerrar",
                          confirmButtonColor: "#ef4444",
                        });
                        setForm((prev) => ({ ...prev, firma_digital: "" }));
                        return;
                      }

                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = typeof reader.result === "string" ? reader.result : "";
                        setForm((prev) => ({ ...prev, firma_digital: result }));
                      };
                      reader.onerror = () => {
                        Swal.fire({
                          title: "Error",
                          text: "No se pudo leer el archivo de firma. Intente de nuevo.",
                          icon: "error",
                          confirmButtonText: "Cerrar",
                          confirmButtonColor: "#ef4444",
                        });
                        setForm((prev) => ({ ...prev, firma_digital: "" }));
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs leading-9 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 file:mr-3 file:h-9 file:border-0 file:bg-slate-100 file:px-3 file:text-xs file:font-medium file:text-slate-700 file:leading-9"
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
                    <p className="mt-1 text-[11px] text-slate-500">No hay firma registrada.</p>
                  )}
                </div>

                <div className="flex items-center gap-2 md:col-span-2">
                  <input
                    id="activo"
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
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
                  onClick={() => router.push(`/professionals/${id}`)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {mutation.isPending ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </AppShell>
  );
}
