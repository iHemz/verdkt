# Verdkt Verified — architecture & migration plan

_How the paid credibility layer is built in v1 (lean) and how it grows to v2 (full SaaS + broker-verified) without a rewrite._

## v1 goal (lean)

Let someone turn a Verdkt verdict into a **public, shareable report** at a stable URL, with an **embeddable badge** and a **printable PDF**, gated by a **one-time payment**. Submitted-data only, stated plainly. No user accounts.

The whole point is a credibility artifact the seller can show. So v1 must nail: a clean public report page, a badge that looks trustworthy, and honest labelling that this is method-verified on submitted data.

## The three v1 decisions

1. **No accounts.** A successful payment mints a report and returns a **secret manage link** (a token in the URL) the owner keeps to unpublish or replace it. This removes auth entirely from v1. Accounts arrive in v2 and adopt these reports.
2. **Storage is a thin adapter, not a schema.** A `ReportStore` interface with two implementations: a local filesystem store for dev, and a hosted key-value store (Upstash Redis / Vercel KV) for production. Swapping to Postgres in v2 means writing one more adapter, not touching the app.
3. **Payments behind an env flag.** If Stripe keys are absent (local dev), publishing is free so the flow is fully testable. In production, `/api/checkout` creates a Stripe Checkout session and the report is only minted after payment is confirmed.

## v1 shape (what gets built)

```
src/lib/reports/
  types.ts            StoredReport = { id, createdAt, title, author, disclosure, analysis }
  id.ts               short url-safe slug + a separate manage token
  store.ts            ReportStore interface + selectStore() (fs in dev, redis in prod)
  fsStore.ts          dev: JSON under .data/reports/ (gitignored)
  redisStore.ts       prod: @upstash/redis, keyed by id

src/app/
  r/[id]/page.tsx     PUBLIC report page — reuses <VerdictCard/>, adds Verified header,
                      submitted-data disclosure, author, date, embed snippet, print button
  api/reports/route.ts        POST create (gated by payment in prod), GET by id
  api/reports/[id]/route.ts   DELETE with manage token
  api/badge/[id]/route.ts     SVG badge: "VERDKT VERIFIED — <VERDICT>", links to /r/[id]
  api/checkout/route.ts       Stripe Checkout session (prod only)
  api/stripe/webhook/route.ts payment confirmation -> mint report

components/analyzer/
  PublishReport.tsx   the "Publish a verified report" flow on the results view
```

The public report page **reuses the existing `VerdictCard`**, so everything already built (verdict, five checks, cost stress, attribution) renders on the shared page for free. That is the payoff of keeping the analysis engine pure and the card presentational.

### Data flow (production)

1. User runs analysis in the browser (unchanged, client-side).
2. Clicks "Publish a verified report", enters a title + author handle, acknowledges the submitted-data disclosure.
3. `/api/checkout` -> Stripe Checkout. On payment, the webhook (or a signed return) mints a `StoredReport` via the store and returns `{ id, manageToken }`.
4. Public page lives at `/r/[id]`; badge at `/api/badge/[id].svg`; owner keeps the manage link.

In dev (no Stripe env), step 3 skips payment and mints directly, so the flow is testable end to end.

### What is stored

The `Analysis` JSON (verdict, stats, checks, attribution, rSeries) plus title, author handle, created date, and a `disclosure: "submitted-data"` marker. No raw trades are stored, only the computed analysis, which keeps the privacy story intact.

## What the owner must provision for production

- **Stripe** account + one Product/Price (test mode first). Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_ID`.
- **A key-value store** (Vercel Marketplace -> Upstash Redis, ~2 min). Env: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- Set them in Vercel project env vars. No keys, no code change needed: the adapters activate on presence of env.

## Honest limits of v1 (say them on the report)

- The badge means "these numbers, run through Verdkt's method, produce this verdict." It does **not** prove the trades are real. That is v2 (broker-verified). The report page states this in plain language so the badge never overclaims.

## v1 -> v2 migration (no rewrite)

| Concern | v1 (lean) | v2 (full SaaS) | Migration path |
| --- | --- | --- | --- |
| Identity | none; manage token per report | real accounts (magic-link or Clerk) | on first login, claim reports by manage token; token stays a fallback |
| Storage | KV (report JSON by id) | Postgres (users, reports, subscriptions) | new `ReportStore` (Postgres) adapter; backfill KV JSON into rows once |
| Billing | one-time Stripe Checkout | Stripe subscriptions + entitlements | reuse Stripe customer; add Billing Portal + webhook for sub state |
| Authenticity | submitted-data + disclosure | broker/exchange read-only connect (Myfxbook-style) | add an `import` source flag on reports; "Broker-Verified" becomes a distinct, higher badge tier |
| Report page | single public page | dashboard + versioned reports + re-verify | same `/r/[id]` page; add owner dashboard behind auth |

The load-bearing choices that make this painless: the storage adapter, storing computed `Analysis` (not a rigid schema), the manage-token model that accounts can later adopt, and reusing the presentational `VerdictCard` on the public page.

## Build order for v1

1. Report types + id/token + storage adapter (fs dev impl) with unit tests.
2. Public `/r/[id]` page reusing `VerdictCard` + the submitted-data disclosure.
3. `PublishReport` flow (dev/free mode) + `/api/reports`.
4. Badge SVG endpoint + embed snippet + print-to-PDF CSS.
5. Stripe Checkout gate behind env + webhook.
6. Redis adapter for production + provisioning doc.
7. Tests at each layer + e2e (publish -> report page renders).
