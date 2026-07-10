# Verdkt Validation API (v1, open beta)

The same edge-analysis engine behind Verdkt, exposed as a JSON API. Built for
agents and automation that generate strategies and need an honest verdict at
scale.

Public docs page: `/developers`.

## Endpoint

```
POST https://verdkt.vercel.app/api/v1/analyze
Content-Type: application/json
```

No API key during the open beta. IP rate-limited to **30 requests / 10 minutes**.
CORS is open, so it works from browsers and servers alike.

## Request

Send one of:

- `trades`: an array of `{ pnl: number, r?: number, date?: number, symbol?: string, side?: "Long" | "Short" }`. `pnl` is required per trade; `r` (R-multiple) is used when present, otherwise 1R is estimated as the average losing trade.
- `csv`: a raw CSV string exported from MT4/MT5, cTrader, TradingView, or any log with a profit/loss column. Parsed server-side (columns auto-detected).

```bash
curl -X POST https://verdkt.vercel.app/api/v1/analyze \
  -H "content-type: application/json" \
  -d '{"trades":[{"pnl":1.2,"r":1.2},{"pnl":-1,"r":-1}]}'
```

## Response `200`

```jsonc
{
  "apiVersion": "v1",
  "verdict": "NO ROBUST EDGE",     // EDGE HOLDS UP | PROMISING BUT THIN | NO ROBUST EDGE | NO EDGE | NOT ENOUGH DATA
  "tone": "fail",                  // pass | warn | fail | none
  "summary": "…",
  "metrics": {
    "trades": 180,
    "wins": 93,
    "losses": 87,
    "winRate": 0.52,
    "expectancyR": 0.098,
    "payoff": 1.12,
    "profitFactor": 1.2,           // null when there are no losing trades
    "totalPnl": 1133,
    "maxDrawdownR": -22.9,
    "usingRProxy": true            // R estimated from P&L (no R column supplied)
  },
  "outOfSample": { "firstHalfR": 0.426, "secondHalfR": -0.231, "signFlip": true },
  "significance": { "tStat": 1.01, "pValue": 0.312 },
  "checks": [ { "key": "…", "title": "…", "status": "pass|warn|fail", "detail": "…" } ],
  "attribution": [ { "key": "symbol", "label": "Symbol", "segments": [ … ], "insight": "…" } ]
}
```

## Errors

| Status | Meaning |
| --- | --- |
| `400` | Invalid JSON, or no usable `trades` / `csv`, or an unparseable CSV (message included) |
| `429` | Rate limit exceeded (see `x-ratelimit-*` response headers) |

## Response headers

- `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset` (unix seconds)

## Notes

- The verdict is deliberately built to prove a strategy wrong. A positive headline number never passes on its own; it must hold up out of sample and clear significance.
- Small samples return `NOT ENOUGH DATA` rather than a false positive.
- Rate limiting requires Redis to be configured (same store as the Verified reports). Without it (local dev) the endpoint is unlimited.
