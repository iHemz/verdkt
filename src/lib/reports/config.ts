// Payment configuration. Publishing is free until Stripe is configured, which
// also serves as a clean "free beta" mode.

export function paymentEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PRICE_ID);
}

/** Price shown in the UI. Cosmetic only; the real charge comes from the Stripe Price. */
export const REPORT_PRICE_LABEL = process.env.NEXT_PUBLIC_REPORT_PRICE || "$29";
