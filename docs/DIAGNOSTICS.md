# Verdkt Rx — the paid "fix" layer (map)

_Working name "Rx" (prescription). Strategy + architecture for the diagnostic/coaching product that becomes the thing people actually pay for. Written 2026-07-10. Honest about what is and isn't derivable._

## The reframe

- **Free = the verdict.** Is the edge real, fragile, or fictional. (Everything shipped so far.)
- **Paid = the fix.** Where you are leaking edge, what to change, and the impact simulated on your own trades. Plus an honest "strategy fingerprint" and, when it's solid, earned kudos.

Publishing (report URL + badge + PDF) moves to **free**: it is a growth/credibility feature, not a product. Nobody pays for a link to their own analysis.

## The honest boundary (do not cross it)

You cannot recover a strategy's rules, indicators, or parameters from a P&L log. A log has outcomes, not logic. Two different strategies with identical trades are indistinguishable. Any feature that claims to reverse-engineer the strategy from results is guessing, and this audience will know.

What we CAN do, honestly, is describe **how the trades were managed** and **where edge leaks**, and simulate corrections on the real trades. With market price data added, that becomes genuinely valuable and defensible.

## What becomes possible, by data requirement

### Tier A — richer log only (no external data; ship first)

Rich broker exports (MT5, cTrader) already carry entry price, exit price, SL, TP, volume, and open+close times. The parser currently discards these. Capturing them unlocks real diagnostics with zero data integration:

- **Exit discipline** — share of trades that hit TP vs SL vs a manual close. Manual closes that underperform the planned SL/TP are a discipline leak, quantified.
- **Planned vs achieved R:R** — SL/TP imply a planned reward:risk; compare to the achieved payoff. A 2:1 plan delivering 0.7x means winners aren't reaching target (cut early) or targets are unrealistic.
- **Hold-time asymmetry** — average time in winners vs losers. Losers held longer than winners is the classic "let losers run, cut winners short," now measured.
- **Risk / sizing consistency** — risk per trade (volume x stop distance x pip value) and its variance; detect sizing up after losses (revenge / martingale signature).
- **Over-trading and tilt** — trade clustering, and whether trades taken right after a loss underperform.
- **Concentration and session/day leaks** — extends the existing attribution: which symbol/session/day is robustly negative, with the simulated expectancy if you filtered it out.

Bare P&L logs (no SL/TP/prices) degrade gracefully to the subset that is still computable (concentration, session/day, streaks). Diagnostic depth scales with export richness, which is also a nudge to upload the full report.

### Tier B — market price data (the premium core)

Fetch intraday OHLC for each trade's symbol around its window. Then:

- **MAE / MFE and efficiency** — how far price went against you and for you, and how much of the available move you captured. "You banked 41% of the move that was there."
- **Stop / target what-ifs** — replay each trade against the real price path with a wider/tighter stop and nearer/further target; produce the expectancy surface and the levels that would have maximised it on your trades.
- **"Would a wider stop have saved it?"** — share of losers that reversed to profit inside the trade window. A concrete, quantified stop-too-tight signal.
- **Entry-timing quality** — did you enter near a local extreme or chase mid-move.
- **Strategy fingerprint** — indicator context at entry (trend, RSI, ATR, distance from a moving average, session). Reads like "your trades behave as if: sell overbought momentum in a downtrend, London session." Labeled honestly as a statistical pattern of behaviour, never as recovered rules.

### Tier C — AI coaching narrative (Anthropic SDK)

Feed the **computed diagnostics** (not raw data) to Claude to produce a plain-English coaching report: the top three leaks, the fix, prioritised by R impact. Strictly grounded in the verified numbers so it cannot invent findings. This is the "personal quant coach" feel and fits the AI-augmented positioning.

## Honesty guardrails (these are the moat)

- Every what-if is in-sample. Show a robustness check on each suggested change (does the "optimal" stop hold across both halves? if it flips sign, flag it). Reuse the out-of-sample discipline that defines the brand.
- Fingerprint is "your trades behave as if," never "your strategy is."
- Corrections are hypotheses to forward-test, never guarantees. Honest, and legally safer.
- If a symbol can't be matched to data, say so. Never fabricate a price path.

## Data plan

