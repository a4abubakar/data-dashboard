"use client";

import { useId, useState } from "react";
import { isIsoDate } from "@/lib/dates";
import { DATA_FROM, DATA_TO } from "@/lib/generate-data";
import { DATE_PRESETS, hasActiveFilters, rangeForDays } from "@/lib/params";
import {
  CHANNELS,
  LINES_OF_BUSINESS,
  REGIONS,
  STATUSES,
  type Channel,
  type Filters,
  type LineOfBusiness,
  type Region,
  type Status,
} from "@/lib/types";
import { buttonClass, cardClass, fieldClass } from "./styles";

interface FilterBarProps {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
}

export function FilterBar({ filters, onChange, onReset }: FilterBarProps) {
  const activePreset = DATE_PRESETS.find((p) => {
    const r = rangeForDays(p.days);
    return r.from === filters.from && r.to === filters.to;
  });

  function toggleLob(lob: LineOfBusiness, checked: boolean) {
    const next = checked ? [...filters.lob, lob] : filters.lob.filter((l) => l !== lob);
    onChange({ lob: LINES_OF_BUSINESS.filter((l) => next.includes(l)) });
  }

  return (
    <section aria-labelledby="filters-heading" className={`${cardClass} p-4`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="filters-heading" className="text-base font-semibold">
          Filters
        </h2>
        {hasActiveFilters(filters) && (
          <button type="button" onClick={onReset} className={`${buttonClass} h-9`}>
            Clear filters
          </button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <fieldset className="min-w-0">
          <legend className="mb-1.5 text-sm font-medium">Renewal date</legend>
          <div className="flex flex-wrap items-end gap-2">
            <DateField
              label="From"
              value={filters.from}
              onCommit={(from) => onChange({ from, to: from > filters.to ? from : filters.to })}
            />
            <DateField
              label="To"
              value={filters.to}
              onCommit={(to) => onChange({ to, from: to < filters.from ? to : filters.from })}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Date presets">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-pressed={activePreset?.id === preset.id}
                onClick={() => onChange(rangeForDays(preset.days))}
                className="h-8 rounded-full border border-border px-3 text-xs font-medium hover:bg-surface-muted aria-pressed:border-accent aria-pressed:bg-accent-soft"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid min-w-0 gap-4 sm:grid-cols-3">
          <SelectField
            label="Channel"
            allLabel="All channels"
            value={filters.channel}
            options={CHANNELS}
            onChange={(channel: Channel | null) => onChange({ channel })}
          />
          <SelectField
            label="Region"
            allLabel="All regions"
            value={filters.region}
            options={REGIONS}
            onChange={(region: Region | null) => onChange({ region })}
          />
          <SelectField
            label="Status"
            allLabel="All statuses"
            value={filters.status}
            options={STATUSES}
            onChange={(status: Status | null) => onChange({ status })}
          />
        </div>
      </div>

      <fieldset className="mt-4 min-w-0">
        <legend className="mb-1.5 text-sm font-medium">
          Line of business <span className="font-normal text-muted">(none selected means all)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {LINES_OF_BUSINESS.map((lob) => (
            <label
              key={lob}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border px-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--ring)]"
            >
              <input
                type="checkbox"
                className="size-4 accent-[var(--accent)] focus-visible:outline-none"
                checked={filters.lob.includes(lob)}
                onChange={(e) => toggleLob(lob, e.target.checked)}
              />
              {lob}
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

function SelectField<T extends string>({
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  allLabel: string;
  value: T | null;
  options: readonly T[];
  onChange: (value: T | null) => void;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        className={fieldClass}
        value={value ?? ""}
        onChange={(e) => onChange(options.find((o) => o === e.target.value) ?? null)}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Date input that keeps what the user is typing and only commits complete, in-range dates. */
function DateField({ label, value, onCommit }: { label: string; value: string; onCommit: (iso: string) => void }) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    // The URL changed underneath us (preset, back button, reset): adopt it.
    setSeen(value);
    setDraft(value);
  }
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="date"
        className={`${fieldClass} w-40`}
        min={DATA_FROM}
        max={DATA_TO}
        value={draft}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          if (isIsoDate(next) && next >= DATA_FROM && next <= DATA_TO) onCommit(next);
        }}
      />
    </div>
  );
}
