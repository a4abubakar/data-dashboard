import { percentChange } from "@/lib/aggregate";
import { formatDate } from "@/lib/dates";
import { formatAed, formatInt, formatPercent } from "@/lib/format";
import type { KpiComparison } from "@/lib/types";
import { cardClass } from "./styles";

interface TileProps {
  label: string;
  value: string;
  /** Change as a fraction (or percentage points / 100 for rates); null when no comparison is possible. */
  change: number | null;
  unit: "percent" | "points";
  /** Whether an increase is good news. */
  higherIsBetter: boolean;
}

function Tile({ label, value, change, unit, higherIsBetter }: TileProps) {
  let delta: React.ReactNode;
  if (change === null) {
    delta = <span className="text-muted">No previous-period data</span>;
  } else {
    const rounded = Math.round(Math.abs(change) * 1000) / 10;
    const direction = rounded === 0 ? "flat" : change > 0 ? "up" : "down";
    const good = direction === "flat" ? null : (direction === "up") === higherIsBetter;
    const amount = unit === "points" ? `${rounded.toFixed(1)} pts` : `${rounded.toFixed(1)}%`;
    const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "▬";
    delta = (
      <>
        <span className={good === null ? "text-muted" : good ? "text-good" : "text-bad"}>
          <span aria-hidden="true">{arrow} </span>
          <span className="font-semibold">{amount}</span>
          <span className="sr-only">{direction === "flat" ? "no change" : direction}</span>
        </span>
        <span className="text-muted"> vs previous period</span>
      </>
    );
  }
  return (
    <div className={`${cardClass} p-4`}>
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.65rem]">{value}</dd>
      <dd className="mt-1 text-sm">{delta}</dd>
    </div>
  );
}

export function KpiTiles({ kpis }: { kpis: KpiComparison }) {
  const { current, previous, previousRange } = kpis;
  const rateChange =
    current.renewalRate !== null && previous?.renewalRate != null ? current.renewalRate - previous.renewalRate : null;

  return (
    <section aria-labelledby="kpi-heading">
      <h2 id="kpi-heading" className="sr-only">
        Key metrics
      </h2>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Total premium"
          value={formatAed(current.totalPremium)}
          change={percentChange(current.totalPremium, previous?.totalPremium ?? null)}
          unit="percent"
          higherIsBetter
        />
        <Tile
          label="Renewal rate"
          value={current.renewalRate === null ? "n/a" : formatPercent(current.renewalRate)}
          change={rateChange}
          unit="points"
          higherIsBetter
        />
        <Tile
          label="Lapsed policies"
          value={formatInt(current.lapsed)}
          change={percentChange(current.lapsed, previous?.lapsed ?? null)}
          unit="percent"
          higherIsBetter={false}
        />
        <Tile
          label="Average premium"
          value={current.avgPremium === null ? "n/a" : formatAed(current.avgPremium)}
          change={percentChange(current.avgPremium, previous?.avgPremium ?? null)}
          unit="percent"
          higherIsBetter
        />
      </dl>
      <p className="mt-2 text-xs text-muted">
        {previous
          ? `Compared with ${formatDate(previousRange.from)} to ${formatDate(previousRange.to)}. `
          : "The previous period starts before the data set, so there is nothing to compare with. "}
        Renewal rate = renewed / (renewed + lapsed); pending policies are excluded.
      </p>
    </section>
  );
}
