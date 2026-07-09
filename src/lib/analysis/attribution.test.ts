import { describe, expect, it } from "vitest";
import { buildAttribution } from "./attribution";
import { analyze } from "./analyze";
import { parseTradeLog } from "./parse";
import { sampleTradeLogCsv } from "./sample";
import type { Trade } from "./types";

const repeat = (pattern: number[], times: number): number[] =>
  Array.from({ length: times * pattern.length }, (_, i) => pattern[i % pattern.length]);

/** Build symbol-tagged trades + an index-aligned R series. */
function symbolTrades(spec: { symbol: string; rs: number[] }[]): {
  trades: Trade[];
  rSeries: number[];
} {
  const trades: Trade[] = [];
  const rSeries: number[] = [];
  for (const { symbol, rs } of spec) {
    for (const r of rs) {
      trades.push({ pnl: r, symbol });
      rSeries.push(r);
    }
  }
  return { trades, rSeries };
}

describe("buildAttribution", () => {
  it("returns nothing when the log has no dimensions", () => {
    const trades: Trade[] = repeat([1, -1], 30).map((r) => ({ pnl: r }));
    expect(buildAttribution(trades, trades.map((t) => t.pnl))).toEqual([]);
  });

  it("segments by symbol and flags the carrier, the drag and the thin slice", () => {
    const { trades, rSeries } = symbolTrades([
      { symbol: "EUR_USD", rs: repeat([0.6, 0.4], 20) }, // n=40, mean +0.5, has variance
      { symbol: "GBP_USD", rs: repeat([-0.6, -0.4], 20) }, // n=40, mean -0.5
      { symbol: "AUD_USD", rs: repeat([0.6, 0.4], 5) }, // n=10, positive but thin
    ]);
    const dims = buildAttribution(trades, rSeries);
    const symbol = dims.find((d) => d.key === "symbol");
    expect(symbol).toBeDefined();

    const eur = symbol!.segments.find((s) => s.label === "EUR_USD")!;
    const gbp = symbol!.segments.find((s) => s.label === "GBP_USD")!;
    const aud = symbol!.segments.find((s) => s.label === "AUD_USD")!;

    expect(eur.role).toBe("carrier");
    expect(gbp.role).toBe("drag");
    expect(aud.role).toBe("thin"); // n=10 < SEGMENT_MIN, so never trusted
    expect(aud.expectancyR).toBeGreaterThan(0);
  });

  it("surfaces an insight when one segment carries most of the positive R", () => {
    const { trades, rSeries } = symbolTrades([
      { symbol: "EUR_USD", rs: repeat([0.6, 0.4], 20) },
      { symbol: "GBP_USD", rs: repeat([-0.6, -0.4], 20) },
    ]);
    const symbol = buildAttribution(trades, rSeries).find((d) => d.key === "symbol")!;
    expect(symbol.insight).toMatch(/EUR_USD/);
    expect(symbol.insight).toMatch(/symbol/i);
  });

  it("excludes a dimension when coverage is below the threshold", () => {
    // Only 3 of 40 trades carry a symbol => well under SEGMENT_COVERAGE.
    const trades: Trade[] = repeat([0.6, -0.5], 20).map((r, i) => ({
      pnl: r,
      symbol: i < 3 ? "EUR_USD" : undefined,
    }));
    const dims = buildAttribution(trades, trades.map((t) => t.pnl));
    expect(dims.find((d) => d.key === "symbol")).toBeUndefined();
  });

  it("excludes a dimension with only one category", () => {
    const { trades, rSeries } = symbolTrades([{ symbol: "EUR_USD", rs: repeat([0.6, -0.5], 20) }]);
    expect(buildAttribution(trades, rSeries).find((d) => d.key === "symbol")).toBeUndefined();
  });
});

describe("attribution via analyze() on the built-in sample", () => {
  it("produces a symbol dimension for the sample log", () => {
    const a = analyze(parseTradeLog(sampleTradeLogCsv()).trades);
    expect(a.attribution.some((d) => d.key === "symbol")).toBe(true);
    // sample assigns symbols at random, so no single symbol should honestly
    // carry the whole edge — a good demonstration that it won't invent a story
    const symbol = a.attribution.find((d) => d.key === "symbol")!;
    expect(symbol.segments.length).toBeGreaterThanOrEqual(2);
  });
});
