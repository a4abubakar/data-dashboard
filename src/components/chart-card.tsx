"use client";

import { useId, useState, type ReactNode } from "react";
import { buttonClass, cardClass } from "./styles";

interface ChartCardProps {
  title: string;
  /** Plain-language summary read by screen readers instead of the SVG. Also shown as the caption. */
  summary: string;
  /** The visual chart. */
  children: ReactNode;
  /** The same data as an accessible table (caller supplies the <table>). */
  table: ReactNode;
  className?: string;
}

/**
 * Wraps a chart with a title, a text summary and a "View as table" switch.
 * The SVG is exposed to assistive tech as a single image described by the summary; the table is the full-fidelity alternative.
 */
export function ChartCard({ title, summary, children, table, className = "" }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  const titleId = useId();
  const descId = useId();
  const regionId = useId();

  return (
    <section aria-labelledby={titleId} className={`${cardClass} flex min-w-0 flex-col p-4 ${className}`}>
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 id={titleId} className="text-base font-semibold">
          {title}
        </h3>
        <button
          type="button"
          className={`${buttonClass} h-8 shrink-0 px-2.5 text-xs`}
          aria-pressed={showTable}
          aria-controls={regionId}
          onClick={() => setShowTable((v) => !v)}
        >
          {showTable ? "View as chart" : "View as table"}
        </button>
      </div>
      <p id={descId} className="mb-3 text-sm text-muted">
        {summary}
      </p>
      <div id={regionId} className="min-h-0 flex-1">
        {showTable ? (
          <div className="max-h-72 overflow-auto" tabIndex={0} role="region" aria-label={`${title}, table view`}>
            {table}
          </div>
        ) : (
          <div role="img" aria-labelledby={titleId} aria-describedby={descId}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

export function DataTableSimple({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-border text-left">
          {headers.map((h, i) => (
            <th key={h} scope="col" className={`sticky top-0 bg-surface px-2 py-2 font-medium ${i > 0 ? "text-right" : ""}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={String(row[0])} className="border-b border-border last:border-0">
            {row.map((cell, i) =>
              i === 0 ? (
                <th key={i} scope="row" className="px-2 py-1.5 text-left font-normal">
                  {cell}
                </th>
              ) : (
                <td key={i} className="px-2 py-1.5 text-right tabular-nums">
                  {cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
