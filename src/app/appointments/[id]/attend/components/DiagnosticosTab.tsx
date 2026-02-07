"use client";

import React from "react";
import { AttentionDiagnosesSection, type DiagnosisDraft } from "./AttentionDiagnosesSection";

export function DiagnosticosTab({
  attentionId,
  diagnosticosDraft,
  setDiagnosticosDraft,
  setError,
  setSuccessMessage,
}: {
  attentionId: number | null;
  diagnosticosDraft: DiagnosisDraft[];
  setDiagnosticosDraft: (next: DiagnosisDraft[] | ((prev: DiagnosisDraft[]) => DiagnosisDraft[])) => void;
  setError: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
}) {
  return (
    <AttentionDiagnosesSection
      attentionId={attentionId}
      diagnosticosDraft={diagnosticosDraft}
      setDiagnosticosDraft={setDiagnosticosDraft}
      setError={setError}
      setSuccessMessage={setSuccessMessage}
    />
  );
}
