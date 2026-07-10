import { describe, expect, it } from "vitest";
import { coerceTrades, sanitizeAuthor, sanitizeTitle } from "./validate";

describe("sanitizeTitle / sanitizeAuthor", () => {
  it("trims and defaults the title", () => {
    expect(sanitizeTitle("  London breakout  ")).toBe("London breakout");
    expect(sanitizeTitle("")).toBe("Untitled strategy");
    expect(sanitizeTitle(null)).toBe("Untitled strategy");
  });

  it("caps the title length", () => {
    expect(sanitizeTitle("x".repeat(200))).toHaveLength(80);
  });

  it("leaves author optional", () => {
    expect(sanitizeAuthor("")).toBe("");
    expect(sanitizeAuthor("  @me ")).toBe("@me");
  });
});

describe("coerceTrades", () => {
  it("keeps valid rows and drops malformed ones", () => {
    const out = coerceTrades([
      { pnl: 1, r: 0.5, symbol: "EUR_USD", side: "Long" },
      { pnl: "not a number" },
      { nope: 1 },
      { pnl: -2 },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ pnl: 1, r: 0.5, symbol: "EUR_USD", side: "Long" });
    expect(out[1]).toMatchObject({ pnl: -2 });
  });

  it("ignores an invalid side value", () => {
    const out = coerceTrades([{ pnl: 1, side: "buy" }]);
    expect(out[0].side).toBeUndefined();
  });

  it("returns an empty array for non-array input", () => {
    expect(coerceTrades("nope")).toEqual([]);
    expect(coerceTrades(null)).toEqual([]);
  });
});
