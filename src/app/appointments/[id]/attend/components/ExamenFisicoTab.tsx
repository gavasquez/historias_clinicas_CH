"use client";

import React from "react";

type ExamenFisicoEstado = "NA" | "N" | "A" | "";

type ExamenFisicoItem = {
  cod: number;
  area: string;
  subarea: string;
  estado: ExamenFisicoEstado;
};

type ExamenFisicoVitals = {
  estatura_cm: string;
  peso_kg: string;
  imc: string;
  fc: string;
  fr: string;
  temp_c: string;
  glasgow: string;
  ta_sentado: string;
  ta_acostado: string;
  sat_o2: string;
  otros: string;
};

type ExamenFisicoContenido = {
  vitals: ExamenFisicoVitals;
  valoracion: ExamenFisicoItem[];
  observaciones: string;
};

const DEFAULT_CONTENIDO: ExamenFisicoContenido = {
  vitals: {
    estatura_cm: "",
    peso_kg: "",
    imc: "",
    fc: "",
    fr: "",
    temp_c: "",
    glasgow: "15",
    ta_sentado: "",
    ta_acostado: "",
    sat_o2: "",
    otros: "",
  },
  valoracion: [
    { cod: 1, area: "CABEZA", subarea: "CRÁNEO", estado: "" },
    { cod: 1, area: "CABEZA", subarea: "CARA", estado: "" },

    { cod: 2, area: "OJOS", subarea: "ANATOMÍA", estado: "" },
    { cod: 2, area: "OJOS", subarea: "FUNCIONALIDAD", estado: "" },
    { cod: 2, area: "OJOS", subarea: "AGUDEZA VISUAL", estado: "" },

    { cod: 3, area: "O.R.L.", subarea: "", estado: "" },

    { cod: 4, area: "OÍDOS", subarea: "ANATOMÍA", estado: "" },
    { cod: 4, area: "OÍDOS", subarea: "FUNCIONALIDAD", estado: "" },
    { cod: 4, area: "OÍDOS", subarea: "AGUDEZA AUDITIVA", estado: "" },

    { cod: 5, area: "NARIZ", subarea: "ANATOMÍA", estado: "" },
    { cod: 5, area: "NARIZ", subarea: "FUNCIONALIDAD", estado: "" },

    { cod: 6, area: "BOCA", subarea: "ANATOMÍA", estado: "" },
    { cod: 6, area: "BOCA", subarea: "FUNCIONALIDAD", estado: "" },

    { cod: 7, area: "CUELLO", subarea: "ANATOMÍA", estado: "" },
    { cod: 7, area: "CUELLO", subarea: "FUNCIONALIDAD", estado: "" },

    { cod: 8, area: "TÓRAX", subarea: "PULMONES", estado: "" },
    { cod: 8, area: "TÓRAX", subarea: "CORAZÓN", estado: "" },
    { cod: 8, area: "TÓRAX", subarea: "MAMAS", estado: "" },

    { cod: 9, area: "GASTROINTESTINAL", subarea: "", estado: "" },

    { cod: 10, area: "GENITO URINARIO", subarea: "EXTERNOS", estado: "" },
    { cod: 10, area: "GENITO URINARIO", subarea: "INTERNOS", estado: "" },

    { cod: 11, area: "OSTEO MUSCULAR Y ARTICULAR", subarea: "CABEZA Y CUELLO", estado: "" },
    { cod: 11, area: "OSTEO MUSCULAR Y ARTICULAR", subarea: "TÓRAX", estado: "" },
    { cod: 11, area: "OSTEO MUSCULAR Y ARTICULAR", subarea: "ABDOMEN", estado: "" },
    { cod: 11, area: "OSTEO MUSCULAR Y ARTICULAR", subarea: "COLUMNA VERTEBRAL", estado: "" },
    { cod: 11, area: "OSTEO MUSCULAR Y ARTICULAR", subarea: "EXTREMIDADES SUPERIORES", estado: "" },
    { cod: 11, area: "OSTEO MUSCULAR Y ARTICULAR", subarea: "EXTREMIDADES INFERIORES", estado: "" },

    { cod: 12, area: "VASCULAR", subarea: "", estado: "" },
    { cod: 13, area: "NEUROLÓGICO", subarea: "", estado: "" },
    { cod: 14, area: "PIEL Y ANEXOS", subarea: "", estado: "" },
  ],
  observaciones: "",
};

function safeParseContenido(raw: unknown): ExamenFisicoContenido | null {
  if (!raw || typeof raw !== "object") return null;
  const obj: any = raw;
  const vitals = obj?.vitals && typeof obj.vitals === "object" ? obj.vitals : null;
  const valoracion = Array.isArray(obj?.valoracion) ? obj.valoracion : null;
  const observaciones = typeof obj?.observaciones === "string" ? obj.observaciones : "";

  if (!vitals || !valoracion) return null;

  const next: ExamenFisicoContenido = {
    vitals: {
      estatura_cm: String(vitals.estatura_cm ?? ""),
      peso_kg: String(vitals.peso_kg ?? ""),
      imc: String(vitals.imc ?? ""),
      fc: String(vitals.fc ?? ""),
      fr: String(vitals.fr ?? ""),
      temp_c: String(vitals.temp_c ?? ""),
      glasgow: String(vitals.glasgow ?? "15"),
      ta_sentado: String(vitals.ta_sentado ?? ""),
      ta_acostado: String(vitals.ta_acostado ?? ""),
      sat_o2: String(vitals.sat_o2 ?? ""),
      otros: String(vitals.otros ?? ""),
    },
    valoracion: (valoracion as any[])
      .filter(Boolean)
      .map((r: any) => ({
        cod: Number(r.cod) || 0,
        area: String(r.area ?? ""),
        subarea: String(r.subarea ?? ""),
        estado: (String(r.estado ?? "") as ExamenFisicoEstado) || "",
      })),
    observaciones,
  };

  return next;
}

