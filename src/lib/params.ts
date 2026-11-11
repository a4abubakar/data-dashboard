import { addDays, isIsoDate } from "./dates";
import { DATA_FROM, DATA_TO } from "./generate-data";
import {
  CHANNELS,
  LINES_OF_BUSINESS,
  PAGE_SIZES,
  REGIONS,
  SORT_COLUMNS,
  STATUSES,
  type Filters,
  type SortColumn,
  type SortDirection,
} from "./types";

export type RawParams = URLSearchParams | Record<string, string | string[] | undefined>;

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_SORT: SortColumn = "renewalDate";
export const DEFAULT_DIR: SortDirection = "desc";
export const MAX_QUERY_LENGTH = 80;

export const DATE_PRESETS = [
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "6m", label: "Last 6 months", days: 182 },
  { id: "12m", label: "Last 12 months", days: 365 },
] as const;

const DEFAULT_PRESET_DAYS = 90;

export function rangeForDays(days: number): { from: string; to: string } {
  const from = addDays(DATA_TO, -(days - 1));
  return { from: from < DATA_FROM ? DATA_FROM : from, to: DATA_TO };
}

export const defaultRange = () => rangeForDays(DEFAULT_PRESET_DAYS);

function get(raw: RawParams, key: string): string | undefined {
  if (raw instanceof URLSearchParams) return raw.get(key) ?? undefined;
  const v = raw[key];
  return Array.isArray(v) ? v[0] : v;
}

function getAll(raw: RawParams, key: string): string[] {
  if (raw instanceof URLSearchParams) return raw.getAll(key);
  const v = raw[key];
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function oneOf<T extends string>(allowed: readonly T[], value: string | undefined): T | null {
  return allowed.find((a) => a === value) ?? null;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

const clampDate = (iso: string) => (iso < DATA_FROM ? DATA_FROM : iso > DATA_TO ? DATA_TO : iso);

/** Turns untrusted query params into a valid Filters object: unknown values fall back to defaults, never throw. */
export function parseFilters(raw: RawParams): Filters {
  const fallback = defaultRange();
  const rawFrom = get(raw, "from");
  const rawTo = get(raw, "to");
  let from = rawFrom && isIsoDate(rawFrom) ? clampDate(rawFrom) : fallback.from;
  let to = rawTo && isIsoDate(rawTo) ? clampDate(rawTo) : fallback.to;
  if (from > to) [from, to] = [to, from];

  const requestedLobs = getAll(raw, "lob").flatMap((v) => v.split(","));
  const lob = LINES_OF_BUSINESS.filter((l) => requestedLobs.includes(l));

  const requestedPageSize = positiveInt(get(raw, "pageSize"), DEFAULT_PAGE_SIZE);
  const pageSize = PAGE_SIZES.find((p) => p === requestedPageSize) ?? DEFAULT_PAGE_SIZE;

  return {
    from,
    to,
    lob,
    channel: oneOf(CHANNELS, get(raw, "channel")),
    region: oneOf(REGIONS, get(raw, "region")),
    status: oneOf(STATUSES, get(raw, "status")),
    q: (get(raw, "q") ?? "").trim().slice(0, MAX_QUERY_LENGTH),
    sort: oneOf(SORT_COLUMNS, get(raw, "sort")) ?? DEFAULT_SORT,
    dir: oneOf(["asc", "desc"] as const, get(raw, "dir")) ?? DEFAULT_DIR,
    page: positiveInt(get(raw, "page"), 1),
    pageSize,
  };
}

/** Serialises filters, leaving out anything that equals its default so URLs stay short and shareable. */
export function filtersToSearchParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  const range = defaultRange();
  if (filters.from !== range.from) params.set("from", filters.from);
  if (filters.to !== range.to) params.set("to", filters.to);
  if (filters.lob.length > 0) params.set("lob", filters.lob.join(","));
  if (filters.channel) params.set("channel", filters.channel);
  if (filters.region) params.set("region", filters.region);
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  if (filters.sort !== DEFAULT_SORT) params.set("sort", filters.sort);
  if (filters.dir !== DEFAULT_DIR) params.set("dir", filters.dir);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.pageSize !== DEFAULT_PAGE_SIZE) params.set("pageSize", String(filters.pageSize));
  return params;
}

export function hasActiveFilters(filters: Filters): boolean {
  const range = defaultRange();
  return (
    filters.from !== range.from ||
    filters.to !== range.to ||
    filters.lob.length > 0 ||
    filters.channel !== null ||
    filters.region !== null ||
    filters.status !== null ||
    filters.q !== ""
  );
}
