import { generateRenewals } from "./generate-data";
import type { Renewal } from "./types";

const globalStore = globalThis as unknown as { __renewals?: Renewal[] };

/** Generated once per server process; the generator is deterministic so there is nothing to persist. */
export function getRenewals(): Renewal[] {
  globalStore.__renewals ??= generateRenewals();
  return globalStore.__renewals;
}
