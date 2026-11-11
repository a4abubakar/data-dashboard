"use client";

import { useMemo } from "react";
import { useFilters } from "@/hooks/use-filters";
import { useRenewals } from "@/hooks/use-renewals";
import { formatDate } from "@/lib/dates";
import { formatInt } from "@/lib/format";
import { nextSort } from "@/lib/table";
import type { SortColumn } from "@/lib/types";
import { ChannelSplitChart, PremiumByLobChart, RenewalsOverTimeChart } from "./charts";
import { DataTable } from "./data-table";
import { FilterBar } from "./filter-bar";
import { KpiTiles } from "./kpi-tiles";
import { Pagination } from "./pagination";
import { ChartsSkeleton, KpiSkeleton, TableSkeleton } from "./skeletons";
import { cardClass, primaryButtonClass } from "./styles";
import { TableToolbar } from "./table-toolbar";

export function Dashboard() {
  const { filters, query, update, reset } = useFilters();
  const { data, isFetching, error, retry } = useRenewals(query);

  const exportHref = useMemo(() => {
    const params = new URLSearchParams(query);
    params.set("format", "csv");
    return `/api/renewals?${params.toString()}`;
  }, [query]);

  const status = isFetching
    ? "Updating results"
    : data
      ? `Showing ${formatInt(data.table.total)} renewals from ${formatDate(data.filters.from)} to ${formatDate(data.filters.to)}`
      : "";

  return (
    <div className="space-y-6" aria-busy={isFetching}>
      <FilterBar filters={filters} onChange={(patch) => update(patch)} onReset={reset} />

      <p role="status" aria-live="polite" className="flex min-h-5 items-center gap-2 text-sm text-muted">
        {isFetching && (
          <span
            aria-hidden="true"
            className="size-3.5 animate-spin rounded-full border-2 border-border border-t-accent motion-reduce:animate-none"
          />
        )}
        {error ? "" : status}
      </p>

      {error && (
        <div role="alert" className={`${cardClass} flex flex-wrap items-center justify-between gap-3 border-bad p-4`}>
          <div>
            <p className="font-semibold text-bad">Could not load renewals</p>
            <p className="text-sm text-muted">{error}. Your filters are unchanged.</p>
          </div>
          <button type="button" className={primaryButtonClass} onClick={retry}>
            Retry
          </button>
        </div>
      )}

      {!data ? (
        error ? null : (
          <>
            <KpiSkeleton />
            <ChartsSkeleton />
            <section className={`${cardClass} p-4`} aria-label="Renewals">
              <TableSkeleton />
            </section>
          </>
        )
      ) : (
        <div className={`space-y-6 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          <KpiTiles kpis={data.kpis} />

          <section aria-labelledby="charts-heading">
            <h2 id="charts-heading" className="sr-only">
              Charts
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <RenewalsOverTimeChart points={data.series.points} granularity={data.series.granularity} />
              <PremiumByLobChart data={data.byLob} />
              <ChannelSplitChart data={data.byChannel} />
            </div>
          </section>

          <section aria-labelledby="table-heading" className={`${cardClass} space-y-4 p-4`}>
            <h2 id="table-heading" className="text-base font-semibold">
              Renewals
            </h2>
            <TableToolbar
              query={filters.q}
              onSearch={(q) => update({ q }, { replace: true })}
              exportHref={exportHref}
              total={data.table.total}
            />
            <DataTable
              rows={data.table.rows}
              sort={filters.sort}
              dir={filters.dir}
              onSort={(column: SortColumn) => update(nextSort(filters, column))}
              onClearFilters={reset}
            />
            <Pagination
              page={data.table.page}
              pageCount={data.table.pageCount}
              pageSize={data.table.pageSize}
              total={data.table.total}
              onPageChange={(page) => update({ page })}
              onPageSizeChange={(pageSize) => update({ pageSize })}
            />
          </section>
        </div>
      )}
    </div>
  );
}
