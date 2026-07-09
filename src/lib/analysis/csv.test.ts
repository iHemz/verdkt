import { describe, expect, it } from "vitest";
import { detectDelimiter, normalizeHeader, parseDate, parseNumber, splitCSV } from "./csv";

describe("parseNumber", () => {
  it("parses plain integers and decimals", () => {
    expect(parseNumber("42")).toBe(42);
    expect(parseNumber("-15.5")).toBe(-15.5);
    expect(parseNumber("+3.2")).toBe(3.2);
  });

  it("strips currency symbols and thousands separators", () => {
    expect(parseNumber("$1,234.50")).toBe(1234.5);
    expect(parseNumber("1,204.50")).toBe(1204.5);
    expect(parseNumber("€2,000")).toBe(2000);
  });

  it("treats parenthesised values as negative (accounting style)", () => {
    expect(parseNumber("(320.00)")).toBe(-320);
  });

  it("handles european decimal commas", () => {
    expect(parseNumber("1234,56")).toBeCloseTo(1234.56);
  });

  it("handles percentages by value", () => {
    expect(parseNumber("3.2%")).toBeCloseTo(3.2);
  });

  it("returns null for blanks and non-numbers", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("  ")).toBeNull();
    expect(parseNumber("-")).toBeNull();
    expect(parseNumber("EUR_USD")).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
  });
});

describe("parseDate", () => {
  it("parses ISO dates", () => {
    expect(parseDate("2025-09-01T08:00:00Z")).toBe(Date.parse("2025-09-01T08:00:00Z"));
  });

  it("returns undefined for empty input", () => {
    expect(parseDate("")).toBeUndefined();
    expect(parseDate(undefined)).toBeUndefined();
  });

  it("orders chronologically for two ISO dates", () => {
    const a = parseDate("2025-01-01")!;
    const b = parseDate("2025-06-01")!;
    expect(a).toBeLessThan(b);
  });
});

describe("splitCSV", () => {
  it("splits simple rows", () => {
    expect(splitCSV("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("respects quoted fields with embedded commas", () => {
    expect(splitCSV('x,y\n"1,234",5')).toEqual([
      ["x", "y"],
      ["1,234", "5"],
    ]);
  });

  it("drops fully-empty rows", () => {
    expect(splitCSV("a,b\n\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("detectDelimiter", () => {
  it("detects commas", () => {
    expect(detectDelimiter("a,b,c\n1,2,3")).toBe(",");
  });
  it("detects tabs", () => {
    expect(detectDelimiter("a\tb\tc\n1\t2\t3")).toBe("\t");
  });
});

describe("normalizeHeader", () => {
  it("lowercases and strips separators/punctuation", () => {
    expect(normalizeHeader("Net P/L")).toBe("netpl");
    expect(normalizeHeader("Close Time")).toBe("closetime");
    expect(normalizeHeader("Profit (USDT)")).toBe("profitusdt");
  });
});
