import { describe, expect, it } from "vitest";
import { cumulative, maxDrawdown, mean, stdev, tStatistic, twoSidedP } from "./stats";

describe("mean", () => {
  it("averages a series", () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });
  it("returns 0 for an empty series", () => {
    expect(mean([])).toBe(0);
  });
});

describe("stdev", () => {
  it("computes sample standard deviation", () => {
    expect(stdev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2);
  });
  it("returns 0 for fewer than two points", () => {
    expect(stdev([5])).toBe(0);
  });
});

describe("cumulative", () => {
  it("produces a running sum", () => {
    expect(cumulative([1, -2, 3])).toEqual([1, -1, 2]);
  });
});

describe("maxDrawdown", () => {
  it("finds the deepest peak-to-trough on the curve", () => {
    // peak 5 then down to 1 => -4
    expect(maxDrawdown([1, 3, 5, 2, 1, 4])).toBe(-4);
  });
  it("is zero for a monotonically rising curve", () => {
    expect(maxDrawdown([1, 2, 3, 4])).toBe(0);
  });
});

describe("tStatistic / twoSidedP", () => {
  it("is zero for a zero-variance series", () => {
    expect(tStatistic([1, 1, 1])).toBe(0);
  });

  it("grows with a stronger, larger-sample signal", () => {
    const weak = tStatistic([0.1, -0.05, 0.2, -0.1, 0.05]);
    const strong = tStatistic(Array.from({ length: 300 }, (_, i) => (i % 3 === 0 ? -1 : 0.9)));
    expect(Math.abs(strong)).toBeGreaterThan(Math.abs(weak));
  });

  it("maps a large t-stat to a small p-value", () => {
    expect(twoSidedP(4)).toBeLessThan(0.001);
    expect(twoSidedP(0)).toBeCloseTo(1, 5);
  });
});
