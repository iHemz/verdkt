// Log-only diagnostics (Tier A): what to fix, from the trade log alone. Pure and
// unit-tested. Richer broker exports (prices, SL/TP, times, volume) unlock more
// findings; bare P&L logs degrade to the subset that is still computable.

import type { Analysis, Trade } from "@/lib/analysis";
import { mean } from "@/lib/analysis/stats";
import type { Diagnosis, Leak } from "./types";

const MIN_TRADES = 20;
const COVERAGE = 0.6;

const fmtR = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(3)}R`;

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function dur(ms: number): string {
  const min = ms / 60000;
  if (min < 90) return `${Math.round(min)} min`;
  const h = min / 60;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} days`;
}

function covers(trades: Trade[], has: (t: Trade) => boolean): Trade[] | null {
  const kept = trades.filter(has);
  if (kept.length < MIN_TRADES || kept.length / trades.length < COVERAGE) return null;
  return kept;
}

/** Upside-down risk:reward at the given win rate. Strong, log-only. */
function payoffTrap(a: Analysis): Leak | null {
  if (a.n < MIN_TRADES || a.winRate <= 0 || a.winRate >= 1) return null;
  const breakeven = (1 - a.winRate) / a.winRate;
  if (a.payoff >= breakeven || a.expectancyR >= 0) return null;
  return {
    key: "payoff-trap",
    severity: "bad",
    title: "Your risk:reward is upside down",
    detail: `You win ${(a.winRate * 100).toFixed(0)}% of the time, but your average loss (${fmtR(
      a.avgLoss,
    )}) is bigger than your average win (${fmtR(a.avgWin)}). At this win rate you need at least ${breakeven.toFixed(
      2,
    )}:1 on winners just to break even; you make ${a.payoff.toFixed(2)}:1.`,
    fix: "Bigger winners or tighter losers, not a higher win rate. Let winners run further, or cut losers sooner.",
  };
}

/** The single slice whose removal most improves expectancy (from attribution). */
function filterWorstSlice(a: Analysis): Leak | null {
  if (a.n < MIN_TRADES) return null;
  const base = a.expectancyR;
  let best: { dim: string; seg: string; newExp: number; gain: number; n: number; segExp: number } | null = null;

  for (const dim of a.attribution) {
    for (const seg of dim.segments) {
      if (seg.label.startsWith("Other")) continue;
      if (seg.n < 15 || seg.n >= a.n) continue;
      const newExp = (base * a.n - seg.totalR) / (a.n - seg.n);
      const gain = newExp - base;
      if (!best || gain > best.gain) {
        best = { dim: dim.label, seg: seg.label, newExp, gain, n: seg.n, segExp: seg.expectancyR };
      }
    }
  }

  if (!best || best.gain < 0.03 || best.segExp >= 0) return null;
  return {
    key: "filter-slice",
    severity: "warn",
    title: `Cut ${best.dim.toLowerCase()} = ${best.seg}`,
    detail: `${best.seg} (${best.n} trades) averages ${fmtR(best.segExp)} and drags the whole result down. Removing it lifts your expectancy (in-sample; forward-test before committing).`,
    fix: `Stop trading ${best.seg}, or find why it behaves differently.`,
    impact: `${fmtR(base)} -> ${fmtR(best.newExp)} per trade`,
  };
}

/** Holding losers longer than winners (needs open + close times). */
function holdAsymmetry(trades: Trade[]): Leak | null {
  const held = covers(
    trades,
    (t) => t.date !== undefined && t.closeTime !== undefined && t.closeTime > t.date,
  );
  if (!held) return null;
  const wins = held.filter((t) => t.pnl > 0).map((t) => t.closeTime! - t.date!);
  const losses = held.filter((t) => t.pnl < 0).map((t) => t.closeTime! - t.date!);
  if (wins.length < 5 || losses.length < 5) return null;

  const w = mean(wins);
  const l = mean(losses);
  if (w <= 0) return null;
  const ratio = l / w;
  if (ratio < 1.3) return null;
  return {
    key: "hold-asymmetry",
    severity: ratio >= 2 ? "bad" : "warn",
    title: "You hold losers longer than winners",
    detail: `Your losing trades run about ${ratio.toFixed(1)}x as long as your winners (${dur(
      l,
    )} vs ${dur(w)}). That is the classic "cut winners early, let losers run" pattern.`,
    fix: "Exit losers at your stop without hesitation, and give winners room to reach target.",
  };
}

