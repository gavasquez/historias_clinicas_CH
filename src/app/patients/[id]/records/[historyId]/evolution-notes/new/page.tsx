"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { fetchModalidadesAtencion, fetchTiposAtencion } from "@/services/catalogs";
import { apiClient } from "@/lib/api";
import {
  AttentionDiagnosesSection,
  type DiagnosisDraft,
} from "@/app/appointments/[id]/attend/components/AttentionDiagnosesSection";

export default function NewEvolutionNotePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string; historyId: string }>();

  const patientId = params?.id;
  const historyId = params?.historyId;
  const historyIdNum = Number(historyId);

  const [form, setForm] = useState({
    id_tipo_atencion: "",
    id_modalidad_atencion: "",
    nota_atencion: "",
    analisis: "",
    plan_manejo: "",
  });

  const [diagnosticosDraft, setDiagnosticosDraft] = useState<DiagnosisDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: tiposAtencionData } = useQuery({
    queryKey: ["catalog-attention-types"],
    queryFn: () => fetchTiposAtencion(),
  });

  const { data: modalidadesAtencionData } = useQuery({
    queryKey: ["catalog-attention-modalities"],
    queryFn: () => fetchModalidadesAtencion(),
  });

  const canSubmit = useMemo(() => {
    const notaOk = form.nota_atencion.trim().length > 0;
    const analisisOk = form.analisis.trim().length > 0;
    const planOk = form.plan_manejo.trim().length > 0;
    const dxOk = diagnosticosDraft.length > 0;
    return notaOk && analisisOk && planOk && dxOk;
  }, [diagnosticosDraft.length, form.analisis, form.nota_atencion, form.plan_manejo]);

  const createMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      setSuccessMessage(null);

      if (!Number.isInteger(historyIdNum) || historyIdNum <= 0) {
        throw new Error("Historia inválida");
      }

      const payload = {
        id_tipo_atencion: form.id_tipo_atencion || null,
        id_modalidad_atencion: form.id_modalidad_atencion || null,
        nota_atencion: form.nota_atencion,
        analisis: form.analisis,
        plan_manejo: form.plan_manejo,
        diagnosticos: diagnosticosDraft.map((d) => ({
          codigo_cie10: d.codigo_cie10,
          es_principal: d.es_principal,
        })),
      };

      return apiClient.post(`/histories/${historyIdNum}/evolution-notes`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["history-evolution-notes", historyIdNum] });
      await queryClient.invalidateQueries({ queryKey: ["history-detail", historyIdNum] });
      router.push(`/patients/${patientId}/records/${historyId}/evolution-notes`);
    },
    onError: (err: any) => {
      const backendMessage = err?.response?.data?.message;
      setError(
        typeof backendMessage === "string" && backendMessage.trim().length > 0
          ? backendMessage
          : err?.message || "No se pudo crear la nota de evolución.",
      );
    },
  });

  return (
    <AppShell>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Nueva nota de evolución</h1>
            <p className="mt-1 text-sm text-slate-600">Historia #{historyId}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/patients/${patientId}/records/${historyId}/evolution-notes`)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Volver
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {error && (
            <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
          {successMessage && (
            <p className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {successMessage}
            </p>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-500">Fecha de atención</p>
              <p className="text-xs text-slate-800">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-500">Hora</p>
              <p className="text-xs text-slate-800">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-700">Tipo de atención</label>
              <select
                value={form.id_tipo_atencion}
                onChange={(e) => setForm((p) => ({ ...p, id_tipo_atencion: e.target.value }))}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
              >
                <option value="">Seleccione...</option>
                {(tiposAtencionData as any[] | undefined)?.map((t: any) => (
                  <option key={t.id_tipo_atencion} value={String(t.id_tipo_atencion)}>
                    {t.descripcion}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700">Modalidad de atención</label>
              <select
                value={form.id_modalidad_atencion}
                onChange={(e) => setForm((p) => ({ ...p, id_modalidad_atencion: e.target.value }))}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs shadow-sm"
              >
                <option value="">Seleccione...</option>
                {(modalidadesAtencionData as any[] | undefined)?.map((m: any) => (
                  <option key={m.id_modalidad_atencion} value={String(m.id_modalidad_atencion)}>
                    {m.descripcion}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-[11px] font-semibold text-slate-700">Nota de Atención</label>
            <textarea
              value={form.nota_atencion}
              onChange={(e) => setForm((p) => ({ ...p, nota_atencion: e.target.value }))}
              rows={5}
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Escriba aquí la nota de atención..."
            />
          </div>

          <div className="mt-4">
            <label className="text-[11px] font-semibold text-slate-700">Observación / Análisis</label>
            <textarea
              value={form.analisis}
              onChange={(e) => setForm((p) => ({ ...p, analisis: e.target.value }))}
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Observación / análisis"
            />
          </div>

          <div className="mt-4">
            <AttentionDiagnosesSection
              attentionId={null}
              diagnosticosDraft={diagnosticosDraft}
              setDiagnosticosDraft={setDiagnosticosDraft}
              form={form}
              setForm={setForm}
              setError={setError}
              setSuccessMessage={setSuccessMessage}
            />
          </div>

          <div className="mt-4">
            <label className="text-[11px] font-semibold text-slate-700">Plan de manejo</label>
            <textarea
              value={form.plan_manejo}
              onChange={(e) => setForm((p) => ({ ...p, plan_manejo: e.target.value }))}
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Plan de manejo"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push(`/patients/${patientId}/records/${historyId}/evolution-notes`)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={!canSubmit || createMutation.isPending}
              className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
