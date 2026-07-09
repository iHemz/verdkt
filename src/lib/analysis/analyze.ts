// The edge-analysis engine. This is the method from the essay
// ("How to Build a Backtest That Can Prove You Wrong") applied to a real trade
// log: R-multiples, both-halves out-of-sample stability, sample-size
// significance, and a distinguishable-from-noise test.
//
// Design principle: it is built to prove the strategy WRONG. A positive
// headline number is never sufficient on its own.

import {
  ALPHA,
  HEALTHY_SAMPLE,
  MIN_SAMPLE,
  type Analysis,
  type Check,
  type CheckStatus,
  type Tone,
  type Trade,
  type Verdict,
} from "./types";
import { cumulative, maxDrawdown, mean, tStatistic, twoSidedP } from "./stats";

const rTxt = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(3)}R`;

/**
 * Build the R series. If trades carry an explicit R, use it. Otherwise derive
 * an R proxy where 1R = the average absolute size of a losing trade — the
 * standard way to normalise a raw P&L log into risk units.
 */
function toRSeries(trades: Trade[]): { rSeries: number[]; usingRProxy: boolean } {
  const hasR = trades.every((t) => typeof t.r === "number") && trades.some((t) => t.r !== 0);
  if (hasR) {
    return { rSeries: trades.map((t) => t.r as number), usingRProxy: false };
  }
  const pnl = trades.map((t) => t.pnl);
  const losses = pnl.filter((p) => p < 0).map(Math.abs);
  const unit = losses.length ? mean(losses) : Math.abs(mean(pnl)) || 1;
  return { rSeries: pnl.map((p) => (unit === 0 ? 0 : p / unit)), usingRProxy: true };
}

function buildChecks(a: {
  n: number;
  winRate: number;
  expectancyR: number;
  avgWin: number;
  avgLoss: number;
  payoff: number;
  profitFactor: number;
  firstHalfR: number;
  secondHalfR: number;
  signFlip: boolean;
  tStat: number;
  pValue: number;
}): Check[] {
  const checks: Check[] = [];
  const pTxt = a.pValue < 0.001 ? "<0.001" : a.pValue.toFixed(3);

  checks.push({
    key: "expectancy",
    title: "Positive expectancy per trade",
    status: a.expectancyR > 0 ? "pass" : "fail",
    detail:
      a.expectancyR > 0
        ? `Average trade is ${rTxt(a.expectancyR)}. On paper the system makes money per trade.`
        : `Average trade is ${rTxt(a.expectancyR)}. Before anything else, this loses money per trade. A high win rate can't save a negative average.`,
  });

  const payoffStatus: CheckStatus = a.payoff >= 1 ? "pass" : a.expectancyR > 0 ? "warn" : "fail";
  checks.push({
    key: "payoff",
    title: "Winners outweigh losers",
    status: payoffStatus,
    detail: `Win rate ${(a.winRate * 100).toFixed(0)}%, average win ${rTxt(a.avgWin)} vs average loss ${rTxt(a.avgLoss)} (payoff ${a.payoff.toFixed(2)}×). ${
      a.winRate > 0.55 && a.payoff < 1
        ? "Classic trap: winning often but losing more on the losers than you make on the winners."
        : `Profit factor ${Number.isFinite(a.profitFactor) ? a.profitFactor.toFixed(2) : "∞"}.`
    }`,
  });

  let stabilityStatus: CheckStatus;
  if (a.signFlip) stabilityStatus = "fail";
  else if (a.firstHalfR > 0 && a.secondHalfR > 0) stabilityStatus = "pass";
  else stabilityStatus = "warn";
  checks.push({
    key: "oos",
    title: "Edge holds out of sample",
    status: stabilityStatus,
    detail: a.signFlip
      ? `Split in half by time, the edge flips sign: ${rTxt(a.firstHalfR)} in the first half, ${rTxt(a.secondHalfR)} in the second. An edge that reverses across time is a regime artifact, not a strategy.`
      : a.firstHalfR > 0 && a.secondHalfR > 0
        ? `Both halves are positive (${rTxt(a.firstHalfR)} then ${rTxt(a.secondHalfR)}). The edge persists across time, not just in one lucky stretch.`
        : `Both halves point the same way (${rTxt(a.firstHalfR)} then ${rTxt(a.secondHalfR)}) but at least one is not positive.`,
  });

  const sigStatus: CheckStatus =
    a.pValue < ALPHA && a.expectancyR > 0 ? "pass" : a.pValue < 0.2 ? "warn" : "fail";
  checks.push({
    key: "significance",
    title: "Distinguishable from noise",
    status: sigStatus,
    detail:
      a.n < 2
        ? "Not enough trades to test."
        : `t-stat ${a.tStat.toFixed(2)}, two-sided p ≈ ${pTxt}. ${
            a.pValue < ALPHA
              ? "The average trade is statistically separable from zero — unlikely to be pure luck."
              : "The average trade is not statistically separable from zero. This result is consistent with random noise plus costs."
          }`,
  });

  const sizeStatus: CheckStatus = a.n >= HEALTHY_SAMPLE ? "pass" : a.n >= 100 ? "warn" : "fail";
  checks.push({
    key: "samplesize",
    title: "Enough trades to trust it",
    status: sizeStatus,
    detail:
      a.n >= HEALTHY_SAMPLE
        ? `${a.n} trades. A healthy sample — enough to separate skill from luck.`
        : a.n >= 100
          ? `${a.n} trades. Workable, but thin. Treat conclusions as provisional until you have ${HEALTHY_SAMPLE}+.`
          : `${a.n} trades. Too few to conclude much. Small samples routinely show fake edges that vanish with more data.`,
  });

  return checks;
}

