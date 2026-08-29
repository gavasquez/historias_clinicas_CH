/**
 * Zona horaria de operación de la institución. Las fechas y horas "de pared"
 * (día de la semana, hora de agenda, día en curso) se calculan siempre en esta
 * zona, independientemente de la zona del servidor donde corre la aplicación.
 */
export const APP_TIME_ZONE =
  process.env.NEXT_PUBLIC_APP_TIME_ZONE || "America/Bogota";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

const WEEKDAYS: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

const zonedFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
});

export function zonedParts(date: Date): ZonedParts {
  const parts = zonedFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    // Intl devuelve "24" para la medianoche con hour12: false.
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    weekday: WEEKDAYS[get("weekday")] ?? 1,
  };
}

export function parseDateOnlyToUtc(dateStr: string): Date | null {
  if (typeof dateStr !== "string") return null;
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0));
}

export function parseTimeToUtcDate(time: string): Date | null {
  if (typeof time !== "string") return null;
  const m = time.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return null;
  const [hh, mm] = time.split(":").map((v) => Number(v));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return new Date(Date.UTC(1970, 0, 1, hh, mm, 0, 0));
}

export function timeFromUtcDate(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Día de la semana en la zona de la institución (1 = lunes … 7 = domingo). */
export function dayOfWeek1To7(date: Date) {
  return zonedParts(date).weekday;
}

/** Minutos transcurridos del día en la zona de la institución. */
export function minutesFromLocalTime(date: Date) {
  const { hour, minute } = zonedParts(date);
  return hour * 60 + minute;
}

export function minutesFromDbTime(time: Date) {
  return time.getUTCHours() * 60 + time.getUTCMinutes();
}

/** Medianoche UTC del día calendario de la zona de la institución. */
export function dateOnlyUtcFromLocal(date: Date) {
  const { year, month, day } = zonedParts(date);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/** Desfase de la zona de la institución respecto a UTC, en milisegundos. */
function appTimeZoneOffsetMs(date: Date) {
  const { year, month, day, hour, minute } = zonedParts(date);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  return asUtc - Math.floor(date.getTime() / 60_000) * 60_000;
}

/** Instante en el que inicia el día calendario (zona institución) de `date`. */
export function startOfDayInAppTimeZone(date: Date) {
  const { year, month, day } = zonedParts(date);
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return new Date(guess.getTime() - appTimeZoneOffsetMs(guess));
}

export function dateOnlyIsoFromLocal(date: Date) {
  return dateOnlyUtcFromLocal(date).toISOString().slice(0, 10);
}

export function minutesFromHHMM(time: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  return hh * 60 + mm;
}
