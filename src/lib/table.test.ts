import { describe, expect, it } from "vitest";
import { SAMPLE } from "@/test/fixtures";
import { nextSort, paginate, sortRows } from "./table";

describe("sortRows", () => {
  it("sorts numbers numerically and text case-insensitively, without mutating the input", () => {
    const copy = [...SAMPLE];
    expect(sortRows(SAMPLE, "premium", "desc").map((r) => r.id)).toEqual(["B", "A", "D", "C", "E"]);
    expect(sortRows(SAMPLE, "customer", "asc").map((r) => r.customer)).toEqual([
      "Layla Haddad",
      "Marcus Hughes",
      "Omar Rahman",
      "Priya Nair",
      "Sana Malik",
    ]);
    expect(SAMPLE).toEqual(copy);
  });

  it("breaks ties by id so pages are stable", () => {
    // B and E are Lapsed, A and C are Renewed; within a status the id decides, in both directions
    expect(sortRows(SAMPLE, "status", "asc").map((r) => r.id)).toEqual(["B", "E", "D", "A", "C"]);
    expect(sortRows(SAMPLE, "status", "desc").map((r) => r.id)).toEqual(["A", "C", "D", "B", "E"]);
  });
});

describe("nextSort", () => {
  it("flips direction on the active column and picks a sensible default on a new one", () => {
    expect(nextSort({ sort: "customer", dir: "asc" }, "customer")).toEqual({ sort: "customer", dir: "desc" });
    expect(nextSort({ sort: "customer", dir: "desc" }, "customer")).toEqual({ sort: "customer", dir: "asc" });
    expect(nextSort({ sort: "customer", dir: "asc" }, "region")).toEqual({ sort: "region", dir: "asc" });
    expect(nextSort({ sort: "customer", dir: "asc" }, "premium")).toEqual({ sort: "premium", dir: "desc" });
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1);

  it("slices a page and reports totals", () => {
    const page = paginate(items, 3, 10);
    expect(page.rows).toEqual([21, 22, 23]);
    expect(page).toMatchObject({ total: 23, page: 3, pageCount: 3, pageSize: 10 });
  });

  it("clamps out-of-range pages and handles empty input", () => {
    expect(paginate(items, 99, 10).page).toBe(3);
    expect(paginate(items, 0, 10).page).toBe(1);
    expect(paginate([], 4, 10)).toEqual({ rows: [], total: 0, page: 1, pageCount: 1, pageSize: 10 });
  });
});
