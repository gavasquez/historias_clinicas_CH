"use client";

import React from "react";
import { Info, MousePointerClick } from "lucide-react";

type ExamenFisicoEstado = "NA" | "N" | "A" | "";

type ExamenFisicoItem = {
  cod: number;
  area: string;
  subarea: string;
  estado: ExamenFisicoEstado;
  cual?: string;
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
  sat_o2: string;
  otros: string;
};

type ExamenFisicoContenido = {
  vitals: ExamenFisicoVitals;
  valoracion: ExamenFisicoItem[];
  observaciones: string;
};

function parseNumberLike(input: string): number | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  const normalized = raw.replace(/,/g, ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return n;
}

function computeImc(pesoKgRaw: string, estaturaCmRaw: string): string {
  const pesoKg = parseNumberLike(pesoKgRaw);
  const estaturaCm = parseNumberLike(estaturaCmRaw);
  if (pesoKg == null || estaturaCm == null) return "";
  if (pesoKg <= 0 || estaturaCm <= 0) return "";

  const estaturaM = estaturaCm / 100;
  if (estaturaM <= 0) return "";

  const imc = pesoKg / (estaturaM * estaturaM);
  if (!Number.isFinite(imc)) return "";

  return imc.toFixed(2);
}

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
    sat_o2: "",
    otros: "",
  },
  valoracion: [
    { cod: 1, area: "CABEZA", subarea: "CRÁNEO", estado: "" },
    { cod: 1, area: "CABEZA", subarea: "CARA", estado: "" },

    { cod: 2, area: "OJOS", subarea: "ANATOMÍA", estado: "" },
    { cod: 2, area: "OJOS", subarea: "AGUDEZA VISUAL", estado: "" },

    { cod: 3, area: "OÍDOS", subarea: "ANATOMÍA", estado: "" },
    { cod: 3, area: "OÍDOS", subarea: "AGUDEZA AUDITIVA", estado: "" },

    { cod: 4, area: "NARIZ", subarea: "ANATOMÍA", estado: "" },
    { cod: 4, area: "NARIZ", subarea: "FUNCIONALIDAD", estado: "" },

    { cod: 5, area: "BOCA Y OROFARINGE", subarea: "ANATOMÍA", estado: "" },
    { cod: 5, area: "BOCA Y OROFARINGE", subarea: "FUNCIONALIDAD", estado: "" },

    { cod: 6, area: "CUELLO", subarea: "ANATOMÍA", estado: "" },
    { cod: 6, area: "CUELLO", subarea: "FUNCIONALIDAD", estado: "" },

    { cod: 7, area: "TÓRAX", subarea: "", estado: "" },
    { cod: 8, area: "CARDIOVASCULAR", subarea: "", estado: "" },
    { cod: 9, area: "PULMONAR", subarea: "", estado: "" },
    { cod: 10, area: "ABDOMEN", subarea: "", estado: "" },

    { cod: 11, area: "GENITO URINARIO", subarea: "EXTERNOS", estado: "" },
    { cod: 11, area: "GENITO URINARIO", subarea: "INTERNOS", estado: "" },

    { cod: 12, area: "EXTREMIDADES", subarea: "", estado: "" },
    { cod: 13, area: "COLUMNA VERTEBRAL", subarea: "", estado: "" },
    { cod: 14, area: "OSTEOMUSCULAR Y ARTICULAR", subarea: "", estado: "" },

    { cod: 15, area: "VASCULAR", subarea: "", estado: "" },
    { cod: 16, area: "NEUROLÓGICO", subarea: "", estado: "" },
    { cod: 17, area: "PIEL Y ANEXOS", subarea: "", estado: "" },
    { cod: 18, area: "MENTAL", subarea: "", estado: "" },
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

  const parsedRows: ExamenFisicoItem[] = (valoracion as any[])
    .filter(Boolean)
    .map((r: any) => {
      const rawEstado = String(r.estado ?? "")
        .trim()
        .toUpperCase();
      const normalizedEstado: ExamenFisicoEstado =
        rawEstado === "NA" || rawEstado === "N" || rawEstado === "A" ? (rawEstado as any) : "";

      return {
        cod: Number(r.cod) || 0,
        area: String(r.area ?? ""),
        subarea: String(r.subarea ?? ""),
        estado: normalizedEstado,
        cual: typeof r?.cual === "string" ? r.cual : "",
      };
    });

  const parsedMap = new Map<string, ExamenFisicoItem>();
  for (const r of parsedRows) {
    const key = `${r.area}||${r.subarea}`;
    if (!parsedMap.has(key)) parsedMap.set(key, r);
  }

  const reconciledValoracion: ExamenFisicoItem[] = DEFAULT_CONTENIDO.valoracion.map((def) => {
    const key = `${def.area}||${def.subarea}`;
    const saved = parsedMap.get(key);
    if (!saved) return { ...def };
    return {
      ...def,
      estado: saved.estado ?? "",
      cual: saved.cual ?? "",
    };
  });

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
      sat_o2: String(vitals.sat_o2 ?? ""),
      otros: String(vitals.otros ?? ""),
    },
    valoracion: reconciledValoracion,
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
  const [editingCualIndex, setEditingCualIndex] = React.useState<number | null>(null);

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

  React.useEffect(() => {
    const nextImc = computeImc(contenido.vitals.peso_kg, contenido.vitals.estatura_cm);
    if (nextImc === contenido.vitals.imc) return;

    persist({
      ...contenido,
      vitals: {
        ...contenido.vitals,
        imc: nextImc,
      },
    });
  }, [contenido.vitals.estatura_cm, contenido.vitals.peso_kg]);

  const setVital = (key: keyof ExamenFisicoVitals, value: string) => {
    if (key === "glasgow") {
      const n = parseNumberLike(value);
      if (n == null) {
        persist({
          ...contenido,
          vitals: {
            ...contenido.vitals,
            [key]: "",
          },
        });
        return;
      }
      const clamped = Math.max(3, Math.min(15, Math.round(n)));
      persist({
        ...contenido,
        vitals: {
          ...contenido.vitals,
          [key]: String(clamped),
        },
      });
      return;
    }

    persist({
      ...contenido,
      vitals: {
        ...contenido.vitals,
        [key]: value,
      },
    });
  };

  const setValoracionEstado = (index: number, estado: ExamenFisicoEstado) => {
    const nextRows = contenido.valoracion.map((r, i) => {
      if (i !== index) return r;
      const next: ExamenFisicoItem = { ...r, estado };
      return next;
    });
    persist({ ...contenido, valoracion: nextRows });
  };

  const setValoracionCual = (index: number, cual: string) => {
    const nextRows = contenido.valoracion.map((r, i) => (i === index ? { ...r, cual } : r));
    persist({ ...contenido, valoracion: nextRows });
  };

  const applyValoracionBulkEstado = (estado: ExamenFisicoEstado) => {
    const nextRows = contenido.valoracion.map((r) => {
      const next: ExamenFisicoItem = { ...r, estado };
      return next;
    });
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
              type="number"
              value={contenido.vitals.estatura_cm}
              onChange={(e) => setVital("estatura_cm", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
              placeholder="Ej: 170"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">Peso (kg)</label>
            <input
              type="number"
              value={contenido.vitals.peso_kg}
              onChange={(e) => setVital("peso_kg", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
              placeholder="Ej: 70"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">IMC</label>
            <input
              type="text"
              value={contenido.vitals.imc}
              disabled
              className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] text-slate-700"
              placeholder="Calculado automáticamente"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">F.C. (LPM)</label>
            <input
              type="number"
              value={contenido.vitals.fc}
              onChange={(e) => setVital("fc", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
              placeholder="Ej: 80"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">F.R. (RPM)</label>
            <input
              type="number"
              value={contenido.vitals.fr}
              onChange={(e) => setVital("fr", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
              placeholder="Ej: 18"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">Temp (°C)</label>
            <input
              type="number"
              value={contenido.vitals.temp_c}
              onChange={(e) => setVital("temp_c", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
              placeholder="Ej: 36.5"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600">Glasgow</label>
            <input
              type="number"
              min={3}
              max={15}
              value={contenido.vitals.glasgow}
              onChange={(e) => setVital("glasgow", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
              placeholder="3 - 15"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600">T.A. (MMHG)</label>
            <input
              type="number"
              value={contenido.vitals.ta_sentado}
              onChange={(e) => setVital("ta_sentado", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
              placeholder="Ej: 120"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600">Sat. O2 (%)</label>
            <input
              type="number"
              value={contenido.vitals.sat_o2}
              onChange={(e) => setVital("sat_o2", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
              placeholder="Ej: 98"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-[11px] font-medium text-slate-600">Otros</label>
            <input
              type="text"
              value={contenido.vitals.otros}
              onChange={(e) => setVital("otros", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
              placeholder="Observaciones adicionales"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
          <span>VALORACIÓN POR SISTEMAS</span>
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-100"
            title="Puedes marcar todas las filas haciendo clic en N/A, N o A del encabezado."
          >
            <Info className="h-4 w-4" />
          </span>
        </div>

        <div className="overflow-auto rounded-md border border-slate-200">
          <table className="min-w-full table-fixed border-collapse text-left text-[11px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[160px] px-2 py-1.5">Área</th>
                <th className="w-[220px] px-2 py-1.5">Detalle</th>
                <th
                  className="w-[56px] cursor-pointer select-none px-2 py-1.5 text-center hover:bg-slate-100"
                  onClick={() => applyValoracionBulkEstado("NA")}
                  title="Marcar todas las filas como N/A"
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    <MousePointerClick className="h-3 w-3" />
                    <span>N/A</span>
                  </span>
                </th>
                <th
                  className="w-[48px] cursor-pointer select-none px-2 py-1.5 text-center hover:bg-slate-100"
                  onClick={() => applyValoracionBulkEstado("N")}
                  title="Marcar todas las filas como N"
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    <MousePointerClick className="h-3 w-3" />
                    <span>N</span>
                  </span>
                </th>
                <th
                  className="w-[48px] cursor-pointer select-none px-2 py-1.5 text-center hover:bg-slate-100"
                  onClick={() => applyValoracionBulkEstado("A")}
                  title="Marcar todas las filas como A"
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    <MousePointerClick className="h-3 w-3" />
                    <span>A</span>
                  </span>
                </th>
                <th className="min-w-[260px] px-2 py-1.5">Cuál</th>
              </tr>
            </thead>
            <tbody>
              {contenido.valoracion.map((row, idx) => (
                <tr key={`${row.cod}-${row.area}-${row.subarea}-${idx}`} className="border-t border-slate-100">
                  <td className="truncate px-2 py-1.5 text-slate-800" title={row.area}>
                    {row.area}
                  </td>
                  <td className="truncate px-2 py-1.5 text-slate-700" title={row.subarea || "-"}>
                    {row.subarea || "-"}
                  </td>

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

                  <td className="px-2 py-1.5">
                    {editingCualIndex === idx ? (
                      <textarea
                        value={row.cual ?? ""}
                        onChange={(e) => setValoracionCual(idx, e.target.value)}
                        onBlur={() => setEditingCualIndex(null)}
                        rows={3}
                        autoFocus
                        className="min-h-[72px] w-full resize-none rounded-md border border-slate-300 bg-white px-2 py-2 text-[11px] shadow-sm outline-none ring-0 transition-all focus:ring-2 focus:ring-sky-500"
                        placeholder="Especifique"
                      />
                    ) : (
                      <input
                        type="text"
                        value={row.cual ?? ""}
                        onChange={(e) => setValoracionCual(idx, e.target.value)}
                        onFocus={() => {
                          setEditingCualIndex(idx);
                        }}
                        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] shadow-sm"
                        placeholder="Especifique"
                      />
                    )}
                  </td>
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
