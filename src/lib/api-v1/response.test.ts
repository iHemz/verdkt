import { describe, expect, it } from "vitest";
import { analyze, type Trade } from "@/lib/analysis";
import { toApiResponse } from "./response";

const rTrades = (rs: number[]): Trade[] => rs.map((r) => ({ pnl: r, r }));
const strong = Array.from({ length: 60 }, (_, i) => (i % 3 === 2 ? -1 : 0.9));

describe("toApiResponse", () => {
  it("maps the analysis to a versioned DTO", () => {
    const a = analyze(rTrades(strong));
    const dto = toApiResponse(a);
    expect(dto.apiVersion).toBe("v1");
    expect(dto.verdict).toBe(a.verdict);
    expect(dto.metrics.trades).toBe(60);
    expect(dto.outOfSample.signFlip).toBe(a.signFlip);
    expect(dto.checks).toHaveLength(5);
  });

  it("omits the large internal arrays", () => {
    const dto = toApiResponse(analyze(rTrades(strong))) as Record<string, unknown>;
    expect(dto.rSeries).toBeUndefined();
    expect(dto.equityR).toBeUndefined();
  });

  it("represents an infinite profit factor as null (no losing trades)", () => {
    const dto = toApiResponse(analyze(rTrades([1, 1, 1, 1])));
    expect(dto.metrics.profitFactor).toBeNull();
  });

  it("rounds metrics to at most four decimals", () => {
    const dto = toApiResponse(analyze(rTrades(strong)));
    const decimals = dto.metrics.expectancyR.toString().split(".")[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(4);
  });
});
