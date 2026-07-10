# Verdkt Verified — production setup

The free tool (analysis) needs no configuration. The **Verified** layer (published
reports + badge) needs a durable store, and payments need Stripe. Both activate
purely from environment variables, no code changes.

## Local development

Nothing to set up. Reports are written to `.data/reports/` (gitignored) and
publishing is free. Run `pnpm dev` and try it end to end.

## Production: storage (required for Verified)

Serverless filesystems are read-only/ephemeral, so a hosted key-value store is
required. Until it's set, the publish endpoint returns a friendly "being set up"
message instead of erroring.

1. Vercel dashboard → your `verdkt` project → **Storage** → add **Upstash Redis**
   (Marketplace, free tier is fine). Vercel injects the env vars automatically.
2. Confirm these exist in Project → Settings → Environment Variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Redeploy (or push any commit). Publishing now persists.

With storage set and no Stripe, **publishing is free** — a clean way to launch a
beta and gather the first Verified reports before charging.

## Production: payments (optional, to charge for reports)

1. Create a **Stripe** account. In test mode first, add a Product with a one-time
   Price (e.g. $29). Copy the Price ID (`price_...`).
2. Set these env vars in Vercel:
   - `STRIPE_SECRET_KEY` = `sk_test_...` (then `sk_live_...` when ready)
   - `NEXT_PUBLIC_STRIPE_PRICE_ID` = `price_...`
   - `NEXT_PUBLIC_REPORT_PRICE` = `$29` (cosmetic label shown in the UI)
3. Redeploy. Publishing now routes through Stripe Checkout; a report stays an
   unpaid draft (not public) until payment is confirmed on return.

Test with Stripe's `4242 4242 4242 4242` card in test mode.

### v1 payment flow (how it works)

- The client posts the trades to `/api/publish`; the server re-runs `analyze()`
  so the published verdict is always our own computation, never client-supplied.
- Free mode: the report is created and shown immediately.
- Paid mode: an unpaid draft is created, the user is sent to Stripe Checkout, and
  on return to `/r/[id]?session_id=...` the server verifies the session is paid
  and flips the draft to public.
- **Hardening for later (v2):** add a Stripe webhook (`checkout.session.completed`)
  so the report is confirmed even if the user closes the tab before returning. The
  success-page verification covers the normal path in v1.

## Environment variable summary

| Var | Required for | Notes |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Verified in prod | from Vercel Upstash integration |
| `UPSTASH_REDIS_REST_TOKEN` | Verified in prod | from Vercel Upstash integration |
| `STRIPE_SECRET_KEY` | Charging for reports | test key first |
| `NEXT_PUBLIC_STRIPE_PRICE_ID` | Charging for reports | the one-time Price |
| `NEXT_PUBLIC_REPORT_PRICE` | Cosmetic | price label in the UI |
| `VERDKT_DATA_DIR` | Local only | overrides the dev report directory |