export function ExamenFisicoTab({
  form,
  setForm,
}: {
  form: any;
  setForm: any;
}) {
  const [contenido, setContenido] = React.useState<ExamenFisicoContenido>(DEFAULT_CONTENIDO);

  React.useEffect(() => {
    const raw = form?.hc_examen_fisico_contenido;
    if (!raw || typeof raw !== "string") {
      setContenido(DEFAULT_CONTENIDO);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const normalized = safeParseContenido(parsed);
      setContenido(normalized ?? DEFAULT_CONTENIDO);
    } catch {
      setContenido(DEFAULT_CONTENIDO);
    }
  }, [form?.hc_examen_fisico_contenido]);

  const persist = React.useCallback(
    (next: ExamenFisicoContenido) => {
      setContenido(next);
      setForm((prev: any) => ({ ...prev, hc_examen_fisico_contenido: JSON.stringify(next) }));
    },
    [setForm],
  );

  const setVital = (key: keyof ExamenFisicoVitals, value: string) => {
    persist({
      ...contenido,
      vitals: {
        ...contenido.vitals,
        [key]: value,
      },
    });
  };

  const setValoracionEstado = (index: number, estado: ExamenFisicoEstado) => {
    const nextRows = contenido.valoracion.map((r, i) => (i === index ? { ...r, estado } : r));
    persist({ ...contenido, valoracion: nextRows });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
          EXAMEN FÍSICO
        </div>

        <div className="grid gap-3 md:grid-cols-6">
          <div>
            <label className="text-[11px] font-medium text-slate-600">Estatura (cm)</label>
            <input
              type="text"
              value={contenido.vitals.estatura_cm}
              onChange={(e) => setVital("estatura_cm", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">Peso (kg)</label>
            <input
              type="text"
              value={contenido.vitals.peso_kg}
              onChange={(e) => setVital("peso_kg", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">IMC</label>
            <input
              type="text"
              value={contenido.vitals.imc}
              onChange={(e) => setVital("imc", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">F.C.</label>
            <input
              type="text"
              value={contenido.vitals.fc}
              onChange={(e) => setVital("fc", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
              placeholder="p.m"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">F.R.</label>
            <input
              type="text"
              value={contenido.vitals.fr}
              onChange={(e) => setVital("fr", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
              placeholder="p.m"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">Temp (°C)</label>
            <input
              type="text"
              value={contenido.vitals.temp_c}
              onChange={(e) => setVital("temp_c", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600">Glasgow</label>
            <input
              type="text"
              value={contenido.vitals.glasgow}
              onChange={(e) => setVital("glasgow", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600">T.A. (Sent.)</label>
            <input
              type="text"
              value={contenido.vitals.ta_sentado}
              onChange={(e) => setVital("ta_sentado", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600">T.A. (Acost.)</label>
            <input
              type="text"
              value={contenido.vitals.ta_acostado}
              onChange={(e) => setVital("ta_acostado", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600">Sat. O2 (%)</label>
            <input
              type="text"
              value={contenido.vitals.sat_o2}
              onChange={(e) => setVital("sat_o2", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-[11px] font-medium text-slate-600">Otros</label>
            <input
              type="text"
              value={contenido.vitals.otros}
              onChange={(e) => setVital("otros", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
          VALORACIÓN POR SISTEMAS
        </div>

        <div className="overflow-auto rounded-md border border-slate-200">
          <table className="min-w-full border-collapse text-left text-[11px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-1.5">Cod</th>
                <th className="px-2 py-1.5">Área</th>
                <th className="px-2 py-1.5">Detalle</th>
                <th className="px-2 py-1.5 text-center">N/A</th>
                <th className="px-2 py-1.5 text-center">N</th>
                <th className="px-2 py-1.5 text-center">A</th>
              </tr>
            </thead>
            <tbody>
              {contenido.valoracion.map((row, idx) => (
                <tr key={`${row.cod}-${row.area}-${row.subarea}-${idx}`} className="border-t border-slate-100">
                  <td className="px-2 py-1.5 font-mono text-[11px] text-slate-800">{row.cod}</td>
                  <td className="px-2 py-1.5 text-slate-800">{row.area}</td>
                  <td className="px-2 py-1.5 text-slate-700">{row.subarea || "-"}</td>

                  {(["NA", "N", "A"] as const).map((opt) => (
                    <td key={opt} className="px-2 py-1.5 text-center">
                      <input
                        type="radio"
                        name={`exf-${idx}`}
                        checked={row.estado === opt}
                        onChange={() => setValoracionEstado(idx, opt)}
                        className="h-3 w-3"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3">
          <label className="text-[11px] font-medium text-slate-600">Observaciones</label>
          <textarea
            value={contenido.observaciones}
            onChange={(e) => persist({ ...contenido, observaciones: e.target.value })}
            rows={6}
            className="mt-1 min-h-[120px] w-full rounded-md border border-slate-300 px-2 py-2 text-[11px] shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Observaciones generales de la valoración por sistemas"
          />
        </div>
      </div>
    </div>
  );
}
