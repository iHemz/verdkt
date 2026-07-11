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

// Rich broker-export columns (MT5, cTrader). Prices/times often appear twice
// (open + close) with identical headers, so these are matched positionally.
const PRICE_KEYS = ["price", "openprice", "entryprice", "closeprice", "exitprice", "fillprice", "rate"];
const TIME_KEYS = ["time", "date", "datetime"];
const SL_KEYS = ["sl", "stoploss", "stop"];
const TP_KEYS = ["tp", "takeprofit", "target"];
const VOLUME_KEYS = ["volume", "lots", "lot", "size", "qty", "quantity", "units", "vol"];

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

/** Every column index whose header matches any key (exact or substring), in order. */
function pickColumns(normedHeaders: string[], keys: string[]): number[] {
  const out: number[] = [];
  normedHeaders.forEach((h, i) => {
    if (h && (keys.includes(h) || keys.some((k) => h.includes(k)))) out.push(i);
  });
  return out;
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

// Multi-section broker reports (MT5 "Trade History Report": Positions / Orders /
// Deals / Results) reuse the same column positions across sections with
// different meanings — e.g. the Deals "Balance" sits exactly where Positions has
// "Profit". We must STOP at a section boundary, not read straight through it,
// or account-balance numbers get ingested as trade P&L.
const SECTION_WORDS = new Set([
  "orders",
  "deals",
  "results",
  "positions",
  "workingorders",
  "openpositions",
  "closedpositions",
  "summary",
]);

const HEADER_TOKENS = new Set<string>([
  ...PNL_KEYS,
  ...R_KEYS,
  ...DATE_KEYS,
  ...SYMBOL_KEYS,
  ...SIDE_KEYS,
  "balance",
  "deal",
  "order",
  "state",
  "commission",
  "fee",
  "swap",
  "volume",
  "price",
  "direction",
  "position",
  "comment",
  "ticket",
]);

/** True when a row starts a new section: a lone title cell, or a repeated header. */
function isSectionBreak(normedRow: string[]): boolean {
  const nonEmpty = normedRow.filter((c) => c !== "");
  if (nonEmpty.length === 1 && SECTION_WORDS.has(nonEmpty[0])) return true;
  // A repeated header row from a different section (schema change).
  let hits = 0;
  for (const c of normedRow) if (c && HEADER_TOKENS.has(c)) hits++;
  return hits >= 4;
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

  // Rich fields: entry/exit prices and open/close times duplicate their headers,
  // so take them positionally (first = entry/open, last = exit/close).
  const priceCols = pickColumns(normed, PRICE_KEYS);
  const timeCols = pickColumns(normed, TIME_KEYS);
  const entryIdx = priceCols.length > 0 ? priceCols[0] : -1;
  const exitIdx = priceCols.length > 1 ? priceCols[priceCols.length - 1] : -1;
  const closeTimeIdx = timeCols.length > 1 ? timeCols[timeCols.length - 1] : -1;
  const slIdx = pickColumn(normed, SL_KEYS);
  const tpIdx = pickColumn(normed, TP_KEYS);
  const volumeIdx = pickColumn(normed, VOLUME_KEYS);

  if (pnlIdx === -1 && rIdx === -1) {
    throw new ParseError(
      'Couldn\'t find a profit/loss or R-multiple column. Expected a header like "Profit", "P&L", "Net P/L", or "R".',
    );
  }

  const valueIdx = pnlIdx !== -1 ? pnlIdx : rIdx;
  const trades: Trade[] = [];
  let rowsSeen = 0;

  for (const row of dataRows) {
    // Stop at the next section (Orders/Deals/Results) so we never read another
    // section's columns (e.g. Balance) as trade P&L.
    if (isSectionBreak(row.map(normalizeHeader))) break;

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

    if (entryIdx !== -1) {
      const v = parseNumber(row[entryIdx]);
      if (v !== null) trade.entryPrice = v;
    }
    if (exitIdx !== -1) {
      const v = parseNumber(row[exitIdx]);
      if (v !== null) trade.exitPrice = v;
    }
    if (slIdx !== -1) {
      const v = parseNumber(row[slIdx]);
      if (v !== null && v !== 0) trade.stopLoss = v; // 0 = no stop set
    }
    if (tpIdx !== -1) {
      const v = parseNumber(row[tpIdx]);
      if (v !== null && v !== 0) trade.takeProfit = v; // 0 = no target set
    }
    if (volumeIdx !== -1) {
      const v = parseNumber(row[volumeIdx]);
      if (v !== null) trade.volume = v;
    }
    if (closeTimeIdx !== -1) {
      const d = parseDate(row[closeTimeIdx]);
      if (d !== undefined) trade.closeTime = d;
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
