// Payment configuration. Publishing is free until Stripe is configured, which
// also serves as a clean "free beta" mode.

export function paymentEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PRICE_ID);
}

/**
 * Redis REST credentials, accepting either the Upstash-native names or Vercel's
 * official Redis integration names (KV_REST_API_*). Returns null when unset.
 */
export function redisCredentials(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

/** True when a durable (Redis) report store is configured. */
export function hasDurableStore(): boolean {
  return redisCredentials() !== null;
}

/** Price shown in the UI. Cosmetic only; the real charge comes from the Stripe Price. */
export const REPORT_PRICE_LABEL = process.env.NEXT_PUBLIC_REPORT_PRICE || "$29";
