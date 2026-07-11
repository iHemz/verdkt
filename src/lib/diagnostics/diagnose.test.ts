import { describe, expect, it } from "vitest";
import { analyze, type Trade } from "@/lib/analysis";
import { diagnose } from "./diagnose";

const rTrades = (rs: number[]): Trade[] => rs.map((r) => ({ pnl: r, r }));
const repeat = (p: number[], times: number): number[] =>
  Array.from({ length: times * p.length }, (_, i) => p[i % p.length]);

describe("diagnose", () => {
  it("flags an upside-down risk:reward (payoff trap)", () => {
    // 70 trades, 60% win rate, but fat losers -> negative expectancy
    const trades = rTrades(repeat([0.5, 0.5, 0.5, -1, -1], 14));
    const leak = diagnose(trades, analyze(trades)).leaks.find((l) => l.key === "payoff-trap");
    expect(leak).toBeDefined();
    expect(leak!.severity).toBe("bad");
  });

  it("recommends cutting the worst slice with a simulated impact", () => {
    const trades: Trade[] = [];
    for (let i = 0; i < 42; i++) trades.push({ pnl: i % 2 ? 0.6 : 0, r: i % 2 ? 0.6 : 0, symbol: "EUR_USD" });
    for (let i = 0; i < 20; i++) trades.push({ pnl: -1, r: -1, symbol: "GBP_USD" });
    const leak = diagnose(trades, analyze(trades)).leaks.find((l) => l.key === "filter-slice");
    expect(leak).toBeDefined();
    expect(leak!.title).toMatch(/GBP_USD/);
    expect(leak!.impact).toMatch(/->/);
  });

  it("detects holding losers longer than winners", () => {
    const base = Date.UTC(2026, 0, 1, 8, 0, 0);
    const trades: Trade[] = [];
    for (let i = 0; i < 30; i++) {
      const win = i % 2 === 0;
      const date = base + i * 3_600_000;
      trades.push({ pnl: win ? 1 : -1, r: win ? 1 : -1, date, closeTime: date + (win ? 10 : 40) * 60_000 });
    }
    const d = diagnose(trades, analyze(trades));
    expect(d.leaks.some((l) => l.key === "hold-asymmetry")).toBe(true);
    expect(d.hasRichData).toBe(true);
  });

  it("flags sizing up after a loss (revenge)", () => {
    const trades: Trade[] = [];
    for (let i = 0; i < 40; i++) {
      const loss = i % 2 === 1;
      const prevWasLoss = i > 0 && (i - 1) % 2 === 1;
      trades.push({ pnl: loss ? -1 : 1, r: loss ? -1 : 1, volume: prevWasLoss ? 0.5 : 0.1 });
    }
    const leak = diagnose(trades, analyze(trades)).leaks.find((l) => l.key === "revenge-sizing");
    expect(leak).toBeDefined();
  });

  it("gives kudos when the edge holds up", () => {
    const trades = rTrades(repeat([0.9, 0.9, -1], 80));
    const d = diagnose(trades, analyze(trades));
    expect(d.leaks.some((l) => l.key === "kudos" && l.severity === "good")).toBe(true);
  });

  it("reports no rich data for a bare P&L log", () => {
    const trades = rTrades(repeat([1, -1], 30));
    expect(diagnose(trades, analyze(trades)).hasRichData).toBe(false);
  });
});
