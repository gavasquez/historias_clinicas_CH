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
