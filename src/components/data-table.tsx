"use client";

import { formatDate } from "@/lib/dates";
import { formatAed } from "@/lib/format";
import type { Renewal, SortColumn, SortDirection } from "@/lib/types";
import { primaryButtonClass } from "./styles";

const COLUMNS: { id: SortColumn; label: string; numeric?: boolean }[] = [
  { id: "id", label: "ID" },
  { id: "customer", label: "Customer" },
  { id: "lob", label: "Line of business" },
  { id: "channel", label: "Channel" },
  { id: "region", label: "Region" },
  { id: "status", label: "Status" },
  { id: "premium", label: "Premium", numeric: true },
  { id: "renewalDate", label: "Renewal date" },
];

const STATUS_STYLES: Record<Renewal["status"], string> = {
  Renewed: "text-good",
  Lapsed: "text-bad",
  Pending: "text-muted",
};

interface DataTableProps {
  rows: readonly Renewal[];
  sort: SortColumn;
  dir: SortDirection;
  onSort: (column: SortColumn) => void;
  onClearFilters?: () => void;
}

export function DataTable({ rows, sort, dir, onSort, onClearFilters }: DataTableProps) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-12 text-center">
        <p className="text-base font-semibold">No renewals match these filters</p>
        <p className="max-w-md text-sm text-muted">
          Try widening the date range, removing a filter or changing the search text.
        </p>
        {onClearFilters && (
          <button type="button" onClick={onClearFilters} className={primaryButtonClass}>
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border border-border"
      tabIndex={0}
      role="region"
      aria-label="Renewals table, scrollable"
    >
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <caption className="sr-only">
          Policy renewals, sorted by {COLUMNS.find((c) => c.id === sort)?.label}{" "}
          {dir === "asc" ? "ascending" : "descending"}
        </caption>
        <thead className="bg-surface-muted">
          <tr>
            {COLUMNS.map((col) => {
              const active = col.id === sort;
              return (
                <th
                  key={col.id}
                  scope="col"
                  aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
                  className={`whitespace-nowrap px-3 py-2 font-semibold ${col.numeric ? "text-right" : "text-left"}`}
                >
                  <button
                    type="button"
                    onClick={() => onSort(col.id)}
                    className={`inline-flex items-center gap-1.5 rounded px-1 py-1 hover:bg-border/50 ${col.numeric ? "flex-row-reverse" : ""}`}
                  >
                    {col.label}
                    <span aria-hidden="true" className={`w-3 text-xs ${active ? "" : "text-muted opacity-60"}`}>
                      {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border hover:bg-surface-muted/60">
              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{r.id}</td>
              <td className="whitespace-nowrap px-3 py-2">{r.customer}</td>
              <td className="px-3 py-2">{r.lob}</td>
              <td className="px-3 py-2">{r.channel}</td>
              <td className="whitespace-nowrap px-3 py-2">{r.region}</td>
              <td className={`px-3 py-2 font-medium ${STATUS_STYLES[r.status]}`}>{r.status}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatAed(r.premium)}</td>
              <td className="whitespace-nowrap px-3 py-2">{formatDate(r.renewalDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
