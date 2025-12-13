"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createPatient, PatientCreateInput } from "@/services/patients";
import { usePatientCatalogs } from "@/hooks/usePatientCatalogs";
import { patientSchema } from "@/validation/patient";
import { PatientForm } from "@/components/patients/patient-form";
import type {
  TipoDocumento,
  Genero,
  EstadoCivil,
  TipoSangre,
  Sede,
  ProgramaAcademico,
  Eps,
  TipoUsuario,
} from "@/services/catalogs";

export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState<PatientCreateInput>({
    id_tipo_documento: undefined as unknown as number,
    numero_documento: "",
    nombres: "",
    apellidos: "",
    fecha_nacimiento: "",
    telefono: "",
    email: "",
    id_genero: undefined,
    id_estado_civil: undefined,
    direccion: "",
    id_tipo_sangre: undefined,
    id_sede: undefined,
    id_programa_academico: undefined,
    id_eps: undefined,
    condicion_particular: "",
    id_tipo_usuario: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const {
    tiposDocumento,
    loadingTipos,
    generos,
    estadosCiviles,
    tiposSangre,
    sedes,
    tiposUsuario,
    eps,
    programas,
  } = usePatientCatalogs(form.id_tipo_usuario as number | undefined);

  useEffect(() => {
    // Cuando cambie el tipo de usuario, reiniciamos el programa/área seleccionado
    setForm((prev) => ({
      ...prev,
      id_programa_academico: undefined,
    }));
  }, [form.id_tipo_usuario]);

  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(id);
    }
  }, [toast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const parsed = patientSchema.safeParse({
      ...form,
      // Campos requeridos: si no hay selección, mandamos 0 para que falle .positive() con el mensaje personalizado
      id_tipo_documento: Number(form.id_tipo_documento || 0),
      id_genero: Number(form.id_genero || 0),
      id_estado_civil: Number(form.id_estado_civil || 0),
      id_sede: Number(form.id_sede || 0),
      id_programa_academico: Number(form.id_programa_academico || 0),
      id_tipo_usuario: Number(form.id_tipo_usuario || 0),
      // Opcionales numéricos
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
      await createPatient({
        ...form,
        id_tipo_documento: Number(form.id_tipo_documento),
      });
      setToast({ type: "success", message: "Paciente creado correctamente" });
      router.push("/patients");
    } catch (error) {
      console.error(error);
      setApiError("No se pudo crear el paciente. Intente de nuevo.");
      setToast({ type: "error", message: "No se pudo crear el paciente" });
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(
    field: keyof PatientCreateInput,
    value: string | number,
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <AppShell>
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-md px-4 py-2 text-xs shadow-lg ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Nuevo paciente
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Registre los datos básicos del paciente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/patients")}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Volver al listado
          </button>
        </div>

        <PatientForm
          mode="create"
          form={form}
          errors={errors}
          submitting={submitting}
          apiError={apiError}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/patients")}
          loadingTipos={loadingTipos}
          tiposDocumento={tiposDocumento}
          generos={generos}
          estadosCiviles={estadosCiviles}
          tiposSangre={tiposSangre}
          sedes={sedes}
          tiposUsuario={tiposUsuario}
          eps={eps}
          programas={programas}
        />
      </section>
    </AppShell>
  );
}