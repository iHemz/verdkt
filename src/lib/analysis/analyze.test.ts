import { describe, expect, it } from "vitest";
import { analyze, stressCost } from "./analyze";
import { parseTradeLog } from "./parse";
import { sampleTradeLogCsv } from "./sample";
import type { Trade } from "./types";

const rTrades = (rs: number[]): Trade[] => rs.map((r) => ({ pnl: r, r }));
const repeat = (pattern: number[], times: number): number[] =>
  Array.from({ length: times * pattern.length }, (_, i) => pattern[i % pattern.length]);

describe("analyze — verdicts", () => {
  it("returns NOT ENOUGH DATA below the minimum sample", () => {
    const a = analyze(rTrades([1, -0.5, 0.8, -1, 0.3]));
    expect(a.verdict).toBe("NOT ENOUGH DATA");
    expect(a.tone).toBe("none");
  });

  it("returns NO EDGE for a negative expectancy on a real sample", () => {
    const a = analyze(rTrades(repeat([1, -1, -1, -1], 15))); // 60 trades, mean -0.5
    expect(a.verdict).toBe("NO EDGE");
    expect(a.tone).toBe("fail");
    expect(a.expectancyR).toBeLessThan(0);
  });

  it("returns NO ROBUST EDGE when the edge flips sign out of sample", () => {
    // first half strongly positive, second half negative; overall stays positive
    const first = repeat([1, 1, -0.5], 20); // 60 trades, mean +0.5
    const second = repeat([-1, -0.5, 0.5], 20); // 60 trades, mean -0.333
    const a = analyze(rTrades([...first, ...second])); // overall ~ +0.083
    expect(a.signFlip).toBe(true);
    expect(a.verdict).toBe("NO ROBUST EDGE");
    expect(a.tone).toBe("fail");
  });

  it("returns NO ROBUST EDGE (warn) when positive but not significant", () => {
    // both halves positive, but high variance keeps it indistinguishable from zero
    const a = analyze(rTrades(repeat([3, -2.5], 20))); // 40 trades, mean +0.25
    expect(a.signFlip).toBe(false);
    expect(a.expectancyR).toBeGreaterThan(0);
    expect(a.pValue).toBeGreaterThan(0.05);
    expect(a.verdict).toBe("NO ROBUST EDGE");
    expect(a.tone).toBe("warn");
  });

  it("returns EDGE HOLDS UP for a strong, stable, significant, large sample", () => {
    const a = analyze(rTrades(repeat([0.9, 0.9, -1], 80))); // 240 trades, mean +0.267
    expect(a.verdict).toBe("EDGE HOLDS UP");
    expect(a.tone).toBe("pass");
    expect(a.firstHalfR).toBeGreaterThan(0);
    expect(a.secondHalfR).toBeGreaterThan(0);
    expect(a.pValue).toBeLessThan(0.05);
  });

  it("returns PROMISING BUT THIN when strong but under 100 trades", () => {
    const a = analyze(rTrades(repeat([0.9, 0.9, -1], 20))); // 60 trades
    expect(a.verdict).toBe("PROMISING BUT THIN");
    expect(a.tone).toBe("warn");
  });
});

describe("analyze — R proxy", () => {
  it("uses explicit R when present", () => {
    const a = analyze(rTrades(repeat([1, -1], 20)));
    expect(a.usingRProxy).toBe(false);
  });

  it("derives an R proxy from P&L when no R column exists", () => {
    const a = analyze(repeat([200, -100], 20).map((pnl) => ({ pnl })));
    expect(a.usingRProxy).toBe(true);
    // 1R == avg abs loss (100), so a +200 trade reads as +2R
    expect(a.avgWin).toBeCloseTo(2, 5);
    expect(a.avgLoss).toBeCloseTo(-1, 5);
  });
});

describe("analyze — invariants", () => {
  it("emits one equity point per trade and five checks", () => {
    const a = analyze(rTrades(repeat([1, -1], 25)));
    expect(a.equityR).toHaveLength(50);
    expect(a.checks).toHaveLength(5);
  });

  it("catches the high-win-rate, fat-loser trap in the payoff check", () => {
    // wins 70% of the time but loses far more on losers => negative expectancy
    const a = analyze(rTrades(repeat([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -4, -4, -4], 6)));
    const payoff = a.checks.find((c) => c.key === "payoff");
    expect(a.winRate).toBeGreaterThan(0.55);
    expect(payoff?.status).toBe("fail");
  });
});

describe("stressCost", () => {
  const strong = repeat([0.9, 0.9, -1], 80); // 240 trades, mean +0.267, EDGE HOLDS UP

  it("lowers expectancy by exactly the cost per trade", () => {
    const base = analyze(rTrades(strong)).expectancyR;
    expect(stressCost(strong, 0.1).expectancyR).toBeCloseTo(base - 0.1, 6);
  });

  it("reproduces the base verdict at zero cost", () => {
    expect(stressCost(strong, 0).verdict).toBe("EDGE HOLDS UP");
    expect(stressCost(strong, 0).survives).toBe(true);
  });

  it("a strong edge survives a small cost but dies under a large one", () => {
    expect(stressCost(strong, 0.05).survives).toBe(true);
    const heavy = stressCost(strong, 0.35); // pushes mean below zero
    expect(heavy.expectancyR).toBeLessThan(0);
    expect(heavy.verdict).toBe("NO EDGE");
    expect(heavy.survives).toBe(false);
  });

  it("turns the marginal sample result negative once costs are charged", () => {
    const { rSeries } = analyze(parseTradeLog(sampleTradeLogCsv()).trades);
    expect(stressCost(rSeries, 0).expectancyR).toBeGreaterThan(0);
    expect(stressCost(rSeries, 0.2).expectancyR).toBeLessThan(0);
    expect(stressCost(rSeries, 0.2).verdict).toBe("NO EDGE");
  });
});

describe("analyze — the built-in sample", () => {
  it("demonstrates the sign-flip trap (positive headline, NO ROBUST EDGE)", () => {
    const { trades } = parseTradeLog(sampleTradeLogCsv());
    const a = analyze(trades);
    expect(a.expectancyR).toBeGreaterThan(0);
    expect(a.signFlip).toBe(true);
    expect(a.verdict).toBe("NO ROBUST EDGE");
    expect(a.usingRProxy).toBe(true);
  });
});
