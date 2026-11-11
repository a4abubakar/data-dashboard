/** All dates are ISO "YYYY-MM-DD" strings in UTC, so there are no time-zone surprises and strings sort correctly. */

const DAY_MS = 86_400_000;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return toIso(new Date(toDate(iso).getTime() + days * DAY_MS));
}

/** Inclusive number of days in [from, to]. */
export function daysInRange(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY_MS) + 1;
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso: string): string {
  const day = toDate(iso).getUTCDay(); // 0 = Sunday
  return addDays(iso, -((day + 6) % 7));
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function addMonths(iso: string, months: number): string {
  const d = toDate(startOfMonth(iso));
  d.setUTCMonth(d.getUTCMonth() + months);
  return toIso(d);
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const shortFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

export const formatDate = (iso: string) => dateFmt.format(toDate(iso));
export const formatShortDate = (iso: string) => shortFmt.format(toDate(iso));
export const formatMonth = (iso: string) => monthFmt.format(toDate(iso));
