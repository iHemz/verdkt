// Pure statistical primitives used by the edge analysis. Side-effect-free and
// individually unit-tested.

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

/** Sample standard deviation (n-1 denominator). */
export function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

/** Standard normal CDF via the Abramowitz & Stegun 7.1.26 approximation. */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}

/** Two-sided p-value for a mean differing from zero (normal approximation to t). */
export function twoSidedP(tStat: number): number {
  return 2 * (1 - normalCdf(Math.abs(tStat)));
}

/** One-sample t-statistic of a series' mean against zero. */
export function tStatistic(xs: number[]): number {
  const sd = stdev(xs);
  if (sd === 0 || xs.length < 2) return 0;
  return mean(xs) / (sd / Math.sqrt(xs.length));
}

/** Running cumulative sum. */
export function cumulative(xs: number[]): number[] {
  const out: number[] = [];
  let acc = 0;
  for (const x of xs) {
    acc += x;
    out.push(acc);
  }
  return out;
}

/** Most negative peak-to-trough drawdown of an equity curve (<= 0). */
export function maxDrawdown(curve: number[]): number {
  let peak = 0;
  let maxDd = 0;
  for (const v of curve) {
    if (v > peak) peak = v;
    const dd = v - peak;
    if (dd < maxDd) maxDd = dd;
  }
  return maxDd;
}
