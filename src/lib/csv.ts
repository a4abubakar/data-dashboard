import type { Renewal } from "./types";

const HEADERS = ["ID", "Customer", "Line of business", "Channel", "Region", "Status", "Premium (AED)", "Renewal date"];

/** Quotes a cell, doubling quotes, and neutralises spreadsheet formula injection (= + - @ at the start). */
export function escapeCsvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: readonly Renewal[]): string {
  const lines = rows.map((r) =>
    [r.id, r.customer, r.lob, r.channel, r.region, r.status, r.premium, r.renewalDate].map(escapeCsvCell).join(","),
  );
  return [HEADERS.join(","), ...lines].join("\r\n") + "\r\n";
}

