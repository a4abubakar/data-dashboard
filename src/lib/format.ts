const aed = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
});
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("en-US");

export const formatAed = (value: number) => aed.format(value);
export const formatCompact = (value: number) => compact.format(value);
export const formatInt = (value: number) => integer.format(value);
export const formatPercent = (ratio: number, digits = 1) => `${(ratio * 100).toFixed(digits)}%`;
