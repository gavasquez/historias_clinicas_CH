"use client";

import React from "react";
import { AttentionDiagnosesSection, type DiagnosisDraft } from "./AttentionDiagnosesSection";

export function DiagnosticosTab({
  diagnosticosDraft,
  setDiagnosticosDraft,
  form,
  setForm,
  setError,
  setSuccessMessage,
}: {
  diagnosticosDraft: DiagnosisDraft[];
  setDiagnosticosDraft: (next: DiagnosisDraft[] | ((prev: DiagnosisDraft[]) => DiagnosisDraft[])) => void;
  form: any;
  setForm: any;
  setError: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px]">
        <div className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">ANÁLISIS</div>
        <textarea
          value={String(form?.analisis ?? "")}
          onChange={(e) => setForm((prev: any) => ({ ...prev, analisis: e.target.value }))}
          rows={6}
          className="min-h-[140px] w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-[11px] shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          placeholder="Escriba el análisis clínico"
        />
      </div>

      <AttentionDiagnosesSection
        diagnosticosDraft={diagnosticosDraft}
        setDiagnosticosDraft={setDiagnosticosDraft}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
      />
    </div>
  );
}
