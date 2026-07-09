// Edge attribution: break the result down by the dimensions present in the log
// (symbol, direction, day of week, hour block) and report which slices carry
// it. This is DESCRIPTIVE, never causal — it says which buckets hold the edge
// in this sample, not why the signal works.
//
// The honest hazard here is multiple testing: slice enough ways and some bucket
// always looks brilliant by luck. So a segment is only called a "carrier" when
// it is both large enough (>= SEGMENT_MIN) and statistically separable from
// zero at ALPHA. Everything thin is labelled thin.

import {
  ALPHA,
  SEGMENT_COVERAGE,
  SEGMENT_MIN,
  type DimensionAttribution,
  type SegmentStat,
  type Trade,
} from "./types";
import { mean, tStatistic, twoSidedP } from "./stats";

/** Accessor for one grouping dimension. Returns undefined when a trade has no value for it. */
type Dimension = {
  key: string;
  label: string;
  valueOf: (t: Trade) => string | undefined;
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function hourBlock(hour: number): string {
  if (hour < 6) return "00:00–06:00";
  if (hour < 12) return "06:00–12:00";
  if (hour < 18) return "12:00–18:00";
  return "18:00–24:00";
}

const DIMENSIONS: Dimension[] = [
  { key: "symbol", label: "Symbol", valueOf: (t) => t.symbol },
  { key: "side", label: "Direction", valueOf: (t) => t.side },
  {
    key: "weekday",
    label: "Day of week",
    valueOf: (t) => (t.date !== undefined ? WEEKDAYS[new Date(t.date).getUTCDay()] : undefined),
  },
  {
    key: "hour",
    label: "Hour block (by timestamp)",
    valueOf: (t) => (t.date !== undefined ? hourBlock(new Date(t.date).getUTCHours()) : undefined),
  },
];

/** Max segments to show per dimension; the rest are folded into "Other". */
const MAX_SEGMENTS = 8;

function segmentRole(n: number, expectancyR: number, robust: boolean): SegmentStat["role"] {
  if (!robust) return "thin";
  return expectancyR >= 0 ? "carrier" : "drag";
}

function buildDimension(
  dim: Dimension,
  trades: Trade[],
  rSeries: number[],
): DimensionAttribution | null {
  // Gather (value -> R list), skipping trades with no value on this dimension.
  const groups = new Map<string, number[]>();
  let labelled = 0;
  for (let i = 0; i < trades.length; i++) {
    const v = dim.valueOf(trades[i]);
    if (v === undefined || v === "") continue;
    labelled++;
    const arr = groups.get(v) ?? [];
    arr.push(rSeries[i]);
    groups.set(v, arr);
  }

  // Need enough coverage and at least two categories to be worth showing.
  if (labelled < trades.length * SEGMENT_COVERAGE) return null;
  if (groups.size < 2) return null;

  let segments: SegmentStat[] = [...groups.entries()].map(([label, rs]) => {
    const n = rs.length;
    const expectancyR = mean(rs);
    const wins = rs.filter((r) => r > 0).length;
    const decided = wins + rs.filter((r) => r < 0).length;
    const totalR = rs.reduce((a, b) => a + b, 0);
    const robust = n >= SEGMENT_MIN && twoSidedP(tStatistic(rs)) < ALPHA;
    return {
      label,
      n,
      expectancyR,
      winRate: decided ? wins / decided : 0,
      totalR,
      share: n / labelled,
      robust,
      role: segmentRole(n, expectancyR, robust),
    };
  });

  // Rank by contribution to the bottom line (absolute total R), biggest first.
  segments.sort((a, b) => Math.abs(b.totalR) - Math.abs(a.totalR));

  // Fold the long tail into a single "Other" bucket so the view stays readable.
  if (segments.length > MAX_SEGMENTS) {
    const head = segments.slice(0, MAX_SEGMENTS - 1);
    const tail = segments.slice(MAX_SEGMENTS - 1);
    const n = tail.reduce((s, x) => s + x.n, 0);
    const totalR = tail.reduce((s, x) => s + x.totalR, 0);
    head.push({
      label: `Other (${tail.length})`,
      n,
      expectancyR: n ? totalR / n : 0,
      winRate: 0,
      totalR,
      share: n / labelled,
      robust: false,
      role: "thin",
    });
    segments = head;
  }

  const insight = deriveInsight(dim.label, segments);
  return { key: dim.key, label: dim.label, segments, insight };
}

/**
 * Headline only when a single robust segment carries most of the positive R.
 * Deliberately conservative: no insight on thin or evenly-spread dimensions.
 */
function deriveInsight(label: string, segments: SegmentStat[]): string | undefined {
  const grossPositive = segments
    .filter((s) => s.totalR > 0)
    .reduce((sum, s) => sum + s.totalR, 0);
  if (grossPositive <= 0) return undefined;

  const top = segments.find((s) => s.role === "carrier");
  if (!top || top.totalR <= 0) return undefined;

  const share = top.totalR / grossPositive;
  if (share < 0.5) return undefined;

  return `${Math.round(share * 100)}% of the positive R in your log comes from ${label.toLowerCase()} = ${top.label}.`;
}

/**
 * Build attribution across every dimension the log supports. `rSeries` must be
 * index-aligned with `trades` (same order the analysis used).
 */
export function buildAttribution(trades: Trade[], rSeries: number[]): DimensionAttribution[] {
  const out: DimensionAttribution[] = [];
  for (const dim of DIMENSIONS) {
    const built = buildDimension(dim, trades, rSeries);
    if (built) out.push(built);
  }
  return out;
}
