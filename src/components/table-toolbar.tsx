"use client";

import { useEffect, useId, useRef } from "react";
import { formatInt } from "@/lib/format";
import { buttonClass, fieldClass } from "./styles";

export const SEARCH_DEBOUNCE_MS = 300;

interface TableToolbarProps {
  /** Search text currently in the URL. */
  query: string;
  onSearch: (query: string) => void;
  exportHref: string;
  total: number;
}

export function TableToolbar({ query, onSearch, exportHref, total }: TableToolbarProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSent = useRef(query);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch; // the debounced call must see the latest filters
  });

  // Keep the box in step with the URL when it changes from elsewhere (Clear filters, back button).
  useEffect(() => {
    if (query !== lastSent.current && inputRef.current) {
      inputRef.current.value = query;
      lastSent.current = query;
    }
  }, [query]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleChange(value: string) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      lastSent.current = value.trim();
      onSearchRef.current(value);
    }, SEARCH_DEBOUNCE_MS);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="sm:w-80">
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
          Search renewals
        </label>
        <input
          id={id}
          ref={inputRef}
          type="search"
          defaultValue={query}
          placeholder="Customer, ID, line, region..."
          autoComplete="off"
          maxLength={80}
          className={fieldClass}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
      <a href={exportHref} download className={buttonClass}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3" />
        </svg>
        Export CSV ({formatInt(total)} rows)
      </a>
    </div>
  );
}
