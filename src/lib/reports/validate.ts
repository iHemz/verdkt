// Validation for untrusted publish input. The server re-runs analyze() from
// these trades so the published verdict is always Verdkt's own computation,
// never a client-fabricated Analysis.

import type { Trade } from "@/lib/analysis";

const MAX_TRADES = 20000;
// strip ASCII control characters from displayed text
const CONTROL = /[\x00-\x1f\x7f]/g;

export function sanitizeTitle(input: unknown): string {
  const t = String(input ?? "").replace(CONTROL, "").trim().slice(0, 80);
  return t || "Untitled strategy";
}

export function sanitizeAuthor(input: unknown): string {
  return String(input ?? "").replace(CONTROL, "").trim().slice(0, 60);
}

/** Coerce untrusted JSON into a clean Trade[]; silently drops malformed rows. */
export function coerceTrades(input: unknown): Trade[] {
  if (!Array.isArray(input)) return [];
  const out: Trade[] = [];
  for (const item of input.slice(0, MAX_TRADES)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const pnl = Number(o.pnl);
    if (!Number.isFinite(pnl)) continue;
    const trade: Trade = { pnl };
    if (Number.isFinite(Number(o.r))) trade.r = Number(o.r);
    if (Number.isFinite(Number(o.date))) trade.date = Number(o.date);
    if (typeof o.symbol === "string" && o.symbol.trim()) trade.symbol = o.symbol.trim().slice(0, 40);
    if (o.side === "Long" || o.side === "Short") trade.side = o.side;
    // Rich broker-export fields (optional; power the deep diagnostics).
    if (Number.isFinite(Number(o.entryPrice))) trade.entryPrice = Number(o.entryPrice);
    if (Number.isFinite(Number(o.exitPrice))) trade.exitPrice = Number(o.exitPrice);
    if (Number.isFinite(Number(o.stopLoss))) trade.stopLoss = Number(o.stopLoss);
    if (Number.isFinite(Number(o.takeProfit))) trade.takeProfit = Number(o.takeProfit);
    if (Number.isFinite(Number(o.volume))) trade.volume = Number(o.volume);
    if (Number.isFinite(Number(o.closeTime))) trade.closeTime = Number(o.closeTime);
    out.push(trade);
  }
  return out;
}
