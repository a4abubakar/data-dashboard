import { formatDate, formatMonth, formatShortDate } from "./dates";
import { formatAed, formatInt, formatPercent } from "./format";
import type { Channel, Granularity, GroupTotal, LineOfBusiness, TimePoint } from "./types";

export function bucketLabel(date: string, granularity: Granularity): string {
  return granularity === "month" ? formatMonth(date) : formatShortDate(date);
}

export function bucketLongLabel(date: string, granularity: Granularity): string {
  if (granularity === "month") return formatMonth(date);
  return granularity === "week" ? `Week of ${formatDate(date)}` : formatDate(date);
}

const total = (p: TimePoint) => p.Renewed + p.Lapsed + p.Pending;

/** Text alternative for the renewals-over-time chart. */
export function timeSeriesSummary(points: readonly TimePoint[], granularity: Granularity): string {
  const all = points.reduce((s, p) => s + total(p), 0);
  if (all === 0) return "No renewals match the current filters.";
  const sum = (k: "Renewed" | "Lapsed" | "Pending") => points.reduce((s, p) => s + p[k], 0);
  const peak = points.reduce((best, p) => (total(p) > total(best) ? p : best), points[0]);
  const unit = granularity === "day" ? "day" : granularity;
  return (
    `${formatInt(all)} renewals by ${unit}: ${formatInt(sum("Renewed"))} renewed, ${formatInt(sum("Lapsed"))} lapsed, ` +
    `${formatInt(sum("Pending"))} pending. Busiest ${unit}: ${bucketLongLabel(peak.date, granularity)} with ${formatInt(total(peak))}.`
  );
}

export function lobSummary(byLob: readonly GroupTotal<LineOfBusiness>[]): string {
  const sum = byLob.reduce((s, g) => s + g.premium, 0);
  if (sum === 0) return "No premium matches the current filters.";
  const sorted = [...byLob].sort((a, b) => b.premium - a.premium);
  const top = sorted[0];
  const bottom = sorted.filter((g) => g.count > 0).at(-1) ?? sorted[0];
  return `${top.key} brings in the most premium at ${formatAed(top.premium)} (${formatPercent(top.premium / sum, 0)} of ${formatAed(sum)}); ${bottom.key} the least at ${formatAed(bottom.premium)}.`;
}

export function channelSummary(byChannel: readonly GroupTotal<Channel>[]): string {
  const sum = byChannel.reduce((s, g) => s + g.count, 0);
  if (sum === 0) return "No renewals match the current filters.";
  const top = [...byChannel].sort((a, b) => b.count - a.count)[0];
  return `${top.key} is the largest channel with ${formatInt(top.count)} of ${formatInt(sum)} renewals (${formatPercent(top.count / sum, 0)}).`;
}
