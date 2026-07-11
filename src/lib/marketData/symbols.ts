// Map a broker symbol (e.g. "XAUUSDm", "EURUSD.r") to a Dukascopy instrument id
// ("xauusd", "eurusd"). Broker feeds append account-type suffixes; strip them and
// match against the real instrument list.

import { instrumentMetaData } from "dukascopy-node";

const INSTRUMENTS = new Set(Object.keys(instrumentMetaData));

// Ordered longest-first so "micro" is tried before the bare "m".
const SUFFIXES = ["micro", "cash", "pro", "ecn", "stp", "raw", "sb", "m", "i", "r", "a", "z", "c", "s"];

/** Canonical Dukascopy instrument id, or null when we can't confidently map it. */
export function toDukascopyInstrument(symbol: string | undefined): string | null {
  if (!symbol) return null;
  const cleaned = symbol.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cleaned) return null;
  if (INSTRUMENTS.has(cleaned)) return cleaned;
  for (const suffix of SUFFIXES) {
    if (cleaned.endsWith(suffix) && cleaned.length - suffix.length >= 6) {
      const stripped = cleaned.slice(0, -suffix.length);
      if (INSTRUMENTS.has(stripped)) return stripped;
    }
  }
  return null;
}
