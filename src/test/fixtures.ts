import type { Renewal } from "@/lib/types";

/** Tiny hand-written data set for tests: easy to compute expected values by hand. */
export function renewal(overrides: Partial<Renewal> & Pick<Renewal, "id">): Renewal {
  return {
    customer: "Test Customer",
    lob: "Motor",
    channel: "Email",
    status: "Renewed",
    premium: 1000,
    renewalDate: "2026-09-10",
    region: "Dubai",
    ...overrides,
  };
}

export const SAMPLE: Renewal[] = [
  renewal({ id: "A", customer: "Layla Haddad", lob: "Motor", status: "Renewed", premium: 2000, renewalDate: "2026-09-02" }),
  renewal({ id: "B", customer: "Omar Rahman", lob: "Health", status: "Lapsed", premium: 6000, renewalDate: "2026-09-15", channel: "Web" }),
  renewal({ id: "C", customer: "Priya Nair", lob: "Pet", status: "Renewed", premium: 500, renewalDate: "2026-09-20", region: "Sharjah" }),
  renewal({ id: "D", customer: "Marcus Hughes", lob: "Motor", status: "Pending", premium: 1500, renewalDate: "2026-10-05", channel: "Agent" }),
  renewal({ id: "E", customer: "Sana Malik", lob: "Travel", status: "Lapsed", premium: 300, renewalDate: "2026-10-28", region: "Abu Dhabi" }),
];
