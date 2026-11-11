import { addDays, addMonths, daysInRange, startOfMonth, startOfWeek } from "./dates";
import { DATA_FROM } from "./generate-data";
import type {
  Filters,
  Granularity,
  GroupTotal,
  KpiComparison,
  Kpis,
  Renewal,
  TimePoint,
} from "./types";

type RowFilters = Pick<Filters, "from" | "to" | "lob" | "channel" | "region" | "status" | "q">;

export function filterRenewals(rows: readonly Renewal[], f: RowFilters): Renewal[] {
  const needle = f.q.trim().toLowerCase();
  return rows.filter((r) => {
    if (r.renewalDate < f.from || r.renewalDate > f.to) return false;
    if (f.lob.length > 0 && !f.lob.includes(r.lob)) return false;
    if (f.channel && r.channel !== f.channel) return false;
    if (f.region && r.region !== f.region) return false;
    if (f.status && r.status !== f.status) return false;
    if (needle) {
      const haystack = `${r.id} ${r.customer} ${r.lob} ${r.channel} ${r.region} ${r.status}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function computeKpis(rows: readonly Renewal[]): Kpis {
  let totalPremium = 0;
  let renewed = 0;
  let lapsed = 0;
  for (const r of rows) {
    totalPremium += r.premium;
    if (r.status === "Renewed") renewed++;
    else if (r.status === "Lapsed") lapsed++;
  }
  const decided = renewed + lapsed;
  return {
    count: rows.length,
    totalPremium,
    renewalRate: decided > 0 ? renewed / decided : null,
    lapsed,
    avgPremium: rows.length > 0 ? totalPremium / rows.length : null,
  };
}

/** The period of equal length immediately before [from, to]. */
export function previousRange(from: string, to: string): { from: string; to: string } {
  const length = daysInRange(from, to);
  return { from: addDays(from, -length), to: addDays(from, -1) };
}

/** KPIs for the filtered rows and for the preceding period under the same filters. */
export function compareKpis(all: readonly Renewal[], filters: RowFilters): KpiComparison {
  const current = computeKpis(filterRenewals(all, filters));
  const range = previousRange(filters.from, filters.to);
  // Only compare when the whole previous period is inside the data set; a partial period would mislead.
  const covered = range.from >= DATA_FROM;
  const previous = covered ? computeKpis(filterRenewals(all, { ...filters, ...range })) : null;
  return { current, previous, previousRange: range };
}

/** Relative change, or null when there is nothing meaningful to compare with. */
export function percentChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return (current - previous) / previous;
}

export function groupBy<T, K extends string>(items: readonly T[], key: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = groups.get(k);
    if (bucket) bucket.push(item);
    else groups.set(k, [item]);
  }
  return groups;
}

/** Count and premium per category. Every category is present (zeros included), in the order given. */
export function totalsBy<K extends string>(
  rows: readonly Renewal[],
  pick: (row: Renewal) => K,
  categories: readonly K[],
): GroupTotal<K>[] {
  const groups = groupBy(rows, pick);
  return categories.map((key) => {
    const items = groups.get(key) ?? [];
    return { key, count: items.length, premium: items.reduce((s, r) => s + r.premium, 0) };
  });
}

export function granularityFor(from: string, to: string): Granularity {
  const days = daysInRange(from, to);
  if (days <= 45) return "day";
  if (days <= 150) return "week";
  return "month";
}

function bucketStart(date: string, granularity: Granularity): string {
  if (granularity === "day") return date;
  return granularity === "week" ? startOfWeek(date) : startOfMonth(date);
}

function nextBucket(date: string, granularity: Granularity): string {
  if (granularity === "day") return addDays(date, 1);
  return granularity === "week" ? addDays(date, 7) : addMonths(date, 1);
}

/** Status counts per time bucket, with empty buckets filled so the chart has no gaps. */
export function buildTimeSeries(
  rows: readonly Renewal[],
  from: string,
  to: string,
): { granularity: Granularity; points: TimePoint[] } {
  const granularity = granularityFor(from, to);
  const points = new Map<string, TimePoint>();
  const last = bucketStart(to, granularity);
  for (let d = bucketStart(from, granularity); d <= last; d = nextBucket(d, granularity)) {
    points.set(d, { date: d, Renewed: 0, Lapsed: 0, Pending: 0 });
  }
  for (const r of rows) {
    const point = points.get(bucketStart(r.renewalDate, granularity));
    if (point) point[r.status]++;
  }
  return { granularity, points: [...points.values()] };
}
