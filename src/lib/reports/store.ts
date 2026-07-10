// Storage abstraction for published reports. The app depends only on this
// interface; swapping filesystem (dev) for Redis (prod) or Postgres (v2) is a
// new adapter, not an app change.

import type { NewReport, StoredReport } from "./types";

export interface ReportStore {
  /**
   * Persist a new report. `paid` gates public visibility: pass false to create
   * an unpaid draft (Stripe flow), true to publish immediately (free flow).
   */
  create(
    input: NewReport,
    opts?: { paid?: boolean },
  ): Promise<{ report: StoredReport; manageToken: string }>;
  /** Fetch the public report, or null if it doesn't exist or isn't paid. */
  get(id: string): Promise<StoredReport | null>;
  /** Flip an unpaid draft to paid after payment is confirmed. Returns whether it existed. */
  markPaid(id: string): Promise<boolean>;
  /** Delete a report if the manage token matches. Returns whether it was removed. */
  remove(id: string, manageToken: string): Promise<boolean>;
}

let cached: ReportStore | null = null;

/**
 * Pick the store from the environment: Upstash Redis when its env vars are
 * present (production), otherwise the local filesystem store (dev/test).
 */
export async function getStore(): Promise<ReportStore> {
  if (cached) return cached;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { redisStore } = await import("./redisStore");
    cached = redisStore();
  } else {
    const { fsStore } = await import("./fsStore");
    cached = fsStore();
  }
  return cached;
}
