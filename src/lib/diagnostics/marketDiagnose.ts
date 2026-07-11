// Tier B: what the price actually did around each trade. Pure over already-fetched
// candles (the network lives in src/lib/marketData), so it unit-tests cleanly.

import type { Trade } from "@/lib/analysis";
import type { Candle } from "@/lib/marketData/types";
import type { Leak } from "./types";

type Dir = "long" | "short";

function direction(t: Trade): Dir | null {
  if (t.side === "Long") return "long";
  if (t.side === "Short") return "short";
  // Infer from the realised move vs the sign of P&L.
  if (t.entryPrice != null && t.exitPrice != null && t.exitPrice !== t.entryPrice && t.pnl !== 0) {
    return Math.sign(t.exitPrice - t.entryPrice) === Math.sign(t.pnl) ? "long" : "short";
  }
  return null;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const MIN = 12;

/** Compute market-aware leaks from per-trade candle windows. */
export function marketDiagnose(trades: Trade[], byIndex: Map<number, Candle[]>): Leak[] {
  const captures: number[] = [];
  let losers = 0;
  let recovered = 0;

  for (const [i, candles] of byIndex) {
    const t = trades[i];
    const dir = direction(t);
    if (!dir || t.entryPrice == null || t.closeTime == null) continue;
    const entry = t.entryPrice;

    const during = candles.filter((c) => c.t <= t.closeTime!);
    const after = candles.filter((c) => c.t > t.closeTime!);
    if (during.length === 0) continue;

    let hi = -Infinity;
    let lo = Infinity;
    for (const c of during) {
      if (c.h > hi) hi = c.h;
      if (c.l < lo) lo = c.l;
    }
    const mfe = dir === "long" ? hi - entry : entry - lo;
    const exit = t.exitPrice ?? during[during.length - 1].c;
    const realized = dir === "long" ? exit - entry : entry - exit;

    if (mfe > 0 && realized > 0) captures.push(Math.min(realized / mfe, 1));

    if (realized < 0 && after.length) {
      losers++;
      const cameBack = dir === "long" ? after.some((c) => c.h >= entry) : after.some((c) => c.l <= entry);
      if (cameBack) recovered++;
    }
  }

  const leaks: Leak[] = [];

  if (captures.length >= MIN) {
    const cap = median(captures);
    if (cap < 0.6) {
      const pct = (cap * 100).toFixed(0);
      leaks.push({
        key: "capture-efficiency",
        severity: cap < 0.4 ? "bad" : "warn",
        title: "You exit winners early",
        detail: `On your winning trades you captured a median ${pct}% of the favourable move that was on the table before you closed. The rest walked away after you were out.`,
        fix: "Let winners run toward your target, or trail your stop instead of closing at a fixed point.",
        impact: `${pct}% of the move captured`,
      });
    }
  }

  if (losers >= MIN) {
    const rate = recovered / losers;
    if (rate >= 0.35) {
      const pct = (rate * 100).toFixed(0);
      leaks.push({
        key: "stop-too-tight",
        severity: rate >= 0.5 ? "bad" : "warn",
        title: "Your stops may be too tight",
        detail: `${pct}% of your losing trades traded back through your entry within 2 hours of you exiting. Price was coming back; you were already out.`,
        fix: "Test whether a wider stop, sized by volatility (ATR) rather than a fixed distance, survives the noise without blowing your risk budget.",
        impact: `${pct}% of losers reversed`,
      });
    }
  }

  return leaks;
}
