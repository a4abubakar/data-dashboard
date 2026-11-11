import { addDays, addMonths, daysInRange } from "./dates";
import { createRng } from "./prng";
import {
  CHANNELS,
  LINES_OF_BUSINESS,
  REGIONS,
  type Channel,
  type LineOfBusiness,
  type Renewal,
  type Status,
} from "./types";

/** The data set covers exactly 12 months; "as of" is the last day. */
export const DATA_FROM = "2025-11-01";
export const DATA_TO = "2026-10-31";
export const DEFAULT_SEED = 20_261_031;
export const DEFAULT_COUNT = 2000;

const FIRST_NAMES = [
  "Omar", "Layla", "Yusuf", "Mariam", "Hamza", "Noor", "Tariq", "Salma", "Rashid", "Huda",
  "Ahmed", "Fatima", "Imran", "Ayesha", "Bilal", "Sana", "Kareem", "Dina", "Zaid", "Rania",
  "Arjun", "Priya", "Rohan", "Meera", "Vikram", "Anita", "Daniel", "Sophie", "Marcus", "Elena",
  "Liam", "Chloe", "Mateo", "Ines", "Tomas", "Hana", "Nikolai", "Alina", "Samuel", "Grace",
];
const LAST_NAMES = [
  "Haddad", "Rahman", "Khoury", "Siddiqui", "Mansour", "Qureshi", "Nasser", "Farouk", "Sheikh", "Malik",
  "Iyer", "Nair", "Menon", "Kapoor", "Reddy", "Bhatt", "Fernandes", "Dsouza", "Carter", "Bennett",
  "Hughes", "Walsh", "Novak", "Petrov", "Santos", "Moreau", "Larsen", "Weber", "Costa", "Okafor",
  "Tanaka", "Almeida", "Hassan", "Zaman", "Aziz", "Baig", "Chaudhry", "Dar", "Gill", "Lodhi",
];

const LOB_WEIGHTS = [0.34, 0.22, 0.09, 0.14, 0.12, 0.09]; // Motor, Health, Pet, Travel, Home, Bike
const CHANNEL_WEIGHTS = [0.33, 0.22, 0.27, 0.18]; // Email, WhatsApp, Web, Agent
const REGION_WEIGHTS = [0.46, 0.24, 0.15, 0.15];
const MONTH_WEIGHTS = [1.0, 1.15, 0.9, 0.95, 0.9, 1.0, 1.05, 1.0, 1.1, 1.0, 0.95, 1.1]; // Nov..Oct

/** AED annual premium range per line of business. */
const PREMIUM_RANGE: Record<LineOfBusiness, [number, number]> = {
  Motor: [1200, 4500],
  Health: [2500, 9000],
  Pet: [300, 1100],
  Travel: [150, 900],
  Home: [400, 1800],
  Bike: [300, 1200],
};

const LOB_RENEWAL_BIAS: Record<LineOfBusiness, number> = {
  Motor: 0.02, Health: 0.04, Pet: -0.06, Travel: -0.1, Home: 0, Bike: -0.03,
};
const CHANNEL_RENEWAL_BASE: Record<Channel, number> = {
  Agent: 0.86, WhatsApp: 0.78, Email: 0.72, Web: 0.68,
};

/**
 * Deterministic mock renewals: same seed and count give identical output on every run and machine.
 * Renewal likelihood depends on channel, line of business, region and a gentle upward trend over the year,
 * so the charts have something to say. Renewals in the last three weeks are increasingly "Pending".
 */
export function generateRenewals(seed = DEFAULT_SEED, count = DEFAULT_COUNT): Renewal[] {
  const rng = createRng(seed);
  const months = Array.from({ length: 12 }, (_, i) => i);
  const rows: Omit<Renewal, "id">[] = [];

  for (let i = 0; i < count; i++) {
    const monthIndex = rng.weighted(months, MONTH_WEIGHTS);
    const monthStart = addMonths(DATA_FROM, monthIndex);
    const monthLength = daysInRange(monthStart, addDays(addMonths(monthStart, 1), -1));
    const renewalDate = addDays(monthStart, rng.int(0, monthLength - 1));

    const lob = rng.weighted(LINES_OF_BUSINESS, LOB_WEIGHTS);
    const channel = rng.weighted(CHANNELS, CHANNEL_WEIGHTS);
    const region = rng.weighted(REGIONS, REGION_WEIGHTS);

    const [min, max] = PREMIUM_RANGE[lob];
    const premium = Math.round(min + (max - min) * Math.pow(rng.next(), 1.6));

    const daysFromEnd = daysInRange(renewalDate, DATA_TO) - 1;
    const pendingChance = daysFromEnd < 21 ? 0.05 + 0.7 * (1 - daysFromEnd / 21) : 0;
    const trend = (monthIndex / 11) * 0.06 - (monthIndex === 4 ? 0.05 : 0); // improving, with a dip in March
    const renewChance = Math.min(
      0.97,
      CHANNEL_RENEWAL_BASE[channel] + LOB_RENEWAL_BIAS[lob] + (region === "Dubai" ? 0.02 : 0) + trend,
    );

    let status: Status;
    if (rng.next() < pendingChance) status = "Pending";
    else status = rng.next() < renewChance ? "Renewed" : "Lapsed";

    const customer = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
    rows.push({ customer, lob, channel, status, premium, renewalDate, region });
  }

  rows.sort((a, b) => (a.renewalDate < b.renewalDate ? -1 : a.renewalDate > b.renewalDate ? 1 : 0));
  return rows.map((row, i) => ({ id: `RN-${String(i + 1).padStart(5, "0")}`, ...row }));
}
