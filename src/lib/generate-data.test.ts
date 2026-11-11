import { describe, expect, it } from "vitest";
import { escapeCsvCell, toCsv } from "./csv";
import { DATA_FROM, DATA_TO, generateRenewals } from "./generate-data";
import { CHANNELS, LINES_OF_BUSINESS, REGIONS, STATUSES } from "./types";
import { SAMPLE } from "@/test/fixtures";

describe("generateRenewals", () => {
  const rows = generateRenewals();

  it("is deterministic: same seed, same data; different seed, different data", () => {
    expect(generateRenewals()).toEqual(rows);
    expect(generateRenewals(1)).not.toEqual(rows);
  });

  it("produces about 2,000 valid records inside the 12-month window with unique ids", () => {
    expect(rows).toHaveLength(2000);
    expect(new Set(rows.map((r) => r.id)).size).toBe(2000);
    for (const r of rows) {
      expect(r.renewalDate >= DATA_FROM && r.renewalDate <= DATA_TO).toBe(true);
      expect(LINES_OF_BUSINESS).toContain(r.lob);
      expect(CHANNELS).toContain(r.channel);
      expect(REGIONS).toContain(r.region);
      expect(STATUSES).toContain(r.status);
      expect(r.premium).toBeGreaterThan(0);
    }
  });

  it("uses every category so each filter has something to show", () => {
    expect(new Set(rows.map((r) => r.lob)).size).toBe(LINES_OF_BUSINESS.length);
    expect(new Set(rows.map((r) => r.channel)).size).toBe(CHANNELS.length);
    expect(new Set(rows.map((r) => r.status)).size).toBe(STATUSES.length);
  });
});

describe("csv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(escapeCsvCell('He said "hi", then left')).toBe('"He said ""hi"", then left"');
    expect(escapeCsvCell("plain")).toBe("plain");
  });

  it("neutralises spreadsheet formulas", () => {
    expect(escapeCsvCell("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
  });

  it("writes a header plus one line per row", () => {
    const lines = toCsv(SAMPLE.slice(0, 2)).trimEnd().split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("ID,Customer,Line of business,Channel,Region,Status,Premium (AED),Renewal date");
    expect(lines[1]).toBe("A,Layla Haddad,Motor,Email,Dubai,Renewed,2000,2026-09-02");
  });
});
