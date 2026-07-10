// Production report store backed by Upstash Redis (provisioned via the Vercel
// Marketplace). Activated automatically when UPSTASH_REDIS_REST_URL/TOKEN are
// set — see getStore() in store.ts. Only imported when those env vars exist.

import { Redis } from "@upstash/redis";
import type { NewReport, ReportRecord, StoredReport } from "./types";
import { newManageToken, newReportId } from "./id";
import { sha256Hex, timingSafeEqual } from "./hash";
import { redisCredentials } from "./config";
import type { ReportStore } from "./store";

const key = (id: string) => `report:${id}`;

function toPublic(rec: ReportRecord): StoredReport {
  return {
    id: rec.id,
    createdAt: rec.createdAt,
    title: rec.title,
    author: rec.author,
    disclosure: rec.disclosure,
    analysis: rec.analysis,
  };
}

export function redisStore(): ReportStore {
  const creds = redisCredentials();
  if (!creds) throw new Error("Redis is not configured.");
  const redis = new Redis({ url: creds.url, token: creds.token });

  return {
    async create(input: NewReport, opts?: { paid?: boolean }) {
      const id = newReportId();
      const manageToken = newManageToken();
      const rec: ReportRecord = {
        id,
        createdAt: Date.now(),
        title: input.title,
        author: input.author,
        disclosure: input.disclosure,
        analysis: input.analysis,
        manageTokenHash: await sha256Hex(manageToken),
        paid: opts?.paid ?? true,
      };
      await redis.set(key(id), rec);
      return { report: toPublic(rec), manageToken };
    },

    async get(id: string) {
      const rec = await redis.get<ReportRecord>(key(id));
      return rec && rec.paid ? toPublic(rec) : null;
    },

    async markPaid(id: string) {
      const rec = await redis.get<ReportRecord>(key(id));
      if (!rec) return false;
      if (!rec.paid) {
        rec.paid = true;
        await redis.set(key(id), rec);
      }
      return true;
    },

    async remove(id: string, manageToken: string) {
      const rec = await redis.get<ReportRecord>(key(id));
      if (!rec) return false;
      if (!timingSafeEqual(rec.manageTokenHash, await sha256Hex(manageToken))) return false;
      await redis.del(key(id));
      return true;
    },
  };
}