/** Planned reward:risk (from SL/TP) far above what you actually achieve. */
function plannedVsAchievedRR(trades: Trade[], a: Analysis): Leak | null {
  const withPlan = covers(
    trades,
    (t) => !!t.entryPrice && !!t.stopLoss && !!t.takeProfit,
  );
  if (!withPlan) return null;
  const rrs = withPlan
    .map((t) => {
      const risk = Math.abs(t.entryPrice! - t.stopLoss!);
      const reward = Math.abs(t.takeProfit! - t.entryPrice!);
      return risk > 0 ? reward / risk : NaN;
    })
    .filter((x) => Number.isFinite(x) && x > 0);
  if (rrs.length < MIN_TRADES) return null;

  const planned = median(rrs);
  if (planned <= 1 || planned - a.payoff < 0.5) return null;
  return {
    key: "planned-rr",
    severity: "warn",
    title: "Your winners don't reach your targets",
    detail: `You set your stops and targets for about ${planned.toFixed(
      1,
    )}:1, but you actually achieve ${a.payoff.toFixed(
      2,
    )}:1. Either your targets are too far to be hit, or you close winners before they get there.`,
    fix: "Check how often price actually reaches your take-profit. If rarely, pull targets in; if often, stop closing early.",
  };
}

/** Sizing up after a loss (revenge trading), from volume. */
function revengeSizing(trades: Trade[]): Leak | null {
  const withVol = covers(trades, (t) => t.volume !== undefined && t.volume > 0);
  if (!withVol) return null;
  const med = median(withVol.map((t) => t.volume!));
  if (med <= 0) return null;

  const postLoss: number[] = [];
  for (let i = 1; i < trades.length; i++) {
    if (trades[i - 1].pnl < 0 && trades[i].volume !== undefined && trades[i].volume! > 0) {
      postLoss.push(trades[i].volume!);
    }
  }
  if (postLoss.length < 8) return null;
  const escalation = mean(postLoss) / med;
  if (escalation < 1.3) return null;
  return {
    key: "revenge-sizing",
    severity: escalation >= 1.8 ? "bad" : "warn",
    title: "You size up after losses",
    detail: `The trade right after a loss is on average ${Math.round(
      (escalation - 1) * 100,
    )}% bigger than your typical size. That is a revenge-trading signature, and it turns an ordinary drawdown into a blow-up.`,
    fix: "Size the trade after a loss exactly like any other. Fix your risk per trade first.",
  };
}

/** Earned kudos when the edge holds. */
function kudos(a: Analysis): Leak | null {
  if (a.verdict !== "EDGE HOLDS UP" && a.verdict !== "PROMISING BUT THIN") return null;
  return {
    key: "kudos",
    severity: "good",
    title: "This holds up",
    detail: `The verdict is ${a.verdict.toLowerCase()}. The temptation now is to over-optimise, don't. Confirm it survives realistic costs and forward-test before sizing up.`,
  };
}

const WEIGHT: Record<Leak["severity"], number> = { bad: 0, warn: 1, info: 2, good: 3 };

export function diagnose(trades: Trade[], analysis: Analysis): Diagnosis {
  const leaks = [
    payoffTrap(analysis),
    revengeSizing(trades),
    holdAsymmetry(trades),
    plannedVsAchievedRR(trades, analysis),
    filterWorstSlice(analysis),
    kudos(analysis),
  ]
    .filter((l): l is Leak => l !== null)
    .sort((a, b) => WEIGHT[a.severity] - WEIGHT[b.severity]);

  const hasRichData = trades.some(
    (t) =>
      t.closeTime !== undefined ||
      t.stopLoss !== undefined ||
      t.takeProfit !== undefined ||
      t.volume !== undefined ||
      t.entryPrice !== undefined,
  );

  return { leaks, hasRichData };
}
