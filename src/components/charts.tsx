"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAed, formatCompact, formatInt, formatPercent } from "@/lib/format";
import {
  bucketLabel,
  bucketLongLabel,
  channelSummary,
  lobSummary,
  timeSeriesSummary,
} from "@/lib/summaries";
import type { Channel, Granularity, GroupTotal, LineOfBusiness, TimePoint } from "@/lib/types";
import { ChartCard, DataTableSimple } from "./chart-card";

const axisTick = { fill: "var(--chart-axis)", fontSize: 12 };
const tooltipStyles = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--foreground)",
    fontSize: 13,
  },
  itemStyle: { color: "var(--foreground)" },
  labelStyle: { color: "var(--foreground)", fontWeight: 600 },
  cursor: { fill: "var(--surface-muted)", fillOpacity: 0.6 },
} as const;

const STATUS_SERIES = [
  { key: "Renewed", color: "var(--chart-renewed)" },
  { key: "Lapsed", color: "var(--chart-lapsed)" },
  { key: "Pending", color: "var(--chart-pending)" },
] as const;

const CHANNEL_COLORS: Record<Channel, string> = {
  Email: "var(--chart-ch-1)",
  WhatsApp: "var(--chart-ch-2)",
  Web: "var(--chart-ch-3)",
  Agent: "var(--chart-ch-4)",
};

function Legend({ items }: { items: { label: string; color: string; detail?: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded-sm" style={{ background: item.color }} />
          <span>{item.label}</span>
          {item.detail && <span className="text-muted tabular-nums">{item.detail}</span>}
        </li>
      ))}
    </ul>
  );
}

function NoData() {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-lg bg-surface-muted text-sm text-muted">
      No data for these filters
    </div>
  );
}

export function RenewalsOverTimeChart({
  points,
  granularity,
}: {
  points: TimePoint[];
  granularity: Granularity;
}) {
  const empty = points.every((p) => p.Renewed + p.Lapsed + p.Pending === 0);
  return (
    <ChartCard
      title="Renewals over time"
      summary={timeSeriesSummary(points, granularity)}
      className="lg:col-span-2"
      table={
        <DataTableSimple
          caption={`Renewals by ${granularity} and status`}
          headers={[granularity === "month" ? "Month" : granularity === "week" ? "Week starting" : "Day", "Renewed", "Lapsed", "Pending"]}
          rows={points.map((p) => [bucketLongLabel(p.date, granularity).replace("Week of ", ""), p.Renewed, p.Lapsed, p.Pending])}
        />
      }
    >
      {empty ? (
        <NoData />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} accessibilityLayer={false}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: "var(--chart-grid)" }}
                tickFormatter={(d: string) => bucketLabel(d, granularity)}
                minTickGap={24}
              />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
              <Tooltip
                {...tooltipStyles}
                labelFormatter={(d) => bucketLongLabel(String(d), granularity)}
                formatter={(value) => formatInt(Number(value))}
              />
              {STATUS_SERIES.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stackId="status"
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.35}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
          <Legend items={STATUS_SERIES.map((s) => ({ label: s.key, color: s.color }))} />
        </>
      )}
    </ChartCard>
  );
}

export function PremiumByLobChart({ data }: { data: GroupTotal<LineOfBusiness>[] }) {
  const sorted = [...data].sort((a, b) => b.premium - a.premium);
  const empty = sorted.every((d) => d.premium === 0);
  return (
    <ChartCard
      title="Premium by line of business"
      summary={lobSummary(data)}
      table={
        <DataTableSimple
          caption="Premium and renewals by line of business"
          headers={["Line of business", "Renewals", "Premium (AED)"]}
          rows={sorted.map((d) => [d.key, formatInt(d.count), formatInt(d.premium)])}
        />
      }
    >
      {empty ? (
        <NoData />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 64, bottom: 0, left: 0 }} accessibilityLayer={false}>
            <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
            <XAxis
              type="number"
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCompact(v)}
            />
            <YAxis type="category" dataKey="key" tick={axisTick} tickLine={false} axisLine={false} width={60} />
            <Tooltip {...tooltipStyles} formatter={(value) => formatAed(Number(value))} />
            <Bar dataKey="premium" name="Premium" fill="var(--chart-bar)" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              <LabelList
                dataKey="premium"
                position="right"
                formatter={(v) => formatCompact(Number(v))}
                style={{ fill: "var(--foreground)", fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function ChannelSplitChart({ data }: { data: GroupTotal<Channel>[] }) {
  const sum = data.reduce((s, d) => s + d.count, 0);
  return (
    <ChartCard
      title="Renewals by channel"
      summary={channelSummary(data)}
      table={
        <DataTableSimple
          caption="Renewals by channel"
          headers={["Channel", "Renewals", "Share"]}
          rows={data.map((d) => [d.key, formatInt(d.count), sum ? formatPercent(d.count / sum) : "0.0%"])}
        />
      }
    >
      {sum === 0 ? (
        <NoData />
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart accessibilityLayer={false}>
                <Tooltip {...tooltipStyles} formatter={(value) => formatInt(Number(value))} />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="key"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={2}
                  stroke="var(--surface)"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {data.map((d) => (
                    <Cell key={d.key} fill={CHANNEL_COLORS[d.key]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-semibold tabular-nums">{formatInt(sum)}</span>
              <span className="text-xs text-muted">renewals</span>
            </div>
          </div>
          <Legend
            items={data.map((d) => ({
              label: d.key,
              color: CHANNEL_COLORS[d.key],
              detail: `${formatPercent(d.count / sum, 0)}`,
            }))}
          />
        </>
      )}
    </ChartCard>
  );
}
