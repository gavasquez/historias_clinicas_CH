"use client";

import React from "react";

export type AttendTabKey =
  | "INGRESO"
  | "ANAMNESIS"
  | "ANTECEDENTES"
  | "EXAMEN_FISICO"
  | "REVISION_SISTEMAS"
  | "DIAGNOSTICOS"
  | "ATENCION";

export function AttendTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: AttendTabKey;
  setActiveTab: React.Dispatch<React.SetStateAction<AttendTabKey>>;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      <button
        type="button"
        onClick={() => setActiveTab("INGRESO")}
        className={
          activeTab === "INGRESO"
            ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        }
      >
        Ingreso
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("ANAMNESIS")}
        className={
          activeTab === "ANAMNESIS"
            ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        }
      >
        Anamnesis
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("ANTECEDENTES")}
        className={
          activeTab === "ANTECEDENTES"
            ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        }
      >
        Antecedentes
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("REVISION_SISTEMAS")}
        className={
          activeTab === "REVISION_SISTEMAS"
            ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        }
      >
        Revisión por sistemas
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("EXAMEN_FISICO")}
        className={
          activeTab === "EXAMEN_FISICO"
            ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        }
      >
        Examen físico
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("DIAGNOSTICOS")}
        className={
          activeTab === "DIAGNOSTICOS"
            ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        }
      >
        Diagnósticos (CIE-10)
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("ATENCION")}
        className={
          activeTab === "ATENCION"
            ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        }
      >
        Plan de Manejo
      </button>
    </div>
  );
}
