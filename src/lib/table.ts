import type { Renewal, SortColumn, SortDirection } from "./types";

export function compareBy(column: SortColumn): (a: Renewal, b: Renewal) => number {
  if (column === "premium") return (a, b) => a.premium - b.premium;
  return (a, b) => a[column].localeCompare(b[column], "en", { sensitivity: "base" });
}

/** Returns a new array. Ties fall back to id so ordering is stable and pages never overlap. */
export function sortRows(rows: readonly Renewal[], column: SortColumn, dir: SortDirection): Renewal[] {
  const compare = compareBy(column);
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => sign * compare(a, b) || a.id.localeCompare(b.id));
}

export interface Page<T> {
  rows: T[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

/** Clicking a header: same column flips direction; a new column starts ascending (numbers and dates start descending). */
export function nextSort(
  current: { sort: SortColumn; dir: SortDirection },
  clicked: SortColumn,
): { sort: SortColumn; dir: SortDirection } {
  if (current.sort === clicked) return { sort: clicked, dir: current.dir === "asc" ? "desc" : "asc" };
  return { sort: clicked, dir: clicked === "premium" || clicked === "renewalDate" ? "desc" : "asc" };
}

/** 1-based pagination; an out-of-range page is clamped to the nearest valid one. */
export function paginate<T>(items: readonly T[], page: number, pageSize: number): Page<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (current - 1) * pageSize;
  return { rows: items.slice(start, start + pageSize), total, page: current, pageCount, pageSize };
}
