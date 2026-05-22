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

export type SimpleAttendTabKey = "NOTA_ATENCION" | "DIAGNOSTICOS";

export function AttendTabs({
  activeTab,
  setActiveTab,
  allowDirectNav = false,
  simpleMode = false,
}: {
  activeTab: AttendTabKey | SimpleAttendTabKey;
  setActiveTab: React.Dispatch<React.SetStateAction<AttendTabKey | SimpleAttendTabKey>>;
  allowDirectNav?: boolean;
  simpleMode?: boolean;
}) {
  const inactiveBaseClasses = allowDirectNav
    ? "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
    : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 opacity-70 cursor-default";

  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {simpleMode ? (
        <>
          <button
            type="button"
            onClick={allowDirectNav ? () => setActiveTab("NOTA_ATENCION") : undefined}
            disabled={!allowDirectNav}
            className={
              activeTab === "NOTA_ATENCION"
                ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
                : inactiveBaseClasses
            }
          >
            Nota de atención
          </button>
          <button
            type="button"
            onClick={allowDirectNav ? () => setActiveTab("DIAGNOSTICOS") : undefined}
            disabled={!allowDirectNav}
            className={
              activeTab === "DIAGNOSTICOS"
                ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
                : inactiveBaseClasses
            }
          >
            Diagnósticos (CIE-10)
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={allowDirectNav ? () => setActiveTab("INGRESO") : undefined}
            disabled={!allowDirectNav}
            className={
              activeTab === "INGRESO"
                ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
                : inactiveBaseClasses
            }
          >
            Ingreso
          </button>
          <button
            type="button"
            onClick={allowDirectNav ? () => setActiveTab("ANAMNESIS") : undefined}
            disabled={!allowDirectNav}
            className={
              activeTab === "ANAMNESIS"
                ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
                : inactiveBaseClasses
            }
          >
            Anamnesis
          </button>
          <button
            type="button"
            onClick={allowDirectNav ? () => setActiveTab("ANTECEDENTES") : undefined}
            disabled={!allowDirectNav}
            className={
              activeTab === "ANTECEDENTES"
                ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
                : inactiveBaseClasses
            }
          >
            Antecedentes
          </button>
          <button
            type="button"
            onClick={allowDirectNav ? () => setActiveTab("REVISION_SISTEMAS") : undefined}
            disabled={!allowDirectNav}
            className={
              activeTab === "REVISION_SISTEMAS"
                ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
                : inactiveBaseClasses
            }
          >
            Revisión por sistemas
          </button>
          <button
            type="button"
            onClick={allowDirectNav ? () => setActiveTab("EXAMEN_FISICO") : undefined}
            disabled={!allowDirectNav}
            className={
              activeTab === "EXAMEN_FISICO"
                ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
                : inactiveBaseClasses
            }
          >
            Examen físico
          </button>
          <button
            type="button"
            onClick={allowDirectNav ? () => setActiveTab("DIAGNOSTICOS") : undefined}
            disabled={!allowDirectNav}
            className={
              activeTab === "DIAGNOSTICOS"
                ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
                : inactiveBaseClasses
            }
          >
            Analisis
          </button>
          <button
            type="button"
            onClick={allowDirectNav ? () => setActiveTab("ATENCION") : undefined}
            disabled={!allowDirectNav}
            className={
              activeTab === "ATENCION"
                ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white"
                : inactiveBaseClasses
            }
          >
            Plan de Manejo
          </button>
        </>
      )}
    </div>
  );
}
