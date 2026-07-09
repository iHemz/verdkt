// A deterministic sample trade log so people can try Verdkt without their own
// file. It's built to demonstrate the classic trap: a positive-looking overall
// result whose edge flips sign out of sample (a regime artifact). This mirrors
// the real finding behind the project.

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleTradeLogCsv(): string {
  const rand = mulberry32(20260709);
  const rows: string[] = ["Close Time,Symbol,Profit"];
  const pairs = ["EUR_USD", "GBP_USD", "AUD_USD", "USD_CAD", "EUR_GBP"];
  const n = 180;
  const start = new Date("2025-09-01T08:00:00Z").getTime();

  for (let i = 0; i < n; i++) {
    // First half drifts positive, second half negative: overall slightly
    // positive, but the edge reverses across the out-of-sample split.
    const firstHalf = i < n / 2;
    const drift = firstHalf ? 30 : -14;
    const base = (rand() - 0.5) * 240;
    const shock = rand() < 0.12 ? (rand() - 0.5) * 360 : 0;
    const pnl = Math.round((base + shock + drift) * 100) / 100;

    const t = new Date(start + i * 7.3 * 3600 * 1000);
    const symbol = pairs[Math.floor(rand() * pairs.length)];
    rows.push(`${t.toISOString().slice(0, 16).replace("T", " ")},${symbol},${pnl.toFixed(2)}`);
  }
  return rows.join("\n");
}
