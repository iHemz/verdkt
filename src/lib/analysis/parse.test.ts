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

describe("parseTradeLog — attribution dimensions", () => {
  it("extracts the symbol column", () => {
    const res = parseTradeLog("Symbol,Profit\nEUR_USD,10\nGBP_USD,-5");
    expect(res.columns.symbol).toBe("Symbol");
    expect(res.trades.map((t) => t.symbol)).toEqual(["EUR_USD", "GBP_USD"]);
  });

  it("normalises a Side column to Long/Short", () => {
    const res = parseTradeLog("Side,Profit\nBuy,10\nSell,-5\nlong,3");
    expect(res.trades.map((t) => t.side)).toEqual(["Long", "Short", "Long"]);
  });

  it("derives direction by value from a TradingView-style Type column", () => {
    const csv = "Type,Profit\nEntry long,\nExit long,120\nEntry short,\nExit short,-40";
    const res = parseTradeLog(csv);
    expect(res.trades.map((t) => t.side)).toEqual(["Long", "Short"]);
  });

  it("leaves side undefined for non-directional values (order type)", () => {
    const res = parseTradeLog("Type,Profit\nMarket,10\nLimit,-5");
    expect(res.trades.every((t) => t.side === undefined)).toBe(true);
  });

  it("leaves symbol/side undefined when the columns are absent", () => {
    const res = parseTradeLog("Profit\n1\n2\n3");
    expect(res.columns.symbol).toBeUndefined();
    expect(res.columns.side).toBeUndefined();
  });
});

describe("parseTradeLog — multi-section MT5 report (regression)", () => {
  // MetaTrader "Trade History Report": Positions -> Orders -> Deals -> Results.
  // The Deals "Balance" column sits exactly where Positions has "Profit"; the
  // parser must stop at the section boundary and never read balances as P&L.
  const MT5 = `Trade History Report,,,,,,,,,,,,,,
Account:,,,"123 (USD, Broker, demo)",,,,,,,,,,,
Positions,,,,,,,,,,,,,,
Time,Position,Symbol,Type,Volume,Price,S / L,T / P,Time,Price,Commission,Swap,Profit,,
2026.01.01 10:00:00,111,XAUUSDm,sell,0.04,4 106.170,4 129.590,4 068.090,2026.01.01 10:15:00,4 101.093,0.00,0.00, 20.31,,
2026.01.01 11:00:00,112,AUDUSDm,sell,0.5, 0.69156, 0.69356, 0.68756,2026.01.01 11:15:00, 0.69161,0.00,0.00,- 2.50,,
2026.01.01 12:00:00,113,GBPCADm,buy,1, 1.87629, 1.87529, 1.87829,2026.01.01 12:15:00, 1.87529,0.00,0.00,- 70.25,,
2026.01.01 13:00:00,114,USDCADm,buy,0.83, 1.42017, 1.41896, 1.42260,2026.01.01 13:30:00, 1.41896,0.00,0.00,- 70.78,,
Orders,,,,,,,,,,,,,,
Open Time,Order,Symbol,Type,Volume,Price,S / L,T / P,Time,State,,Comment,,,
2026.01.01 10:00:00,111,XAUUSDm,sell,0.04 / 0.04,market,4 129.590,4 068.090,2026.01.01 10:00:00,filled,,GoldBot,,,
2026.01.01 10:15:00,211,XAUUSDm,buy,0.04 / 0.04,market,,,2026.01.01 10:15:00,filled,,GoldBot close,,,
Deals,,,,,,,,,,,,,,
Time,Deal,Symbol,Type,Direction,Volume,Price,Order,Commission,Fee,Swap,Profit,Balance,Comment,
2026.01.01 10:15:00,999,XAUUSDm,buy,out,0.04,4 101.093,111,0.00,0.00,0.00, 20.31,10 020.31,close,
2026.01.01 11:15:00,998,AUDUSDm,buy,out,0.5, 0.69161,112,0.00,0.00,0.00,- 2.50,10 017.81,close,
Results,,,,,,,,,,,,,,
Total Net Profit:,,,- 123.22,Gross Profit:,,, 20.31,Gross Loss:,,,-143.53,,,`;

  it("reads only the Positions section, not Deals balances", () => {
    const res = parseTradeLog(MT5);
    expect(res.columns.pnl).toBe("Profit");
    expect(res.trades).toHaveLength(4); // 4 positions, NOT 6 (would include 2 deal-balance rows)
    expect(res.trades.map((t) => t.pnl)).toEqual([20.31, -2.5, -70.25, -70.78]);
  });

  it("never ingests an account-balance number as a trade P&L", () => {
    const res = parseTradeLog(MT5);
    // balances were ~10,000; a real trade here is under ~100
    expect(res.trades.every((t) => Math.abs(t.pnl) < 1000)).toBe(true);
  });

  it("still detects symbol and normalises MT5 direction", () => {
    const res = parseTradeLog(MT5);
    expect(res.trades[0].symbol).toBe("XAUUSDm");
    expect(res.trades[0].side).toBe("Short"); // sell
    expect(res.trades[2].side).toBe("Long"); // buy
  });

  it("orders MT5 yyyy.mm.dd timestamps chronologically", () => {
    const res = parseTradeLog(MT5);
    expect(res.trades[0].date).toBeLessThan(res.trades[3].date!);
    expect(res.warnings).toHaveLength(0); // dates parsed, no fallback warning
  });

  it("extracts rich fields (prices, SL/TP, volume, close time)", () => {
    const t = parseTradeLog(MT5).trades[0]; // earliest: XAUUSDm sell at 10:00
    expect(t.entryPrice).toBeCloseTo(4106.17, 2);
    expect(t.exitPrice).toBeCloseTo(4101.093, 3);
    expect(t.stopLoss).toBeCloseTo(4129.59, 2);
    expect(t.takeProfit).toBeCloseTo(4068.09, 2);
    expect(t.volume).toBeCloseTo(0.04, 3);
    expect(t.closeTime).toBeGreaterThan(t.date!);
  });
});
