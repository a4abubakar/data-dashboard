export const LINES_OF_BUSINESS = ["Motor", "Health", "Pet", "Travel", "Home", "Bike"] as const;
export const CHANNELS = ["Email", "WhatsApp", "Web", "Agent"] as const;
export const STATUSES = ["Renewed", "Lapsed", "Pending"] as const;
export const REGIONS = ["Dubai", "Abu Dhabi", "Sharjah", "Other"] as const;

export type LineOfBusiness = (typeof LINES_OF_BUSINESS)[number];
export type Channel = (typeof CHANNELS)[number];
export type Status = (typeof STATUSES)[number];
export type Region = (typeof REGIONS)[number];

export interface Renewal {
  id: string;
  customer: string;
  lob: LineOfBusiness;
  channel: Channel;
  status: Status;
  /** Annual premium in AED. */
  premium: number;
  /** ISO date (YYYY-MM-DD), UTC. */
  renewalDate: string;
  region: Region;
}

export const SORT_COLUMNS = [
  "id",
  "customer",
  "lob",
  "channel",
  "region",
  "status",
  "premium",
  "renewalDate",
] as const;
export type SortColumn = (typeof SORT_COLUMNS)[number];
export type SortDirection = "asc" | "desc";

export const PAGE_SIZES = [10, 25, 50, 100] as const;

export interface Filters {
  /** Inclusive ISO dates. */
  from: string;
  to: string;
  lob: LineOfBusiness[];
  channel: Channel | null;
  region: Region | null;
  status: Status | null;
  q: string;
  sort: SortColumn;
  dir: SortDirection;
  page: number;
  pageSize: number;
}

export interface Kpis {
  count: number;
  totalPremium: number;
  /** renewed / (renewed + lapsed); null when nothing has been decided yet. */
  renewalRate: number | null;
  lapsed: number;
  avgPremium: number | null;
}

export interface KpiComparison {
  current: Kpis;
  /** null when the previous period is not fully covered by the data set. */
  previous: Kpis | null;
  previousRange: { from: string; to: string };
}

export type Granularity = "day" | "week" | "month";

export interface TimePoint {
  /** Bucket start, ISO date. */
  date: string;
  Renewed: number;
  Lapsed: number;
  Pending: number;
}

export interface GroupTotal<K extends string = string> {
  key: K;
  count: number;
  premium: number;
}

export interface RenewalsResponse {
  filters: Filters;
  dataWindow: { from: string; to: string };
  kpis: KpiComparison;
  series: { granularity: Granularity; points: TimePoint[] };
  byLob: GroupTotal<LineOfBusiness>[];
  byChannel: GroupTotal<Channel>[];
  byStatus: GroupTotal<Status>[];
  table: {
    rows: Renewal[];
    total: number;
    page: number;
    pageCount: number;
    pageSize: number;
  };
}
