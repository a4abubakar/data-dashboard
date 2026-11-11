import { describe, expect, it } from "vitest";
import { DATA_FROM, DATA_TO } from "./generate-data";
import { defaultRange, filtersToSearchParams, hasActiveFilters, parseFilters } from "./params";

describe("parseFilters", () => {
  it("falls back to the last 90 days and sensible defaults with no params", () => {
    const f = parseFilters(new URLSearchParams());
    expect(f).toMatchObject({
      to: DATA_TO,
      lob: [],
      channel: null,
      region: null,
      status: null,
      q: "",
      sort: "renewalDate",
      dir: "desc",
      page: 1,
      pageSize: 10,
    });
    expect(f.from).toBe("2026-08-03");
    expect(hasActiveFilters(f)).toBe(false);
  });

  it("reads multi-select line of business from commas or repeated params, in canonical order", () => {
    expect(parseFilters(new URLSearchParams("lob=Pet,Motor")).lob).toEqual(["Motor", "Pet"]);
    expect(parseFilters(new URLSearchParams("lob=Pet&lob=Health")).lob).toEqual(["Health", "Pet"]);
  });

  it("accepts the Next.js searchParams object shape", () => {
    expect(parseFilters({ channel: "Web", lob: ["Motor", "Bike"], page: "3" })).toMatchObject({
      channel: "Web",
      lob: ["Motor", "Bike"],
      page: 3,
    });
  });

  it("ignores junk instead of throwing", () => {
    const f = parseFilters(
      new URLSearchParams("from=nope&to=2026-02-31&lob=Boat&channel=Fax&status=x&sort=password&dir=up&page=-4&pageSize=7"),
    );
    expect(f.from).toBe(defaultRange().from);
    expect(f.to).toBe(DATA_TO);
    expect(f).toMatchObject({ lob: [], channel: null, status: null, sort: "renewalDate", dir: "desc", page: 1, pageSize: 10 });
  });

  it("clamps dates to the data window and swaps a reversed range", () => {
    expect(parseFilters(new URLSearchParams("from=2020-01-01&to=2030-01-01"))).toMatchObject({ from: DATA_FROM, to: DATA_TO });
    expect(parseFilters(new URLSearchParams("from=2026-06-30&to=2026-06-01"))).toMatchObject({ from: "2026-06-01", to: "2026-06-30" });
  });

  it("trims and caps the search text", () => {
    expect(parseFilters(new URLSearchParams("q=%20%20omar%20")).q).toBe("omar");
    expect(parseFilters(new URLSearchParams(`q=${"x".repeat(200)}`)).q).toHaveLength(80);
  });
});

describe("filtersToSearchParams", () => {
  it("omits defaults so a pristine dashboard has a clean URL", () => {
    expect(filtersToSearchParams(parseFilters(new URLSearchParams())).toString()).toBe("");
  });

  it("round-trips non-default state", () => {
    const qs = "from=2026-01-01&to=2026-03-31&lob=Motor%2CPet&channel=Agent&status=Lapsed&q=omar&sort=premium&dir=asc&page=2&pageSize=25";
    const parsed = parseFilters(new URLSearchParams(qs));
    expect(filtersToSearchParams(parsed).toString()).toBe(qs);
    expect(hasActiveFilters(parsed)).toBe(true);
  });
});