function decideVerdict(a: {
  n: number;
  expectancyR: number;
  firstHalfR: number;
  secondHalfR: number;
  signFlip: boolean;
  pValue: number;
}): { verdict: Verdict; tone: Tone; summary: string } {
  const pTxt = a.pValue < 0.001 ? "<0.001" : a.pValue.toFixed(3);
  const sigPass = a.pValue < ALPHA && a.expectancyR > 0;

  if (a.n < MIN_SAMPLE) {
    return {
      verdict: "NOT ENOUGH DATA",
      tone: "none",
      summary: `Only ${a.n} trades. That's too small a sample to say anything honest about edge. Come back with at least ${MIN_SAMPLE}, ideally ${HEALTHY_SAMPLE}+.`,
    };
  }
  if (a.expectancyR <= 0) {
    return {
      verdict: "NO EDGE",
      tone: "fail",
      summary: `The strategy loses ${rTxt(a.expectancyR)} per trade on average. There's no edge here to salvage with position sizing or tighter stops — the core signal doesn't make money.`,
    };
  }
  if (a.signFlip) {
    return {
      verdict: "NO ROBUST EDGE",
      tone: "fail",
      summary:
        "The overall number is positive, but the edge flips sign between the first and second half of your trades. That's the fingerprint of a regime artifact, not a repeatable edge. It's the single most common way a backtest fools its author.",
    };
  }
  if (!sigPass) {
    return {
      verdict: "NO ROBUST EDGE",
      tone: "warn",
      summary: `Positive on the surface (${rTxt(a.expectancyR)}/trade), but not statistically distinguishable from zero (p ≈ ${pTxt}). This is consistent with luck plus costs. Don't risk real money on it yet.`,
    };
  }
  if (a.n < 100) {
    return {
      verdict: "PROMISING BUT THIN",
      tone: "warn",
      summary: `Positive, stable across both halves, and statistically separable from zero — but on only ${a.n} trades. Encouraging, not conclusive. Keep collecting; re-check at ${HEALTHY_SAMPLE}+.`,
    };
  }
  return {
    verdict: "EDGE HOLDS UP",
    tone: "pass",
    summary: `Positive expectancy (${rTxt(a.expectancyR)}/trade), holds up in both halves out of sample, statistically separable from zero, on a real sample. This one clears the bar the essay sets. Now confirm it survives realistic costs and forward testing before sizing up.`,
  };
}

export function analyze(trades: Trade[]): Analysis {
  const n = trades.length;
  const { rSeries, usingRProxy } = toRSeries(trades);
  const pnl = trades.map((t) => t.pnl);

  const winRs = rSeries.filter((r) => r > 0);
  const lossRs = rSeries.filter((r) => r < 0);
  const wins = winRs.length;
  const losses = lossRs.length;
  const scratches = rSeries.filter((r) => r === 0).length;
  const decided = wins + losses;
  const winRate = decided ? wins / decided : 0;

  const avgWin = mean(winRs);
  const avgLoss = mean(lossRs);
  const payoff = avgLoss !== 0 ? avgWin / Math.abs(avgLoss) : 0;

  const grossWin = winRs.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(lossRs.reduce((a, b) => a + b, 0));
  const profitFactor = grossLoss !== 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;

  const expectancyR = mean(rSeries);
  const expectancyCcy = mean(pnl);
  const totalPnl = pnl.reduce((a, b) => a + b, 0);

  const equityR = cumulative(rSeries);
  const maxDrawdownR = maxDrawdown(equityR);

  const mid = Math.floor(n / 2);
  const firstHalfR = mean(rSeries.slice(0, mid));
  const secondHalfR = mean(rSeries.slice(mid));
  const signFlip =
    Math.sign(firstHalfR) !== Math.sign(secondHalfR) && (firstHalfR !== 0 || secondHalfR !== 0);

  const tStat = tStatistic(rSeries);
  const pValue = twoSidedP(tStat);

  const shared = {
    n,
    winRate,
    expectancyR,
    avgWin,
    avgLoss,
    payoff,
    profitFactor,
    firstHalfR,
    secondHalfR,
    signFlip,
    tStat,
    pValue,
  };

  const checks = buildChecks(shared);
  const { verdict, tone, summary } = decideVerdict(shared);

  return {
    verdict,
    tone,
    summary,
    usingRProxy,
    n,
    wins,
    losses,
    scratches,
    winRate,
    expectancyR,
    expectancyCcy,
    totalPnl,
    avgWin,
    avgLoss,
    payoff,
    profitFactor,
    maxDrawdownR,
    firstHalfR,
    secondHalfR,
    signFlip,
    tStat,
    pValue,
    equityR,
    checks,
  };
}
