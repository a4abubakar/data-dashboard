import { buildTimeSeries, compareKpis, filterRenewals, totalsBy } from "./aggregate";
import { DATA_FROM, DATA_TO } from "./generate-data";
import { paginate, sortRows } from "./table";
import {
  CHANNELS,
  LINES_OF_BUSINESS,
  STATUSES,
  type Filters,
  type Renewal,
  type RenewalsResponse,
} from "./types";

/** Everything the dashboard needs for one set of filters. */
export function buildRenewalsResponse(all: readonly Renewal[], requested: Filters): RenewalsResponse {
  const rows = filterRenewals(all, requested);
  const table = paginate(sortRows(rows, requested.sort, requested.dir), requested.page, requested.pageSize);

  return {
    filters: { ...requested, page: table.page },
    dataWindow: { from: DATA_FROM, to: DATA_TO },
    kpis: compareKpis(all, requested),
    series: buildTimeSeries(rows, requested.from, requested.to),
    byLob: totalsBy(rows, (r) => r.lob, LINES_OF_BUSINESS),
    byChannel: totalsBy(rows, (r) => r.channel, CHANNELS),
    byStatus: totalsBy(rows, (r) => r.status, STATUSES),
    table,
  };
}

/** All rows matching the filters, in the requested sort order (used for the CSV export). */
export function exportRows(all: readonly Renewal[], filters: Filters): Renewal[] {
  return sortRows(filterRenewals(all, filters), filters.sort, filters.dir);
}
