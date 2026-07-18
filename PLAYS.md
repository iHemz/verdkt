# Verdkt — Plays

**What it is:** an honest trading-strategy analyzer. Drop a trade log, get a verdict on
whether the edge is real, fragile, or fictional (expectancy in R, out-of-sample stability,
significance, sample size), plus a "what to fix" diagnostics layer. Deliberately built to
prove a strategy *wrong*.
**Stage:** LIVE at verdkt.vercel.app. Next.js/React/TypeScript, TanStack Query, Anthropic SDK,
Dukascopy market data, Stripe wiring, Upstash Redis.

**Through-line (shared across my products):** grounded, honest AI that shows its work and
knows when *not* to act. Verdkt is the flagship of that brand: it refuses to flatter the
trader. Orviqo asks before dunning; Trajekt grounds every stage; Tariffa flags but never fakes
a filing. Same brand, four markets.

**How to use:** from this repo's Claude Code session, run `/play product` (or `career` /
`audience`), or say "run the product play". Do the next unchecked step, then update its Status.

---

## Product play

**Thesis.** Traders trust backtests that lie to them. Verdkt gives the honest verdict for free,
then sells the fix: where the edge leaks and exactly what to change, measured on the user's own
trades. People pay for the money you show them they are leaving on the table, not for a badge.

**ICP.** Retail/prop FX and crypto traders, strategy sellers, and the skeptical quant-curious
crowd. Warm inbound already came from the LinkedIn essay.

**Wedge → expansion.**
- Free: the verdict + attribution + cost stress. Publishing/badge/PDF free (growth, not product).
- Paid: the diagnostic/coaching "fix" (Tier A log-only leaks, Tier B market-data what-ifs, Tier C
  AI coaching note) plus the Validation API for agents/automation.

**Pricing.** Free verdict; deep diagnosis as one-time ($19-49) or subscription ($19-49/mo).
Currently un-paywalled on purpose, to validate willingness to pay first.

**Moat / honesty angle.** The brand is refusing to flatter. Out-of-sample discipline, in-sample
caveats on every simulated fix, grounded AI that narrates only verified numbers. Hard to copy
without the rigor.

**Metrics to capture.** Deep-diagnosis runs, free→paid intent, cash/R "leaks" surfaced, API usage.

**Next steps.**
- [x] Ship free verdict engine + attribution + cost stress
- [x] Ship Verified publish/badge + Validation API
- [x] Ship Tier A (log-only) + Tier B (market data) + Tier C (AI coach) diagnostics
- [ ] Set `ANTHROPIC_API_KEY` in Vercel so the Tier C coaching note runs in prod
- [ ] Gate the deep diagnosis behind payment (Stripe) and run a willingness-to-pay test
- [ ] Offer the deep diagnosis to the warm LinkedIn leads

**Status:** LIVE, full free + diagnostics stack shipped; monetization gate + WTP test not started

---

## Career play

**The story it tells.** "I built a quant-research tool disciplined enough to prove its own
strategy had no robust edge, before any real capital." Rare signal: honesty and rigor over
wishful backtests. Pairs with the AI-native full-stack build (grounded LLM, market-data
integration, payments).

**Positioning line.** "AI-augmented full-stack engineer who ships grounded, rigorous products
end to end."

**Case-study + interview ammo (`/work/verdkt`).** The five-checks method; the multi-section MT5
parser bug I caught (AI-written code read account balances as trade P&L, so a losing account
scored a passing verdict); bounding a flaky market-data feed with caching, retries, and hard
timeouts; grounded Tier C narrative that cannot fabricate findings.

**Where to deploy.** Portfolio, YC Work-at-a-Startup, Djinni, LinkedIn. Already used in pitches.

**Next steps.**
- [x] Portfolio case study `/work/verdkt`
- [x] Used in YC + Djinni pitches (bug-catch + honesty story)
- [ ] Refresh case study with the Tier A/B/C diagnostics + a real deep-diagnosis screenshot

**Status:** in portfolio and active pitches; refresh with the new diagnostics layer

---

## Audience play

**Narrative.** "Is your backtest lying to you?" Honest quant research in public. The essay
"How to Build a Backtest That Can Prove You Wrong" is the anchor.

**Hooks.**
- "My own strategy failed my own test. That is the point."
- "Everyone ships AI that acts confidently. I ship AI that refuses to flatter you."
- The "what to fix" reveal: showing a trader the R they leak and how to get it back.

**Angles.** The five checks; the parser-bug war story; capture-efficiency / stop-too-tight demos;
the grounded-AI-coach thesis; build-in-public toward first paying user.

**Channels + cadence.** LinkedIn primary (post #1 already landed real engagement), X for
build-in-public, portfolio essays. Weekly + milestone posts.

**Assets to produce.** Verdict screenshots, "what to fix" clip, the deep-diagnosis coaching note,
before/after equity split.

**Next steps.**
- [x] Essay + post #1 live (real inbound engagement)
- [ ] Ship post #2 (in an open portfolio PR) and cross-post
- [ ] Post the "what to fix" / deep-diagnosis reveal once the AI coach runs in prod

**Status:** post #1 live with engagement; post #2 in an open PR; deep-diagnosis reveal pending