- **Symbol normalisation.** Strip broker suffixes to a canonical symbol: `XAUUSDm` -> `XAUUSD`, `EURUSDm` -> `EURUSD` (Exness "m" = micro; others use `.r`, `_i`, `pro`, `.a`). A mapping table + heuristics.
- **Source (start with one).** **Dukascopy** for FX, metals, indices, and major crypto: free, no key, M1 and finer. It covers essentially the whole MT5 FX/gold audience. Add Twelve Data / Polygon later for stocks, exchange APIs for broader crypto.
- **Coverage check with a real log.** The owner's Exness export uses XAUUSDm, EURUSDm, GBPUSDm, USDJPYm, GBPJPYm, GBPCADm, USDCADm, USDCHFm, AUDUSDm, NZDJPYm, AUDNZDm, GBPNZDm, GBPCHFm, AUDCADm. Dukascopy has every one. That is strong evidence Tier B is feasible for the target user, and it is a ready-made test fixture.
- **Granularity.** M1 candles approximate MAE/MFE via the window high/low; good enough for diagnostics with a stated caveat. Tick later if needed.
- **Caching.** Cache fetched candles (Redis/Blob) keyed by symbol+range to stay inside rate limits and keep it cheap.
- Server-side, layered: a `marketData` service with provider adapters (Dukascopy first) and a `diagnostics` engine that consumes trades + candles.

## Pricing (reframed)

Price on the customer's upside (real R recovered / a course they don't need to buy), not our cost.

- **Free:** verdict + attribution + log-only concentration/session diagnostics, shown as a teaser ("3 leaks found — unlock the fixes"). Publishing/badge/PDF free.
- **Paid:** full Tier A + Tier B what-ifs + the AI coaching report. One-time **deep diagnosis $19–$49** per report, or **$19–$49/mo** for ongoing (re-run as you trade; tracks your improvement). The subscription is stickier and worth testing as the default.

Traders pay hundreds for courses, prop-firm evaluations, and mentors. "Here is your leak and the fix, proven on your own R" is comfortably a $30 decision, and far stronger than a badge.

## Build sequence (lean -> premium)

1. **Parser enrichment** — capture entry/exit price, SL, TP, volume, open+close time from rich exports. Backward compatible; `Trade` gains optional fields.
2. **Log-only diagnostics engine** (`src/lib/diagnostics/`) — the Tier A checks producing a ranked "leaks" list with quantified impact. Pure, unit-tested. Free teaser + paid detail.
3. **Market-data service** — Dukascopy adapter + symbol normalisation + candle cache. Validate coverage on the owner's Exness log first.
4. **Tier B engine** — MAE/MFE, stop/target what-ifs with the robustness guardrail.
5. **Tier C** — AI coaching narrative grounded in the diagnostics.
6. **Repackage the paywall** — gate the fix layer; make publishing free.

## Risks / kill criteria

- **Symbol/data coverage.** If we can't match a meaningful share of symbols to price data, Tier B is thin. De-risk in step 3 using the real Exness log (already looks fully covered).
- **Overfitting the what-ifs.** Contained by the in-sample robustness guardrail.
- **Willingness to pay still unproven.** Offer the deep diagnosis to the warm LinkedIn leads before building Tier B/C; a "found 3 leaks costing you 0.2R each, here's the fix" hook is far more compelling than a badge.

## Status (built)

- **Tier A** — shipped. Log-only leaks in `src/lib/diagnostics`.
- **Tier B** — shipped. `src/lib/marketData` (symbol normalisation + Dukascopy fetch, merged narrow windows, Redis cache, retry + per-range timeout + overall deadline so the route always returns in time) feeds `src/lib/diagnostics/marketDiagnose.ts` (capture efficiency, stop-too-tight). Runs server-side via `POST /api/diagnose`.
- **Tier C** — shipped. `src/lib/ai/coach.ts` (Claude `claude-opus-4-8`, grounded system prompt, narrates only the computed facts).

### Deployment setup

- **`ANTHROPIC_API_KEY`** (Vercel env) — required for the Tier C coaching note. Without it the deep diagnosis still runs the market checks and shows an honest "AI note not configured" line.
- **Upstash Redis / Vercel KV** (already wired for reports) — also caches fetched candles for 30 days, so repeat deep diagnoses are instant. Optional; without it every run refetches.
- Dukascopy needs no key. Coverage depends on the feed being reachable at request time; the route degrades to "couldn't match your symbols" rather than hanging.

## First slice to build

Steps 1–2 (parser enrichment + the log-only diagnostics engine), because they need no external data, work today on the owner's own Exness export, and already deliver "here is what to fix." That output doubles as the paid teaser and the validation asset for outreach. Market data (steps 3–4) follows once the diagnosis clearly lands.
