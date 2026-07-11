// Fetch M1 OHLC around each trade from Dukascopy's free historical feed. Trade
// windows are merged per instrument into a few narrow ranges (so we download a
// handful of hourly files, not whole days), and cached in Redis (historical
// candles are immutable) to stay cheap on reruns.

import { getHistoricalRates, type InstrumentType } from "dukascopy-node";
import type { Trade } from "@/lib/analysis";
import { getRedis } from "@/lib/redis";
import { toDukascopyInstrument } from "./symbols";
import type { Candle } from "./types";

const MIN = 60_000;
const PAD = 2 * MIN; // 2 min before entry
const LOOKFORWARD = 2 * 60 * MIN; // 2 h after close, to see what a wider stop would have done
const MERGE_GAP = 60 * MIN; // merge trade windows within an hour into one fetch
const MAX_FETCHES = 30; // guardrail: skip Tier B rather than hammer the feed
const CONCURRENCY = 5;
const RANGE_TIMEOUT = 12_000; // cap any single range fetch (the feed can hang)
const OVERALL_DEADLINE = 42_000; // stop starting new fetches after this, so the route stays under its limit

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((res) => setTimeout(() => res(fallback), ms))]);
}

type Window = { index: number; instrument: string; from: number; to: number };
type Range = { instrument: string; from: number; to: number };

function usableWindow(trade: Trade, index: number): Window | null {
  const instrument = toDukascopyInstrument(trade.symbol);
  if (!instrument || trade.entryPrice == null || trade.date == null || trade.closeTime == null) return null;
  if (trade.closeTime <= trade.date) return null;
  return { index, instrument, from: trade.date - PAD, to: trade.closeTime + LOOKFORWARD };
}

/** Merge windows of the same instrument that are within MERGE_GAP into fetch ranges. */
function mergeRanges(windows: Window[]): Range[] {
  const byInstrument = new Map<string, Window[]>();
  for (const w of windows) {
    const list = byInstrument.get(w.instrument) ?? [];
    list.push(w);
    byInstrument.set(w.instrument, list);
  }
  const ranges: Range[] = [];
  for (const [instrument, list] of byInstrument) {
    list.sort((a, b) => a.from - b.from);
    let cur: Range | null = null;
    for (const w of list) {
      if (cur && w.from <= cur.to + MERGE_GAP) {
        cur.to = Math.max(cur.to, w.to);
      } else {
        cur = { instrument, from: w.from, to: w.to };
        ranges.push(cur);
      }
    }
  }
  return ranges;
}

async function fetchRatesWithRetry(range: Range, attempts = 2): Promise<Candle[]> {
  for (let a = 0; a < attempts; a++) {
    try {
      const rows = await getHistoricalRates({
        instrument: range.instrument as InstrumentType,
        dates: { from: new Date(range.from), to: new Date(range.to) },
        timeframe: "m1",
        format: "json",
        priceType: "bid",
        // Fail fast so our own retry (and the range timeout) stay in control.
        retryCount: 3,
        pauseBetweenRetriesMs: 150,
        failAfterRetryCount: true,
      });
      return rows.map((r) => ({ t: r.timestamp, o: r.open, h: r.high, l: r.low, c: r.close }));
    } catch (err) {
      if (a === attempts - 1) throw err; // Dukascopy's feed is flaky; retry transient failures.
      await new Promise((r) => setTimeout(r, 500 * (a + 1)));
    }
  }
  return [];
}

async function fetchRange(range: Range): Promise<Candle[]> {
  const key = `mkt:${range.instrument}:${Math.floor(range.from / MIN)}:${Math.floor(range.to / MIN)}`;
  const redis = getRedis();
  if (redis) {
    const cached = await redis.get<Candle[]>(key);
    if (cached) return cached;
  }
  const candles = await fetchRatesWithRetry(range);
  if (redis && candles.length) await redis.set(key, candles, { ex: 60 * 60 * 24 * 30 });
  return candles;
}

export type CandleLoad = {
  byIndex: Map<number, Candle[]>;
  matched: number;
  eligible: number;
  tooLarge: boolean;
};

/** Load candle windows for every trade we can price. Network + cache; server-only. */
export async function loadCandlesForTrades(trades: Trade[]): Promise<CandleLoad> {
  const windows = trades.map((t, i) => usableWindow(t, i)).filter((w): w is Window => w !== null);
  const ranges = mergeRanges(windows);
  if (ranges.length > MAX_FETCHES) {
    return { byIndex: new Map(), matched: 0, eligible: windows.length, tooLarge: true };
  }

  // Deadline-aware pool: each range fetch is capped, and we stop starting new
  // fetches once the overall deadline passes, so the route always returns in time.
  const start = Date.now();
  const fetched: { range: Range; candles: Candle[] }[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < ranges.length) {
      if (Date.now() - start > OVERALL_DEADLINE) return;
      const r = ranges[cursor++];
      const candles = await withTimeout(
        fetchRange(r).catch(() => [] as Candle[]),
        RANGE_TIMEOUT,
        [] as Candle[],
      );
      fetched.push({ range: r, candles });
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, ranges.length) }, worker));

  const byIndex = new Map<number, Candle[]>();
  for (const w of windows) {
    const merged: Candle[] = [];
    for (const f of fetched) {
      if (f.range.instrument !== w.instrument) continue;
      for (const c of f.candles) if (c.t >= w.from && c.t <= w.to) merged.push(c);
    }
    if (merged.length) {
      merged.sort((a, b) => a.t - b.t);
      byIndex.set(w.index, merged);
    }
  }

  return { byIndex, matched: byIndex.size, eligible: windows.length, tooLarge: false };
}
