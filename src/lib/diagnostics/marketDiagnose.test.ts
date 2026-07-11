import { describe, expect, it } from "vitest";
import type { Trade } from "@/lib/analysis";
import type { Candle } from "@/lib/marketData/types";
import { marketDiagnose } from "./marketDiagnose";

describe("marketDiagnose", () => {
  it("flags early exits (low capture) and stops that are too tight", () => {
    const trades: Trade[] = [];
    const byIndex = new Map<number, Candle[]>();

    // 12 winning longs that captured only 20% of the available move (entry 100,
    // ran to 110, but closed at 102).
    for (let i = 0; i < 12; i++) {
      trades.push({ pnl: 2, r: 2, side: "Long", entryPrice: 100, exitPrice: 102, closeTime: 1000 });
      byIndex.set(i, [{ t: 900, o: 100, h: 110, l: 100, c: 102 }]);
    }
    // 12 losing longs (closed at 98) where price came back above entry after exit.
    for (let i = 12; i < 24; i++) {
      trades.push({ pnl: -2, r: -2, side: "Long", entryPrice: 100, exitPrice: 98, closeTime: 1000 });
      byIndex.set(i, [
        { t: 900, o: 100, h: 100.5, l: 97, c: 98 }, // during
        { t: 1100, o: 99, h: 101, l: 99, c: 100 }, // after: high >= entry -> recovered
      ]);
    }

    const leaks = marketDiagnose(trades, byIndex);
    const capture = leaks.find((l) => l.key === "capture-efficiency");
    const stop = leaks.find((l) => l.key === "stop-too-tight");

    expect(capture).toBeDefined();
    expect(capture!.severity).toBe("bad");
    expect(capture!.impact).toMatch(/20%/);

    expect(stop).toBeDefined();
    expect(stop!.severity).toBe("bad");
  });

  it("returns nothing without enough priced trades", () => {
    const trades: Trade[] = [{ pnl: 1, side: "Long", entryPrice: 100, exitPrice: 105, closeTime: 1000 }];
    const byIndex = new Map<number, Candle[]>([[0, [{ t: 900, o: 100, h: 106, l: 100, c: 105 }]]]);
    expect(marketDiagnose(trades, byIndex)).toHaveLength(0);
  });
});
