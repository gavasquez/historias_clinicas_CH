export const DEFAULT_TIME_ZONE = "America/Bogota";

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

export function dayOfWeek1To7(date: Date) {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

export function minutesFromLocalTime(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function minutesFromDbTime(time: Date) {
  return time.getUTCHours() * 60 + time.getUTCMinutes();
}

export function dateOnlyUtcFromLocal(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
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

export function formatDateInZone(date: Date, timeZone = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    date,
  );
}

export function parseDateInZoneToUtc(dateStr: string, timeZone = DEFAULT_TIME_ZONE): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [_, y, m, d] = match;
  const localDate = new Date(Number(y), Number(m) - 1, Number(d));
  const offset = localDate.getTime() - new Date(localDate.toLocaleString("en-US", { timeZone })).getTime();
  return new Date(localDate.getTime() + offset);
}

export function startOfDayInZone(date: Date, timeZone = DEFAULT_TIME_ZONE): Date {
  const dateStr = formatDateInZone(date, timeZone);
  return parseDateInZoneToUtc(dateStr, timeZone) ?? new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function endOfDayInZone(date: Date, timeZone = DEFAULT_TIME_ZONE): Date {
  const start = startOfDayInZone(date, timeZone);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function dayOfWeekInZone(date: Date, timeZone = DEFAULT_TIME_ZONE): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const dow = weekday ? map[weekday] : date.getDay();
  return dow === 0 ? 7 : dow;
}

export function minutesFromDateInZone(date: Date, timeZone = DEFAULT_TIME_ZONE): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hh * 60 + mm;
}

export function dateOnlyFromDateInZone(date: Date, timeZone = DEFAULT_TIME_ZONE): Date {
  const dateStr = formatDateInZone(date, timeZone);
  return parseDateInZoneToUtc(dateStr, timeZone) ?? date;
}
