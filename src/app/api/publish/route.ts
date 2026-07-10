// Publish a verdict as a Verdkt Verified report. The server re-runs analyze()
// from the submitted trades so the published verdict is always our own
// computation. Free when Stripe is unconfigured; otherwise returns a Stripe
// Checkout URL and the report stays an unpaid draft until payment is confirmed.

import { NextResponse, type NextRequest } from "next/server";
import { analyze } from "@/lib/analysis";
import { coerceTrades, getStore, sanitizeAuthor, sanitizeTitle } from "@/lib/reports";
import { hasDurableStore, paymentEnabled } from "@/lib/reports/config";
import { stripe } from "@/lib/payments/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // On serverless (Vercel) the filesystem store isn't durable; require Redis.
  if (process.env.VERCEL && !hasDurableStore()) {
    return NextResponse.json(
      { error: "Publishing is being set up and isn't available yet. Please check back soon." },
      { status: 503 },
    );
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const trades = coerceTrades(b.trades);
  if (trades.length < 30) {
    return NextResponse.json(
      { error: "Need at least 30 trades to publish an honest report." },
      { status: 400 },
    );
  }

  const analysis = analyze(trades);
  const title = sanitizeTitle(b.title);
  const author = sanitizeAuthor(b.author);

  const store = await getStore();
  const gated = paymentEnabled();
  const { report, manageToken } = await store.create(
    { title, author, disclosure: "submitted-data", analysis },
    { paid: !gated },
  );

  if (!gated) {
    return NextResponse.json({
      mode: "free",
      id: report.id,
      manageToken,
      url: `/r/${report.id}`,
    });
  }

  const origin = new URL(req.url).origin;
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!, quantity: 1 }],
    metadata: { reportId: report.id },
    success_url: `${origin}/r/${report.id}?session_id={CHECKOUT_SESSION_ID}&mt=${manageToken}`,
    cancel_url: `${origin}/?canceled=1`,
  });

  return NextResponse.json({
    mode: "checkout",
    id: report.id,
    manageToken,
    checkoutUrl: session.url,
  });
}
