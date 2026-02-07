"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getPatientDetailById } from "@/services/patients";
import { fetchPatientRecords } from "@/services/patient-records";
import { fetchHistoryDetail } from "@/services/histories";
import type { PacienteDetalle } from "@/types/patients";
import type { PatientClinicalRecordsResponse } from "@/types/patient-records";
import type { HistoryDetailResponse } from "@/types/histories";

export default function PatientRecordsPage() {
  const router = useRouter();
  const params = useParams<{ id: string; }>();
  const id = params?.id;

  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [expandedAttentions, setExpandedAttentions] = useState<Record<number, boolean>>({});
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [evolutionNote, setEvolutionNote] = useState("");

  const { data, isLoading, isError } = useQuery<PacienteDetalle | null>( {
    queryKey: [ "patient-records", id ],
    enabled: !!id,
    queryFn: () => getPatientDetailById( String( id ) ),
  } );

  const {
    data: recordsData,
    isLoading: loadingRecords,
    isError: recordsError,
  } = useQuery<PatientClinicalRecordsResponse>( {
    queryKey: [ "patient-clinical-records", id ],
    enabled: !!id,
    queryFn: () => fetchPatientRecords( String( id ) ),
  } );

  const historyDetailEnabled = selectedHistoryId != null;
  const {
    data: historyDetail,
    isLoading: loadingHistoryDetail,
    isError: errorHistoryDetail,
  } = useQuery<HistoryDetailResponse>({
    queryKey: ["history-detail", selectedHistoryId],
    enabled: historyDetailEnabled,
    queryFn: () => fetchHistoryDetail(String(selectedHistoryId)),
  });

  const detailData = useMemo(() => {
    return historyDetail?.data ?? null;
  }, [historyDetail]);

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Historias Clinicas del paciente
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Consulta y gestion de historias Clinicas asociadas al paciente.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={ () => router.push( `/patients/${ id }` ) }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Volver al detalle del paciente
            </button>
            <button
              type="button"
              onClick={ () => router.push( `/patients/${ id }/records/new` ) }
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              Nueva historia clínica
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          { isLoading && <p className="text-sm text-slate-500">Cargando informacion del paciente...</p> }

          { isError && !isLoading && (
            <p className="text-sm text-red-600">
              Ocurrio un error al cargar la informacion del paciente.
            </p>
          ) }

          { !isLoading && !isError && !data && (
            <p className="text-sm text-slate-500">Paciente no encontrado.</p>
          ) }

          { !isLoading && !isError && data && (
            <div className="space-y-4">
              <div className="space-y-1 text-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">Paciente</p>
                <p className="text-sm font-medium text-slate-900">
                  { data.nombres } { data.apellidos }
                </p>
                <p className="text-xs text-slate-600">
                  { data.tipos_documento?.codigo ?? "" } { data.numero_documento }
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Historias clínicas
                </p>
                { loadingRecords && (
                  <p className="text-sm text-slate-500">
                    Cargando historias clínicas...
                  </p>
                ) }

                { recordsError && !loadingRecords && (
                  <p className="text-sm text-red-600">
                    Ocurrió un error al cargar las historias clínicas.
                  </p>
                ) }

                { !loadingRecords && !recordsError && ( recordsData?.data.length ?? 0 ) === 0 && (
                  <p className="text-sm text-slate-500">
                    Aún no hay historias clínicas registradas para este paciente.
                  </p>
                ) }

                { !loadingRecords && !recordsError && ( recordsData?.data.length ?? 0 ) > 0 && (
                  <div className="overflow-x-auto rounded-md border border-slate-200">
                    <table className="min-w-full text-left text-[11px]">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Fecha apertura</th>
                          <th className="px-3 py-2">Tipo</th>
                          <th className="px-3 py-2">Profesional responsable</th>
                          <th className="px-3 py-2">Estado</th>
                          <th className="px-3 py-2">Motivo consulta</th>
                          <th className="px-3 py-2">Atenciones</th>
                          <th className="px-3 py-2">Última atención</th>
                          <th className="px-3 py-2">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                        { recordsData!.data.map( ( h ) => (
                          <tr key={ h.id_historia } className="hover:bg-slate-50">
                            <td className="px-3 py-2">
                              { new Date( h.fecha_apertura ).toLocaleString() }
                            </td>
                            <td className="px-3 py-2">
                              <div className="max-w-[160px] truncate" title={h.tipo_historia}>
                                { h.tipo_historia }
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div
                                className="max-w-[180px] truncate"
                                title={h.profesional_responsable ?? "No registrado"}
                              >
                                { h.profesional_responsable ?? "No registrado" }
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              { h.estado ?? "No registrado" }
                            </td>
                            <td className="px-3 py-2">
                              <div
                                className="max-w-[220px] truncate"
                                title={h.motivo_consulta ?? "Sin motivo registrado"}
                              >
                                { h.motivo_consulta ?? "Sin motivo registrado" }
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              { h.attention_count > 0
                                ? `${ h.attention_count } atención(es)`
                                : "Sin atenciones"
                              }
                            </td>
                            <td className="px-3 py-2">
                              { h.last_attention_fecha_hora
                                ? (
                                  <div className="max-w-[240px] space-y-0.5">
                                    <div>
                                      { new Date( h.last_attention_fecha_hora ).toLocaleString() }
                                    </div>
                                    <div className="text-[10px] text-slate-600">
                                      { h.last_attention_tipo ?? "Tipo no registrado" }
                                      { h.last_attention_modalidad
                                        ? ` · ${ h.last_attention_modalidad }`
                                        : ""
                                      }
                                    </div>
                                    { h.last_attention_principal_cie10_codigo && (
                                      <div className="text-[10px] text-slate-700">
                                        <span className="font-semibold">Dx principal:</span>{" "}
                                        <span className="font-mono">
                                          { h.last_attention_principal_cie10_codigo }
                                        </span>
                                        { h.last_attention_principal_cie10_nombre
                                          ? ` · ${ h.last_attention_principal_cie10_nombre }`
                                          : ""
                                        }
                                      </div>
                                    ) }
                                  </div>
                                )
                                : "Sin atenciones registradas" }
                            </td>

                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedHistoryId(h.id_historia);
                                    setExpandedAttentions({});
                                  }}
                                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                >
                                  Ver detalle
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedHistoryId(h.id_historia);
                                    setEvolutionNote("");
                                    setShowEvolutionModal(true);
                                  }}
                                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                >
                                  Notas evolución
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) ) }
                      </tbody>
                    </table>
                  </div>
                ) }
              </div>
            </div>
          ) }
        </div>

        {selectedHistoryId != null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Detalle de historia clínica</h2>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Historia #{selectedHistoryId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEvolutionNote("");
                      setShowEvolutionModal(true);
                    }}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Notas de evolución
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEvolutionModal(false);
                      setSelectedHistoryId(null);
                    }}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(90vh-60px)] overflow-auto p-4">
                {loadingHistoryDetail && (
                  <p className="text-xs text-slate-500">Cargando detalle...</p>
                )}

                {errorHistoryDetail && !loadingHistoryDetail && (
                  <p className="text-xs text-red-600">Ocurrió un error cargando el detalle.</p>
                )}

                {!loadingHistoryDetail && !errorHistoryDetail && detailData && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-500">Tipo</p>
                          <p className="text-xs text-slate-800">
                            {detailData.tipos_historia_clinica?.descripcion ?? "Sin tipo"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-500">Estado</p>
                          <p className="text-xs text-slate-800">{detailData.estado ?? "Sin estado"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-500">Fecha apertura</p>
                          <p className="text-xs text-slate-800">
                            {detailData.fecha_apertura
                              ? new Date(detailData.fecha_apertura).toLocaleString()
                              : "Sin fecha"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-500">Profesional</p>
                          <p className="text-xs text-slate-800">
                            {detailData.profesionales_salud?.usuarios?.nombre_completo ?? "No registrado"}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-[10px] font-semibold uppercase text-slate-500">Motivo consulta</p>
                          <p className="text-xs text-slate-800">
                            {detailData.motivo_consulta ?? "Sin motivo"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-800">Atenciones</p>

                      {(detailData.atenciones_salud?.length ?? 0) === 0 && (
                        <p className="text-xs text-slate-500">Esta historia no tiene atenciones registradas.</p>
                      )}

                      {(detailData.atenciones_salud ?? []).map((a: any) => {
                        const isExpanded = expandedAttentions[a.id_atencion] === true;
                        const dxPrincipal = (a.diagnosticos_atencion ?? []).find((d: any) => d.es_principal);
                        return (
                          <div key={a.id_atencion} className="rounded-lg border border-slate-200">
                            <div className="flex items-start justify-between gap-3 p-3">
                              <div className="space-y-0.5">
                                <p className="text-xs font-semibold text-slate-900">
                                  Atención #{a.id_atencion}
                                </p>
                                <p className="text-[11px] text-slate-600">
                                  {a.fecha_hora ? new Date(a.fecha_hora).toLocaleString() : "Sin fecha"}
                                  {a.tipos_atencion?.descripcion ? ` · ${a.tipos_atencion.descripcion}` : ""}
                                  {a.modalidades_atencion?.descripcion
                                    ? ` · ${a.modalidades_atencion.descripcion}`
                                    : ""}
                                </p>
                                {dxPrincipal?.codigo_cie10 && (
                                  <p className="text-[11px] text-slate-700">
                                    <span className="font-semibold">Dx principal:</span>{" "}
                                    <span className="font-mono">{dxPrincipal.codigo_cie10}</span>
                                    {dxPrincipal.cie10?.nombre ? ` · ${dxPrincipal.cie10.nombre}` : ""}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedAttentions((prev) => ({
                                    ...prev,
                                    [a.id_atencion]: !isExpanded,
                                  }))
                                }
                                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                              >
                                {isExpanded ? "Ocultar" : "Ver"}
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="space-y-3 border-t border-slate-200 p-3 text-[11px] text-slate-700">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-slate-500">Ingreso</p>
                                  <p>
                                    <span className="font-semibold">Llega por sus medios:</span>{" "}
                                    {a.llega_por_sus_medios === true
                                      ? "Sí"
                                      : a.llega_por_sus_medios === false
                                        ? "No"
                                        : "Sin dato"}
                                    {a.llega_por_sus_medios === false && a.llega_por_sus_medios_cual
                                      ? ` · ${a.llega_por_sus_medios_cual}`
                                      : ""}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Estado a la llegada:</span>{" "}
                                    {a.estado_a_la_llegada ?? "Sin dato"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-slate-500">Anamnesis</p>
                                  <p>
                                    <span className="font-semibold">Motivo:</span>{" "}
                                    {a.hc_anamnesis_atencion?.motivo_consulta ?? "Sin dato"}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Enfermedad actual:</span>{" "}
                                    {a.hc_anamnesis_atencion?.enfermedad_actual ?? "Sin dato"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-slate-500">Cierre</p>
                                  <p>
                                    {a.hc_atencion_cierre?.recomendaciones ?? "Sin recomendaciones"}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedHistoryId != null && showEvolutionModal && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Nota de evolución</h3>
                  <p className="mt-0.5 text-xs text-slate-600">Historia #{selectedHistoryId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEvolutionModal(false)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cerrar
                </button>
              </div>

              <div className="space-y-3 p-4">
                <textarea
                  value={evolutionNote}
                  onChange={(e) => setEvolutionNote(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Escriba aquí la nota de evolución..."
                />

                <p className="text-[11px] text-slate-500">
                  Esta funcionalidad está lista en interfaz. Falta habilitar el guardado en base de datos.
                </p>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEvolutionModal(false)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-md bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
