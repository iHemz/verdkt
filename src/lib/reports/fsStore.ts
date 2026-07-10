// Filesystem-backed report store for local dev and tests. Writes one JSON file
// per report under .data/reports/. Not used in production (serverless disks are
// ephemeral) — see redisStore.ts.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { NewReport, ReportRecord, StoredReport } from "./types";
import { newManageToken, newReportId } from "./id";
import { sha256Hex, timingSafeEqual } from "./hash";
import type { ReportStore } from "./store";

function dir(): string {
  return process.env.VERDKT_DATA_DIR || path.join(process.cwd(), ".data", "reports");
}
const file = (id: string) => path.join(dir(), `${id}.json`);

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

export function fsStore(): ReportStore {
  return {
    async create(input: NewReport, opts?: { paid?: boolean }) {
      await fs.mkdir(dir(), { recursive: true });
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
      await fs.writeFile(file(id), JSON.stringify(rec), "utf8");
      return { report: toPublic(rec), manageToken };
    },

    async get(id: string) {
      try {
        const raw = await fs.readFile(file(id), "utf8");
        const rec = JSON.parse(raw) as ReportRecord;
        return rec.paid ? toPublic(rec) : null;
      } catch {
        return null;
      }
    },

    async markPaid(id: string) {
      try {
        const raw = await fs.readFile(file(id), "utf8");
        const rec = JSON.parse(raw) as ReportRecord;
        if (!rec.paid) {
          rec.paid = true;
          await fs.writeFile(file(id), JSON.stringify(rec), "utf8");
        }
        return true;
      } catch {
        return false;
      }
    },

    async remove(id: string, manageToken: string) {
      try {
        const raw = await fs.readFile(file(id), "utf8");
        const rec = JSON.parse(raw) as ReportRecord;
        const match = timingSafeEqual(rec.manageTokenHash, await sha256Hex(manageToken));
        if (!match) return false;
        await fs.unlink(file(id));
        return true;
      } catch {
        return false;
      }
    },
  };
}
