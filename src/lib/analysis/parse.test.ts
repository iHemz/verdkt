import { describe, expect, it } from "vitest";
import { parseTradeLog, ParseError } from "./parse";

describe("parseTradeLog — column detection", () => {
  it("detects a Profit column and reads values", () => {
    const res = parseTradeLog("Profit\n10\n-5\n8");
    expect(res.columns.pnl).toBe("Profit");
    expect(res.trades.map((t) => t.pnl)).toEqual([10, -5, 8]);
  });

  it("detects an exact R column and treats it as R-multiples", () => {
    const res = parseTradeLog("Date,R\n2025-01-01,1.2\n2025-01-02,-1");
    expect(res.columns.r).toBe("R");
    expect(res.trades[0].r).toBe(1.2);
  });

  it("does NOT mistake 'Profit' for an R column (substring-r regression)", () => {
    // 'profit' contains the letter 'r'; R detection must be exact-match only.
    const res = parseTradeLog("Profit\n100\n-50");
    expect(res.columns.r).toBeUndefined();
    expect(res.columns.pnl).toBe("Profit");
  });

  it("throws a ParseError when no pnl/R column exists", () => {
    expect(() => parseTradeLog("foo,bar\n1,2")).toThrow(ParseError);
  });

  it("throws a ParseError for empty input", () => {
    expect(() => parseTradeLog("   ")).toThrow(ParseError);
  });
});

describe("parseTradeLog — real-world formats", () => {
  it("handles MT5-style currency, parens negatives and thousands", () => {
    const csv =
      'Ticket,Close Time,Symbol,Profit\n1,2025.03.01 10:00,EURUSD,"1,204.50"\n2,2025.03.02 11:00,EURUSD,(320.00)\n3,2025.03.03 12:00,EURUSD,$88.10';
    const res = parseTradeLog(csv);
    expect(res.trades.map((t) => t.pnl)).toEqual([1204.5, -320, 88.1]);
    expect(res.columns.date).toBe("Close Time");
  });

  it("skips rows with no numeric P&L (TradingView-style entry/summary rows)", () => {
    const csv = "Type,Profit\nEntry long,\nExit long,120\nEntry long,\nExit long,-40";
    const res = parseTradeLog(csv);
    expect(res.rowsUsed).toBe(2);
    expect(res.trades.map((t) => t.pnl)).toEqual([120, -40]);
  });

  it("orders trades chronologically when dates are present", () => {
    const csv = "Close Time,Profit\n2025-06-01,10\n2025-01-01,-5\n2025-03-01,7";
    const res = parseTradeLog(csv);
    expect(res.trades.map((t) => t.pnl)).toEqual([-5, 7, 10]);
    expect(res.warnings).toHaveLength(0);
  });

  it("warns when no date column is present", () => {
    const res = parseTradeLog("Profit\n1\n2\n3");
    expect(res.warnings.length).toBeGreaterThan(0);
  });
});
