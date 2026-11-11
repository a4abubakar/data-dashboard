import { describe, expect, it } from "vitest";
import { SAMPLE } from "@/test/fixtures";
import {
  buildTimeSeries,
  compareKpis,
  computeKpis,
  filterRenewals,
  groupBy,
  percentChange,
  previousRange,
  totalsBy,
} from "./aggregate";
import { LINES_OF_BUSINESS, type Filters } from "./types";

const base: Pick<Filters, "from" | "to" | "lob" | "channel" | "region" | "status" | "q"> = {
  from: "2026-09-01",
  to: "2026-10-31",
  lob: [],
  channel: null,
  region: null,
  status: null,
  q: "",
};

describe("computeKpis", () => {
  it("sums premium, counts lapses and excludes pending from the renewal rate", () => {
    const kpis = computeKpis(SAMPLE);
    expect(kpis.count).toBe(5);
    expect(kpis.totalPremium).toBe(10_300);
    expect(kpis.lapsed).toBe(2);
    expect(kpis.avgPremium).toBe(2060);
    // 2 renewed / (2 renewed + 2 lapsed); the pending row is ignored
    expect(kpis.renewalRate).toBe(0.5);
  });

  it("returns nulls instead of NaN for an empty selection", () => {
    expect(computeKpis([])).toEqual({ count: 0, totalPremium: 0, renewalRate: null, lapsed: 0, avgPremium: null });
  });
});

describe("filterRenewals", () => {
  it("applies date, multi-select line of business, status and text search together", () => {
    expect(filterRenewals(SAMPLE, { ...base, from: "2026-09-10", to: "2026-10-10" }).map((r) => r.id)).toEqual(["B", "C", "D"]);
    expect(filterRenewals(SAMPLE, { ...base, lob: ["Motor", "Travel"] }).map((r) => r.id)).toEqual(["A", "D", "E"]);
    expect(filterRenewals(SAMPLE, { ...base, status: "Lapsed", region: "Abu Dhabi" }).map((r) => r.id)).toEqual(["E"]);
    expect(filterRenewals(SAMPLE, { ...base, q: "  haddad " }).map((r) => r.id)).toEqual(["A"]);
  });
});

describe("period comparison", () => {
  it("uses the equally long period directly before the range", () => {
    expect(previousRange("2026-09-01", "2026-09-30")).toEqual({ from: "2026-08-02", to: "2026-08-31" });
  });

  it("compares against the previous period under the same filters", () => {
    const result = compareKpis(SAMPLE, { ...base, from: "2026-10-01", to: "2026-10-31" });
    expect(result.current.totalPremium).toBe(1800); // D + E
    expect(result.previous?.totalPremium).toBe(8500); // A + B + C, 1 Sep to 30 Sep
    expect(percentChange(result.current.totalPremium, result.previous!.totalPremium)).toBeCloseTo(-0.788, 3);
  });

  it("has no comparison when the previous period starts before the data set", () => {
    expect(compareKpis(SAMPLE, { ...base, from: "2025-11-01", to: "2026-10-31" }).previous).toBeNull();
  });

  it("does not divide by zero or compare with nothing", () => {
    expect(percentChange(5, 0)).toBeNull();
    expect(percentChange(5, null)).toBeNull();
    expect(percentChange(null, 5)).toBeNull();
  });
});

describe("grouping", () => {
  it("groupBy buckets items by key", () => {
    const groups = groupBy(SAMPLE, (r) => r.lob);
    expect(groups.get("Motor")?.map((r) => r.id)).toEqual(["A", "D"]);
    expect(groups.has("Bike")).toBe(false);
  });

  it("totalsBy returns every category in order, with zeros for the empty ones", () => {
    const totals = totalsBy(SAMPLE, (r) => r.lob, LINES_OF_BUSINESS);
    expect(totals.map((t) => t.key)).toEqual([...LINES_OF_BUSINESS]);
    expect(totals.find((t) => t.key === "Motor")).toEqual({ key: "Motor", count: 2, premium: 3500 });
    expect(totals.find((t) => t.key === "Bike")).toEqual({ key: "Bike", count: 0, premium: 0 });
  });
});

describe("buildTimeSeries", () => {
  it("fills empty weeks and counts statuses per bucket", () => {
    const { granularity, points } = buildTimeSeries(SAMPLE, "2026-09-01", "2026-10-31");
    expect(granularity).toBe("week");
    // Mondays from 31 Aug to 26 Oct = 9 buckets, whether or not they have rows
    expect(points).toHaveLength(9);
    expect(points[0]).toEqual({ date: "2026-08-31", Renewed: 1, Lapsed: 0, Pending: 0 });
    expect(points.reduce((s, p) => s + p.Renewed + p.Lapsed + p.Pending, 0)).toBe(5);
  });

  it("switches granularity with the length of the range", () => {
    expect(buildTimeSeries([], "2026-10-01", "2026-10-31").granularity).toBe("day");
    expect(buildTimeSeries([], "2025-11-01", "2026-10-31").granularity).toBe("month");
  });
});
