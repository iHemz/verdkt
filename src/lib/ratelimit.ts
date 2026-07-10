// IP rate limiting for the public API. Uses Upstash sliding-window when Redis
// is configured; falls back to always-allow in local dev (no Redis).

import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "@/lib/redis";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  /** epoch ms when the window resets */
  reset: number;
};

/** Open-beta budget for the public analyze endpoint. */
const WINDOW = { tokens: 30, window: "10 m" } as const;

let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  const redis = getRedis();
  limiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(WINDOW.tokens, WINDOW.window),
        prefix: "vk:rl:v1analyze",
        analytics: false,
      })
    : null;
  return limiter;
}

export async function rateLimit(identifier: string): Promise<RateLimitResult> {
  const l = getLimiter();
  if (!l) {
    return { success: true, limit: WINDOW.tokens, remaining: WINDOW.tokens, reset: Date.now() };
  }
  const { success, limit, remaining, reset } = await l.limit(identifier);
  return { success, limit, remaining, reset };
}

/** Standard rate-limit response headers. */
export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "x-ratelimit-limit": String(r.limit),
    "x-ratelimit-remaining": String(Math.max(0, r.remaining)),
    "x-ratelimit-reset": String(Math.ceil(r.reset / 1000)),
  };
}
