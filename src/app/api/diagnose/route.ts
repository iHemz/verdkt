// Deep diagnosis (Tier B + C): the client posts its parsed trades; we price each
// trade against Dukascopy market data, compute market-aware leaks, and write a
// grounded AI coaching note. Tier A already ran client-side, so we return only
// the new market leaks plus the narrative. Both degrade gracefully.

import { analyze } from "@/lib/analysis";
import { coerceTrades } from "@/lib/reports";
import { diagnose } from "@/lib/diagnostics";
import { marketDiagnose } from "@/lib/diagnostics/marketDiagnose";
import { loadCandlesForTrades } from "@/lib/marketData/dukascopy";
import { coachingNarrative, aiCoachEnabled } from "@/lib/ai/coach";
import { rateLimit, rateLimitHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const rl = await rateLimit(ip);
  const rlHeaders = rateLimitHeaders(rl);
  if (!rl.success) {
    return json({ error: "Rate limit exceeded. Please wait a few minutes." }, 429, rlHeaders);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400, rlHeaders);
  }

  const trades = coerceTrades((body as Record<string, unknown>)?.trades);
  if (!trades || trades.length < 1) {
    return json({ error: "Provide `trades` with at least one trade." }, 400, rlHeaders);
  }

  const analysis = analyze(trades);

  // Tier B: market-data what-ifs. Never let a data failure break the response.
  let marketLeaks: ReturnType<typeof marketDiagnose> = [];
  let coverage = { matched: 0, eligible: 0, tooLarge: false };
  try {
    const load = await loadCandlesForTrades(trades);
    coverage = { matched: load.matched, eligible: load.eligible, tooLarge: load.tooLarge };
    marketLeaks = marketDiagnose(trades, load.byIndex);
  } catch {
    // leave marketLeaks empty; the narrative still runs on Tier A
  }

  // Tier C: grounded narrative over ALL findings (A + B).
  const tierA = diagnose(trades, analysis);
  const allLeaks = [...tierA.leaks, ...marketLeaks];
  let narrative: string | null = null;
  try {
    narrative = await coachingNarrative(analysis, allLeaks);
  } catch {
    narrative = null;
  }

  return json({ marketLeaks, narrative, coverage, aiEnabled: aiCoachEnabled() }, 200, rlHeaders);
}
