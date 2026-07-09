// Presentation-layer formatting helpers, shared across components and unit-tested.

import type { CheckStatus } from "./analysis/types";

/** Format an R-multiple with an explicit sign, e.g. "+0.098R" or "-0.231R". */
export function formatR(v: number): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(3)}R`;
}

/** Format an account-currency amount with a leading sign and thousands separators. */
export function formatCurrency(v: number): string {
  const sign = v < 0 ? "-" : "";
  return `${sign}${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/** Format a 0..1 ratio as a whole-number percentage, e.g. "52%". */
export function formatPercent(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}

/** The glyph used to mark a check's status. */
export function checkMark(status: CheckStatus): string {
  return status === "pass" ? "✓" : status === "warn" ? "!" : "✕";
}
