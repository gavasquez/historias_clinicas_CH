"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import type { PatientCreateInput } from "@/services/patients";
import { getPatientById, updatePatient } from "@/services/patients";
import type { PacienteDetalleApi } from "@/types/patients";
import { usePatientCatalogs } from "@/hooks/usePatientCatalogs";
import { patientSchema } from "@/validation/patient";
import type {
  TipoDocumento,
  Genero,
  EstadoCivil,
  TipoSangre,
  Sede,
  ProgramaAcademico,
  Eps,
  TipoUsuario,
  Departamento,
  Ciudad,
} from "@/services/catalogs";

export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [idDepartamento, setIdDepartamento] = useState<number | undefined>(undefined);

  const [form, setForm] = useState<PatientCreateInput | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const {
    loadingTipos,
    tiposDocumento,
    generos,
    estadosCiviles,
    tiposSangre,
    sedes,
    tiposUsuario,
    eps,
    programas,
    departamentos,
    ciudades,
  } = usePatientCatalogs(
    form?.id_tipo_usuario as number | undefined,
    idDepartamento,
  );

  const { data: pacienteApi, isLoading: loadingPaciente } = useQuery<PacienteDetalleApi & { id_departamento?: number | null }>({
    queryKey: ["patient-edit", id],
    enabled: !!id,
    queryFn: () => getPatientById(String(id)),
  });

  useEffect(() => {
    if (pacienteApi && !form) {
      if (pacienteApi.id_departamento) {
        setIdDepartamento(pacienteApi.id_departamento);
      }
      setForm({
        id_tipo_documento: pacienteApi.id_tipo_documento,
        numero_documento: pacienteApi.numero_documento,
        nombres: pacienteApi.nombres,
        apellidos: pacienteApi.apellidos,
        fecha_nacimiento: pacienteApi.fecha_nacimiento.substring(0, 10),
        telefono: pacienteApi.telefono ?? "",
        email: pacienteApi.email ?? "",
        id_ciudad: pacienteApi.id_ciudad ?? undefined,
        id_genero: pacienteApi.id_genero ?? undefined,
        id_estado_civil: pacienteApi.id_estado_civil ?? undefined,
        direccion: pacienteApi.direccion ?? "",
        id_tipo_sangre: pacienteApi.id_tipo_sangre ?? undefined,
        id_sede: pacienteApi.id_sede ?? undefined,
        id_programa_academico: pacienteApi.id_programa_academico ?? undefined,
        id_eps: pacienteApi.id_eps ?? undefined,
        condicion_particular: pacienteApi.condicion_particular ?? "",
        id_tipo_usuario: pacienteApi.id_tipo_usuario ?? undefined,
      });
    }
  }, [pacienteApi, form]);

  useEffect(() => {
    if (!form?.id_ciudad) return;
    if (idDepartamento !== undefined) return;
    setIdDepartamento(undefined);
  }, [form?.id_ciudad, idDepartamento]);

  useEffect(() => {
    if (toast) {
      const idTimeout = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(idTimeout);
    }
  }, [toast]);

  function handleChange(field: keyof PatientCreateInput, value: string | number) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !id) return;
    setApiError(null);

    const parsed = patientSchema.safeParse({
      ...form,
      id_tipo_documento: Number(form.id_tipo_documento || 0),
      id_genero: Number(form.id_genero || 0),
      id_estado_civil: Number(form.id_estado_civil || 0),
      id_ciudad: Number(form.id_ciudad || 0),
      id_sede: Number(form.id_sede || 0),
      id_programa_academico: Number(form.id_programa_academico || 0),
      id_tipo_usuario: Number(form.id_tipo_usuario || 0),
      id_tipo_sangre: form.id_tipo_sangre ? Number(form.id_tipo_sangre) : undefined,
      id_eps: form.id_eps ? Number(form.id_eps) : undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string" && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await updatePatient(String(id), {
        ...form,
        id_tipo_documento: Number(form.id_tipo_documento),
      });
      setToast({ type: "success", message: "Paciente actualizado correctamente" });
      router.push(`/patients/${id}`);
    } catch (error) {
      console.error(error);
      setApiError("No se pudo actualizar el paciente. Intente de nuevo.");
      setToast({ type: "error", message: "No se pudo actualizar el paciente" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-md px-4 py-2 text-xs shadow-lg ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Editar paciente
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Actualice los datos básicos del paciente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/patients/${id}`)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Volver al detalle
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          {apiError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {apiError}
            </p>
          )}

          {(loadingPaciente || !form) && (
            <p className="text-sm text-slate-500">Cargando datos del paciente...</p>
          )}

          {form && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Tipo de documento */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Tipo de documento <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.id_tipo_documento ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "id_tipo_documento",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                  disabled={loadingTipos}
                >
                  <option value="">Seleccione un tipo de documento</option>
                  {(tiposDocumento ?? []).map((tipo: TipoDocumento) => (
                    <option key={tipo.id_tipo_documento} value={tipo.id_tipo_documento}>
                      {tipo.codigo} - {tipo.descripcion}
                    </option>
                  ))}
                </select>
                {errors.id_tipo_documento && (
                  <span className="text-xs text-red-600">{errors.id_tipo_documento}</span>
                )}
              </div>

              {/* Número de documento */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Número de documento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.numero_documento}
                  onChange={(e) => handleChange("numero_documento", e.target.value)}
                  placeholder="Ej: 1234567890"
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                {errors.numero_documento && (
                  <span className="text-xs text-red-600">{errors.numero_documento}</span>
                )}
              </div>

              {/* Nombres */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Nombres <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nombres}
                  onChange={(e) => handleChange("nombres", e.target.value)}
                  placeholder="Nombres del paciente"
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                {errors.nombres && (
                  <span className="text-xs text-red-600">{errors.nombres}</span>
                )}
              </div>

              {/* Apellidos */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Apellidos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.apellidos}
                  onChange={(e) => handleChange("apellidos", e.target.value)}
                  placeholder="Apellidos del paciente"
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                {errors.apellidos && (
                  <span className="text-xs text-red-600">{errors.apellidos}</span>
                )}
              </div>

              {/* Fecha nacimiento */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Fecha de nacimiento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(e) => handleChange("fecha_nacimiento", e.target.value)}
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                {errors.fecha_nacimiento && (
                  <span className="text-xs text-red-600">{errors.fecha_nacimiento}</span>
                )}
              </div>

              {/* Teléfono */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.telefono ?? ""}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  placeholder="Teléfono de contacto"
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                {errors.telefono && (
                  <span className="text-xs text-red-600">{errors.telefono}</span>
                )}
              </div>

              {/* Departamento */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Departamento <span className="text-red-500">*</span>
                </label>
                <select
                  value={idDepartamento ?? ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? undefined : Number(e.target.value);
                    setIdDepartamento(value);
                    setForm((prev) => (prev ? { ...prev, id_ciudad: undefined } : prev));
                  }}
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Seleccione departamento</option>
                  {(departamentos ?? []).map((dep: Departamento) => (
                    <option key={dep.id_departamento} value={dep.id_departamento}>
                      {dep.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ciudad */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Ciudad <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.id_ciudad ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "id_ciudad",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  disabled={!idDepartamento || !(ciudades ?? []).length}
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">
                    {idDepartamento
                      ? "Seleccione ciudad"
                      : "Seleccione primero el departamento"}
                  </option>
                  {(ciudades ?? []).map((c: Ciudad) => (
                    <option key={c.id_ciudad} value={c.id_ciudad}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                {errors.id_ciudad && (
                  <span className="text-xs text-red-600">{errors.id_ciudad}</span>
                )}
              </div>

              {/* Correo */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Correo electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                {errors.email && (
                  <span className="text-xs text-red-600">{errors.email}</span>
                )}
              </div>

              {/* Tipo de usuario */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Tipo de usuario <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.id_tipo_usuario ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "id_tipo_usuario",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Seleccione tipo de usuario</option>
                  {(tiposUsuario ?? []).map((tu: TipoUsuario) => (
                    <option key={tu.id_tipo_usuario} value={tu.id_tipo_usuario}>
                      {tu.descripcion}
                    </option>
                  ))}
                </select>
                {errors.id_tipo_usuario && (
                  <span className="text-xs text-red-600">{errors.id_tipo_usuario}</span>
                )}
              </div>

              {/* Programa académico / Área */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Programa académico / Área <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.id_programa_academico ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "id_programa_academico",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Seleccione programa / área</option>
                  {(programas ?? []).map((p: ProgramaAcademico) => (
                    <option key={p.id_programa_academico} value={p.id_programa_academico}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                {errors.id_programa_academico && (
                  <span className="text-xs text-red-600">
                    {errors.id_programa_academico}
                  </span>
                )}
              </div>

              {/* Género */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Género <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.id_genero ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "id_genero",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Seleccione género</option>
                  {(generos ?? []).map((g: Genero) => (
                    <option key={g.id_genero} value={g.id_genero}>
                      {g.descripcion}
                    </option>
                  ))}
                </select>
                {errors.id_genero && (
                  <span className="text-xs text-red-600">{errors.id_genero}</span>
                )}
              </div>

              {/* Estado civil */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Estado civil <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.id_estado_civil ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "id_estado_civil",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Seleccione estado civil</option>
                  {(estadosCiviles ?? []).map((ec: EstadoCivil) => (
                    <option key={ec.id_estado_civil} value={ec.id_estado_civil}>
                      {ec.descripcion}
                    </option>
                  ))}
                </select>
                {errors.id_estado_civil && (
                  <span className="text-xs text-red-600">
                    {errors.id_estado_civil}
                  </span>
                )}
              </div>

              {/* Dirección */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Dirección</label>
                <input
                  type="text"
                  value={form.direccion ?? ""}
                  onChange={(e) => handleChange("direccion", e.target.value)}
                  placeholder="Dirección de residencia"
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Tipo de sangre */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Tipo de sangre</label>
                <select
                  value={form.id_tipo_sangre ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "id_tipo_sangre",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Seleccione tipo de sangre</option>
                  {(tiposSangre ?? []).map((ts: TipoSangre) => (
                    <option key={ts.id_tipo_sangre} value={ts.id_tipo_sangre}>
                      {ts.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sede */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Sede <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.id_sede ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "id_sede",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Seleccione sede</option>
                  {(sedes ?? []).map((s: Sede) => (
                    <option key={s.id_sede} value={s.id_sede}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
                {errors.id_sede && (
                  <span className="text-xs text-red-600">{errors.id_sede}</span>
                )}
              </div>

              {/* EPS */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">EPS</label>
                <select
                  value={form.id_eps ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "id_eps",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Seleccione EPS</option>
                  {(eps ?? []).map((eItem: Eps) => (
                    <option key={eItem.id_eps} value={eItem.id_eps}>
                      {eItem.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condición particular */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-600">
                  Condición particular
                </label>
                <textarea
                  value={form.condicion_particular ?? ""}
                  onChange={(e) => handleChange("condicion_particular", e.target.value)}
                  placeholder="Ej: Estudiante en práctica, visitante, otro, observaciones adicionales"
                  className="min-h-[64px] rounded-md border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push(`/patients/${id}`)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
