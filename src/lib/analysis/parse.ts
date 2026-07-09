// Trade-log parsing: turn raw CSV/TSV text into a clean, chronologically
// ordered Trade[]. Auto-detects the profit/loss, R-multiple and date columns
// across the common retail exports (MT4/MT5, cTrader, TradingView, hand logs).
// Everything runs in the browser; nothing is uploaded.

import type { ParseResult, Trade } from "./types";
import { detectDelimiter, normalizeHeader, parseDate, parseNumber, splitCSV, splitTSV } from "./csv";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

const PNL_KEYS = [
  "netpl",
  "netprofit",
  "netpnl",
  "profitloss",
  "pnl",
  "pl",
  "profit",
  "profitusdt",
  "profitusd",
  "netgain",
  "gain",
  "realizedpl",
  "realisedpl",
  "result",
  "return",
  "netreturn",
  "amount",
];

// R-multiple column. Matched EXACTLY only: a substring match on the single
// letter "r" would wrongly grab "Profit", "Return", etc.
const R_KEYS = ["r", "rmultiple", "rmult", "rr", "rvalue", "rmultiples"];

const DATE_KEYS = [
  "closetime",
  "exittime",
  "closedate",
  "datetime",
  "date",
  "time",
  "closed",
  "opentime",
];

// Optional dimensions used for edge attribution.
const SYMBOL_KEYS = [
  "symbol",
  "pair",
  "currencypair",
  "instrument",
  "ticker",
  "market",
  "asset",
  "product",
];

// Direction is normalised by VALUE, so a column like "Type" that holds
// "Entry long" / "Exit short" (TradingView) or "buy"/"sell" (MT) still works,
// while an order-type column holding "Market"/"Limit" yields no direction.
const SIDE_KEYS = ["side", "direction", "type", "action", "ordertype", "buysell", "longshort", "dir"];

/** Map a raw cell to "Long" | "Short", or undefined when it isn't a direction. */
function normalizeSide(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim().toLowerCase();
  if (!s) return undefined;
  if (s === "b" || /\b(long|buy)\b/.test(s)) return "Long";
  if (s === "s" || /\b(short|sell)\b/.test(s)) return "Short";
  return undefined;
}

function pickColumn(normedHeaders: string[], keys: string[], exactOnly = false): number {
  for (const key of keys) {
    const idx = normedHeaders.indexOf(key);
    if (idx !== -1) return idx;
  }
  if (exactOnly) return -1;
  for (const key of keys) {
    const idx = normedHeaders.findIndex((h) => h.includes(key));
    if (idx !== -1) return idx;
  }
  return -1;
}

/** Find the header row, skipping any title/blank preamble some exports include. */
function findHeaderRow(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    const normed = rows[i].map(normalizeHeader);
    const looksLikeHeader =
      normed.some((h) => PNL_KEYS.includes(h) || R_KEYS.includes(h)) ||
      normed.some((h) => PNL_KEYS.some((k) => h.includes(k)));
    if (looksLikeHeader) return i;
  }
  return 0;
}

export function parseTradeLog(text: string): ParseResult {
  if (!text || !text.trim()) throw new ParseError("The file looks empty.");

  const delim = detectDelimiter(text);
  const rows = delim === "\t" ? splitTSV(text) : splitCSV(text);
  if (rows.length < 2) {
    throw new ParseError("Couldn't find a header row and at least one trade.");
  }

  const headerIdx = findHeaderRow(rows);
  const headers = rows[headerIdx];
  const normed = headers.map(normalizeHeader);
  const dataRows = rows.slice(headerIdx + 1);

  const rIdx = pickColumn(normed, R_KEYS, true);
  const pnlIdx = pickColumn(normed, PNL_KEYS);
  const dateIdx = pickColumn(normed, DATE_KEYS);
  const symbolIdx = pickColumn(normed, SYMBOL_KEYS);
  const sideIdx = pickColumn(normed, SIDE_KEYS);

  if (pnlIdx === -1 && rIdx === -1) {
    throw new ParseError(
      'Couldn\'t find a profit/loss or R-multiple column. Expected a header like "Profit", "P&L", "Net P/L", or "R".',
    );
  }

  const valueIdx = pnlIdx !== -1 ? pnlIdx : rIdx;
  const trades: Trade[] = [];
  let rowsSeen = 0;

  for (const row of dataRows) {
    rowsSeen++;
    const val = parseNumber(row[valueIdx]);
    // Skip rows with no numeric value here (TradingView entry rows, summary
    // lines). This is what makes multi-row-per-trade exports work.
    if (val === null) continue;

    const trade: Trade = { pnl: val };

    if (rIdx !== -1 && rIdx !== valueIdx) {
      const rVal = parseNumber(row[rIdx]);
      if (rVal !== null) trade.r = rVal;
    } else if (valueIdx === rIdx) {
      trade.r = val;
    }

    if (dateIdx !== -1) {
      const d = parseDate(row[dateIdx]);
      if (d !== undefined) trade.date = d;
    }

    if (symbolIdx !== -1) {
      const sym = (row[symbolIdx] ?? "").trim();
      if (sym) trade.symbol = sym;
    }

    if (sideIdx !== -1) {
      const side = normalizeSide(row[sideIdx]);
      if (side) trade.side = side;
    }

    trades.push(trade);
  }

  if (trades.length === 0) {
    throw new ParseError("Found the columns but no rows with a numeric profit/loss value.");
  }

  const warnings: string[] = [];
  const withDates = trades.filter((t) => t.date !== undefined).length;
  if (withDates >= trades.length * 0.8 && withDates > 1) {
    trades.sort((a, b) => (a.date ?? 0) - (b.date ?? 0));
  } else if (dateIdx === -1) {
    warnings.push("No date column detected — trades are analysed in file order, assumed chronological.");
  } else {
    warnings.push("Some rows had unreadable dates — trades are analysed in file order.");
  }

  return {
    trades,
    columns: {
      pnl: pnlIdx !== -1 ? headers[pnlIdx] : undefined,
      r: rIdx !== -1 ? headers[rIdx] : undefined,
      date: dateIdx !== -1 ? headers[dateIdx] : undefined,
      symbol: symbolIdx !== -1 ? headers[symbolIdx] : undefined,
      side: sideIdx !== -1 ? headers[sideIdx] : undefined,
    },
    rowsSeen,
    rowsUsed: trades.length,
    warnings,
  };
}
