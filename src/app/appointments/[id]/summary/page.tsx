"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getAppointmentById, type AppointmentDetail } from "@/services/appointments";
import { fetchAttentionDiagnoses, type AttentionDiagnosis } from "@/services/attentions";

export default function AppointmentSummaryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data: citaData, isLoading: loadingCita, isError: errorCita } = useQuery<AppointmentDetail>(
    {
      queryKey: ["appointment-summary", id],
      enabled: !!id,
      queryFn: () => getAppointmentById(String(id)),
    },
  );

  const { data: diagnosesData, isLoading: loadingDiagnoses } = useQuery<AttentionDiagnosis[]>(
    {
      queryKey: ["appointment-summary-diagnoses", citaData?.ultima_atencion?.id_atencion],
      enabled: !!citaData?.ultima_atencion?.id_atencion,
      queryFn: () =>
        citaData?.ultima_atencion?.id_atencion
          ? fetchAttentionDiagnoses(citaData.ultima_atencion.id_atencion)
          : Promise.resolve([]),
    },
  );

  if (loadingCita || !citaData) {
    return (
      <AppShell>
        <section className="space-y-4">
          <p className="text-sm text-slate-500">Cargando resumen clínico de la cita...</p>
        </section>
      </AppShell>
    );
  }

  if (errorCita || !citaData) {
    return (
      <AppShell>
        <section className="space-y-4">
          <p className="text-sm text-red-600">No se pudo cargar la información de la cita.</p>
        </section>
      </AppShell>
    );
  }

  const fechaHora = new Date(citaData.fecha_hora_inicio).toLocaleString();

  return (
    <AppShell>
      <section className="space-y-4 bg-white p-4 text-xs text-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Resumen clínico de la cita
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Vista de solo lectura para impresión o revisión rápida.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Imprimir
            </button>
            <button
              type="button"
              onClick={() => router.push(`/appointments/${citaData.id_cita}/edit`)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Volver a la cita
            </button>
          </div>
        </div>

        <div className="space-y-1 rounded-md border border-slate-200 p-3">
          <p>
            <span className="font-semibold">Cita:</span> #{citaData.id_cita}
          </p>
          <p>
            <span className="font-semibold">Fecha y hora:</span> {fechaHora}
          </p>
        </div>

        {citaData.ultima_atencion ? (
          <>
            <div className="space-y-1 rounded-md border border-slate-200 p-3">
              <p className="font-semibold text-slate-900">Atención registrada</p>
              <p>
                <span className="font-semibold">Tipo de atención:</span>{" "}
                {citaData.ultima_atencion.descripcion_tipo_atencion ?? "Sin información"}
              </p>
              {citaData.ultima_atencion.descripcion_modalidad_atencion && (
                <p>
                  <span className="font-semibold">Modalidad:</span>{" "}
                  {citaData.ultima_atencion.descripcion_modalidad_atencion}
                </p>
              )}
            </div>

            <div className="space-y-1 rounded-md border border-slate-200 p-3">
              <p className="font-semibold text-slate-900">Diagnósticos CIE-10</p>
              {loadingDiagnoses ? (
                <p className="text-xs text-slate-500">Cargando diagnósticos...</p>
              ) : !diagnosesData || diagnosesData.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No hay diagnósticos registrados para esta atención.
                </p>
              ) : (
                <table className="mt-1 min-w-full border-collapse text-left text-[11px]">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-2 py-1.5">Principal</th>
                      <th className="px-2 py-1.5">Código</th>
                      <th className="px-2 py-1.5">Nombre</th>
                      <th className="px-2 py-1.5">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {diagnosesData.map((d) => (
                      <tr key={d.id_diagnostico}>
                        <td className="px-2 py-1.5">
                          {d.es_principal ? "Sí" : "No"}
                        </td>
                        <td className="px-2 py-1.5 font-mono text-[11px]">{d.codigo_cie10}</td>
                        <td className="px-2 py-1.5">{d.cie10_nombre}</td>
                        <td className="px-2 py-1.5 text-slate-600">{d.cie10_descripcion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            No hay atención registrada para esta cita.
          </div>
        )}
      </section>
    </AppShell>
  );
}
