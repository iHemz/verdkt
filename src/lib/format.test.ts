import { describe, expect, it } from "vitest";
import { checkMark, formatCurrency, formatPercent, formatR } from "./format";

describe("formatR", () => {
  it("adds an explicit sign and three decimals", () => {
    expect(formatR(0.098)).toBe("+0.098R");
    expect(formatR(-0.231)).toBe("-0.231R");
    expect(formatR(0)).toBe("+0.000R");
  });
});

describe("formatCurrency", () => {
  it("formats with a sign and no decimals", () => {
    expect(formatCurrency(1133)).toBe("1,133");
    expect(formatCurrency(-540)).toBe("-540");
  });
});

describe("formatPercent", () => {
  it("renders a whole-number percent", () => {
    expect(formatPercent(0.52)).toBe("52%");
    expect(formatPercent(1)).toBe("100%");
  });
});

describe("checkMark", () => {
  it("maps status to a glyph", () => {
    expect(checkMark("pass")).toBe("✓");
    expect(checkMark("warn")).toBe("!");
    expect(checkMark("fail")).toBe("✕");
  });
});
