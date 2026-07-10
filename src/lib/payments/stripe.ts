// Lazy Stripe client. Only constructed when STRIPE_SECRET_KEY is set, so the
// app runs fine (free mode) without any Stripe configuration.

import Stripe from "stripe";

let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing).");
  if (!client) client = new Stripe(key);
  return client;
}
