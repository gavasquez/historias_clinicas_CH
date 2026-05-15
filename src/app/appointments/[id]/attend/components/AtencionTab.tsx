"use client";

import React from "react";

export function AtencionTab({
  form,
  setForm,
}: {
  form: any;
  setForm: any;
}) {
  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
          CONDUCTA, PLAN DE ESTUDIO Y MANEJO
        </div>
        <textarea
          value={form.conducta_plan_estudio_manejo}
          onChange={(e) =>
            setForm((prev: any) => ({ ...prev, conducta_plan_estudio_manejo: e.target.value }))
          }
          rows={8}
          className="min-h-[180px] w-full rounded-md border border-slate-300 px-2 py-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          placeholder="Conducta, plan de estudio y manejo"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">RECOMENDACIONES</div>
        <textarea
          value={form.atencion_recomendaciones}
          onChange={(e) =>
            setForm((prev: any) => ({ ...prev, atencion_recomendaciones: e.target.value }))
          }
          rows={8}
          className="min-h-[180px] w-full rounded-md border border-slate-300 px-2 py-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          placeholder="Recomendaciones"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">CERTIFICADO MÉDICO</div>

        <div className="space-y-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-600">¿Requiere certificado médico?</p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-700">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="certificado_emitido"
                  checked={form.certificado_emitido === "SI"}
                  onChange={() =>
                    setForm((prev: any) => ({
                      ...prev,
                      certificado_emitido: "SI",
                    }))
                  }
                  className="h-3 w-3"
                />
                <span>Sí</span>
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="certificado_emitido"
                  checked={form.certificado_emitido === "NO"}
                  onChange={() =>
                    setForm((prev: any) => ({
                      ...prev,
                      certificado_emitido: "NO",
                      certificado_opcion: "",
                    }))
                  }
                  className="h-3 w-3"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {form.certificado_emitido === "SI" && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600">Tipo de certificado</p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-700">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="certificado_opcion"
                    checked={form.certificado_opcion === "CON_RESTRICCIONES"}
                    onChange={() =>
                      setForm((prev: any) => ({ ...prev, certificado_opcion: "CON_RESTRICCIONES" }))
                    }
                    className="h-3 w-3"
                  />
                  <span>Con restricciones</span>
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="certificado_opcion"
                    checked={form.certificado_opcion === "CON_RECOMENDACIONES"}
                    onChange={() =>
                      setForm((prev: any) => ({ ...prev, certificado_opcion: "CON_RECOMENDACIONES" }))
                    }
                    className="h-3 w-3"
                  />
                  <span>Con recomendaciones</span>
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="certificado_opcion"
                    checked={form.certificado_opcion === "SIN_RESTRICCIONES"}
                    onChange={() =>
                      setForm((prev: any) => ({ ...prev, certificado_opcion: "SIN_RESTRICCIONES" }))
                    }
                    className="h-3 w-3"
                  />
                  <span>Sin restricciones ni recomendaciones específicas</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 mt-2">
          <label className="text-xs font-medium text-slate-600">Observaciones</label>
          <textarea
            value={form.certificado_recomendaciones}
            onChange={(e) =>
              setForm((prev: any) => ({ ...prev, certificado_recomendaciones: e.target.value }))
            }
            rows={4}
            className="min-h-[96px] rounded-md border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Observaciones"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">NOTIFICACIÓN</div>

        <div className="space-y-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-600">¿Requiere notificación?</p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-700">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="notificacion_emitida"
                  checked={form.notificacion_emitida === "SI"}
                  onChange={() =>
                    setForm((prev: any) => ({
                      ...prev,
                      notificacion_emitida: "SI",
                    }))
                  }
                  className="h-3 w-3"
                />
                <span>Sí</span>
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="notificacion_emitida"
                  checked={form.notificacion_emitida === "NO"}
                  onChange={() =>
                    setForm((prev: any) => ({
                      ...prev,
                      notificacion_emitida: "NO",
                      seguimiento_notificacion: "",
                      notificacion_observaciones: "",
                    }))
                  }
                  className="h-3 w-3"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {form.notificacion_emitida === "SI" && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600">Seleccione una opción</p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-700">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="seguimiento_notificacion"
                    checked={form.seguimiento_notificacion === "RUTA_EXTERNA"}
                    onChange={() =>
                      setForm((prev: any) => ({
                        ...prev,
                        seguimiento_notificacion: "RUTA_EXTERNA",
                      }))
                    }
                    className="h-3 w-3"
                  />
                  <span>Ruta externa</span>
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="seguimiento_notificacion"
                    checked={form.seguimiento_notificacion === "RUTA_INTERNA"}
                    onChange={() =>
                      setForm((prev: any) => ({
                        ...prev,
                        seguimiento_notificacion: "RUTA_INTERNA",
                      }))
                    }
                    className="h-3 w-3"
                  />
                  <span>Ruta interna</span>
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="seguimiento_notificacion"
                    checked={form.seguimiento_notificacion === "ACUDIENTE"}
                    onChange={() =>
                      setForm((prev: any) => ({
                        ...prev,
                        seguimiento_notificacion: "ACUDIENTE",
                      }))
                    }
                    className="h-3 w-3"
                  />
                  <span>Acudiente</span>
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="seguimiento_notificacion"
                    checked={form.seguimiento_notificacion === "NO_APLICA"}
                    onChange={() =>
                      setForm((prev: any) => ({
                        ...prev,
                        seguimiento_notificacion: "NO_APLICA",
                      }))
                    }
                    className="h-3 w-3"
                  />
                  <span>No aplica</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 mt-2">
            <label className="text-xs font-medium text-slate-600">Observaciones</label>
            <textarea
              value={form.notificacion_observaciones}
              onChange={(e) =>
                setForm((prev: any) => ({ ...prev, notificacion_observaciones: e.target.value }))
              }
              rows={3}
              className="min-h-[80px] rounded-md border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Observaciones"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">SEGUIMIENTO</div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Tipo de seguimiento</label>
            <select
              value={form.seguimiento_opcion}
              onChange={(e) => {
                const next = e.target.value;
                setForm((prev: any) => ({
                  ...prev,
                  seguimiento_opcion: next,
                  seguimiento_efectivo:
                    next === "CONDICIONES_CRONICAS" || next === "SITUACION_EN_SALUD"
                      ? prev.seguimiento_efectivo
                      : "",
                  cierre_seguimiento:
                    next === "CONDICIONES_CRONICAS" || next === "SITUACION_EN_SALUD"
                      ? prev.cierre_seguimiento
                      : "",
                }));
              }}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 shadow-sm"
            >
              <option value="">Seleccione...</option>
              <option value="CONDICIONES_CRONICAS">CONDICIONES CRÓNICAS</option>
              <option value="SITUACION_EN_SALUD">SITUACIÓN EN SALUD</option>
              <option value="NO_APLICA">NO APLICA</option>
            </select>
          </div>

          {(form.seguimiento_opcion === "CONDICIONES_CRONICAS" ||
            form.seguimiento_opcion === "SITUACION_EN_SALUD") && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Seguimiento efectivo</label>
                <div className="flex flex-wrap gap-4 text-xs text-slate-700">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="seguimiento_efectivo"
                      checked={form.seguimiento_efectivo === "SI"}
                      onChange={() =>
                        setForm((prev: any) => ({
                          ...prev,
                          seguimiento_efectivo: "SI",
                        }))
                      }
                      className="h-3 w-3"
                    />
                    <span>Sí</span>
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="seguimiento_efectivo"
                      checked={form.seguimiento_efectivo === "NO"}
                      onChange={() =>
                        setForm((prev: any) => ({
                          ...prev,
                          seguimiento_efectivo: "NO",
                        }))
                      }
                      className="h-3 w-3"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Cierre seguimiento</label>
                <div className="flex flex-wrap gap-4 text-xs text-slate-700">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="cierre_seguimiento"
                      checked={form.cierre_seguimiento === "SI"}
                      onChange={() =>
                        setForm((prev: any) => ({
                          ...prev,
                          cierre_seguimiento: "SI",
                        }))
                      }
                      className="h-3 w-3"
                    />
                    <span>Sí</span>
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="cierre_seguimiento"
                      checked={form.cierre_seguimiento === "NO"}
                      onChange={() =>
                        setForm((prev: any) => ({
                          ...prev,
                          cierre_seguimiento: "NO",
                        }))
                      }
                      className="h-3 w-3"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Fecha</label>
            <input
              type="date"
              value={form.seguimiento_fecha}
              onChange={(e) => setForm((prev: any) => ({ ...prev, seguimiento_fecha: e.target.value }))}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
          CASO DE ACCIDENTE, INTOXICACIÓN O VIOLENCIA
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-600">Caso de accidente, intoxicación o violencia</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-700">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="caso_aiv"
                checked={form.caso_accidente_intoxicacion_violencia === "SI"}
                onChange={() =>
                  setForm((prev: any) => ({
                    ...prev,
                    caso_accidente_intoxicacion_violencia: "SI",
                  }))
                }
                className="h-3 w-3"
              />
              <span>Sí</span>
            </label>

            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="caso_aiv"
                checked={form.caso_accidente_intoxicacion_violencia === "NO"}
                onChange={() =>
                  setForm((prev: any) => ({
                    ...prev,
                    caso_accidente_intoxicacion_violencia: "NO",
                    fecha_ocurrencia_evento: "",
                    lugar_ocurrencia_evento: "",
                    notificacion_otro_cual: "",
                  }))
                }
                className="h-3 w-3"
              />
              <span>No</span>
            </label>
          </div>
        </div>

        {form.caso_accidente_intoxicacion_violencia === "SI" && (
          <div className="mt-3 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Fecha ocurrencia</label>
                <input
                  type="date"
                  value={form.fecha_ocurrencia_evento}
                  onChange={(e) =>
                    setForm((prev: any) => ({
                      ...prev,
                      fecha_ocurrencia_evento: e.target.value,
                    }))
                  }
                  className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Lugar</label>
                <input
                  type="text"
                  value={form.lugar_ocurrencia_evento}
                  onChange={(e) =>
                    setForm((prev: any) => ({
                      ...prev,
                      lugar_ocurrencia_evento: e.target.value,
                    }))
                  }
                  className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Lugar de ocurrencia"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Observación</label>
              <textarea
                value={form.notificacion_otro_cual}
                onChange={(e) =>
                  setForm((prev: any) => ({
                    ...prev,
                    notificacion_otro_cual: e.target.value,
                  }))
                }
                rows={3}
                className="min-h-[80px] rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Observación"
              ></textarea>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
