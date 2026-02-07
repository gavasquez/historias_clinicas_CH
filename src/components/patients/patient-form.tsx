import type { PatientCreateInput } from "@/services/patients";
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

export type PatientFormMode = "create" | "edit";

interface PatientFormProps {
  mode: PatientFormMode;
  form: PatientCreateInput;
  errors: Record<string, string>;
  submitting: boolean;
  apiError: string | null;
  onChange: (field: keyof PatientCreateInput, value: string | number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  // catálogos
  loadingTipos: boolean;
  tiposDocumento?: TipoDocumento[];
  generos?: Genero[];
  estadosCiviles?: EstadoCivil[];
  tiposSangre?: TipoSangre[];
  sedes?: Sede[];
  tiposUsuario?: TipoUsuario[];
  eps?: Eps[];
  programas?: ProgramaAcademico[];
  departamentos?: Departamento[];
  ciudades?: Ciudad[];
  idDepartamento?: number;
  onDepartamentoChange?: (value: number | undefined) => void;
}

export function PatientForm(props: PatientFormProps) {
  const {
    mode,
    form,
    errors,
    submitting,
    apiError,
    onChange,
    onSubmit,
    onCancel,
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
    idDepartamento,
    onDepartamentoChange,
  } = props;

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      {apiError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {apiError}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Tipo de documento */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            Tipo de documento <span className="text-red-500">*</span>
          </label>
          <select
            value={form.id_tipo_documento ?? ""}
            onChange={(e) =>
              onChange(
                "id_tipo_documento",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
            disabled={loadingTipos}
          >
            <option value="">Seleccione un tipo de documento</option>
            {(tiposDocumento ?? []).map((tipo) => (
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
            onChange={(e) => onChange("numero_documento", e.target.value)}
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
            onChange={(e) => onChange("nombres", e.target.value)}
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
            onChange={(e) => onChange("apellidos", e.target.value)}
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
            onChange={(e) => onChange("fecha_nacimiento", e.target.value)}
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
            onChange={(e) => onChange("telefono", e.target.value)}
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
              onDepartamentoChange?.(value);
            }}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Seleccione departamento</option>
            {(departamentos ?? []).map((dep) => (
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
              onChange(
                "id_ciudad",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            disabled={!idDepartamento || !(ciudades ?? []).length}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">
              {idDepartamento ? "Seleccione ciudad" : "Seleccione primero el departamento"}
            </option>
            {(ciudades ?? []).map((c) => (
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
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="correo@ejemplo.com"
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          {errors.email && <span className="text-xs text-red-600">{errors.email}</span>}
        </div>

        {/* Tipo de usuario */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            Tipo de usuario <span className="text-red-500">*</span>
          </label>
          <select
            value={form.id_tipo_usuario ?? ""}
            onChange={(e) =>
              onChange(
                "id_tipo_usuario",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Seleccione tipo de usuario</option>
            {(tiposUsuario ?? []).map((tu) => (
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
              onChange(
                "id_programa_academico",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            disabled={!form.id_tipo_usuario || !programas || programas.length === 0}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">
              {form.id_tipo_usuario
                ? "Seleccione programa / área"
                : "Seleccione primero el tipo de usuario"}
            </option>
            {(programas ?? []).map((p) => (
              <option key={p.id_programa_academico} value={p.id_programa_academico}>
                {p.nombre}
              </option>
            ))}
          </select>
          {errors.id_programa_academico && (
            <span className="text-xs text-red-600">{errors.id_programa_academico}</span>
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
              onChange(
                "id_genero",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Seleccione género</option>
            {(generos ?? []).map((g) => (
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
              onChange(
                "id_estado_civil",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Seleccione estado civil</option>
            {(estadosCiviles ?? []).map((ec) => (
              <option key={ec.id_estado_civil} value={ec.id_estado_civil}>
                {ec.descripcion}
              </option>
            ))}
          </select>
          {errors.id_estado_civil && (
            <span className="text-xs text-red-600">{errors.id_estado_civil}</span>
          )}
        </div>

        {/* Dirección */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Dirección</label>
          <input
            type="text"
            value={form.direccion ?? ""}
            onChange={(e) => onChange("direccion", e.target.value)}
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
              onChange(
                "id_tipo_sangre",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Seleccione tipo de sangre</option>
            {(tiposSangre ?? []).map((ts) => (
              <option key={ts.id_tipo_sangre} value={ts.id_tipo_sangre}>
                {ts.codigo}
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
              onChange(
                "id_sede",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Seleccione sede</option>
            {(sedes ?? []).map((s) => (
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
              onChange(
                "id_eps",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Seleccione EPS</option>
            {(eps ?? []).map((eItem) => (
              <option key={eItem.id_eps} value={eItem.id_eps}>
                {eItem.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Condición particular */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs font-medium text-slate-600">Condición particular</label>
          <textarea
            value={form.condicion_particular ?? ""}
            onChange={(e) => onChange("condicion_particular", e.target.value)}
            placeholder="Ej: Estudiante en práctica, visitante, otro, observaciones adicionales"
            className="min-h-[64px] rounded-md border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase text-slate-500">Contacto de emergencia</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Nombre completo</label>
          <input
            type="text"
            value={form.contacto_emergencia_nombre ?? ""}
            onChange={(e) => onChange("contacto_emergencia_nombre", e.target.value)}
            placeholder="Nombre del contacto"
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Relación con el paciente</label>
          <input
            type="text"
            value={form.contacto_emergencia_relacion ?? ""}
            onChange={(e) => onChange("contacto_emergencia_relacion", e.target.value)}
            placeholder="Ej: Madre, Padre, Tutor"
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Teléfono</label>
          <input
            type="text"
            value={form.contacto_emergencia_telefono ?? ""}
            onChange={(e) => onChange("contacto_emergencia_telefono", e.target.value)}
            placeholder="Teléfono del contacto"
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Dirección</label>
          <input
            type="text"
            value={form.contacto_emergencia_direccion ?? ""}
            onChange={(e) => onChange("contacto_emergencia_direccion", e.target.value)}
            placeholder="Dirección del contacto"
            className="h-8 rounded-md border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Guardando..." : mode === "create" ? "Guardar paciente" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
