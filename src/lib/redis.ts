// Single Redis client for the whole app (report store, rate limiting). Returns
// null when no Redis is configured, so callers can degrade gracefully in dev.

import { Redis } from "@upstash/redis";
import { redisCredentials } from "@/lib/reports/config";

let client: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const creds = redisCredentials();
  client = creds ? new Redis({ url: creds.url, token: creds.token }) : null;
  return client;
}
