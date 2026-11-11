"use client";

import { useId } from "react";
import { formatInt } from "@/lib/format";
import { PAGE_SIZES } from "@/lib/types";
import { buttonClass, fieldClass } from "./styles";

interface PaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({ page, pageCount, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const sizeId = useId();
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">
        Showing <span className="font-medium text-foreground">{formatInt(first)}</span> to{" "}
        <span className="font-medium text-foreground">{formatInt(last)}</span> of{" "}
        <span className="font-medium text-foreground">{formatInt(total)}</span> renewals
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor={sizeId} className="whitespace-nowrap text-sm text-muted">
            Rows per page
          </label>
          <select
            id={sizeId}
            className={`${fieldClass} w-20`}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className={buttonClass} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Previous
          </button>
          <span className="min-w-24 text-center text-sm tabular-nums">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            className={buttonClass}
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </nav>
  );
}
