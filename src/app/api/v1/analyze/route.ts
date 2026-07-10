// Public Validation API (open beta): POST a trade log as JSON `trades` or a raw
// `csv` string, get back Verdkt's edge verdict. Built for agents and automation
// that generate strategies and need to know whether the edge is real.

import { analyze, parseTradeLog, ParseError } from "@/lib/analysis";
import { coerceTrades } from "@/lib/reports";
import { toApiResponse } from "@/lib/api-v1/response";
import { rateLimit, rateLimitHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";

const CORS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...CORS, ...headers },
  });
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const rl = await rateLimit(ip);
  const rlHeaders = rateLimitHeaders(rl);
  if (!rl.success) {
    return json(
      { error: "Rate limit exceeded. The open beta allows 30 requests per 10 minutes." },
      429,
      rlHeaders,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400, rlHeaders);
  }

  const b = (body ?? {}) as Record<string, unknown>;

  let trades;
  if (typeof b.csv === "string") {
    try {
      trades = parseTradeLog(b.csv).trades;
    } catch (err) {
      const message = err instanceof ParseError ? err.message : "Could not parse the CSV.";
      return json({ error: message }, 400, rlHeaders);
    }
  } else {
    trades = coerceTrades(b.trades);
  }

  if (!trades || trades.length < 1) {
    return json(
      { error: "Provide `trades` (array of { pnl, r?, date?, symbol?, side? }) or `csv` (string) with at least one trade." },
      400,
      rlHeaders,
    );
  }

  const analysis = analyze(trades);
  return json(toApiResponse(analysis), 200, rlHeaders);
}
