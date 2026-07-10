import { afterAll, beforeAll, describe, expect, it } from "vitest";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { analyze } from "@/lib/analysis";
import { fsStore } from "./fsStore";
import type { NewReport } from "./types";

const dir = path.join(os.tmpdir(), `verdkt-test-${Date.now()}`);

beforeAll(() => {
  process.env.VERDKT_DATA_DIR = dir;
});
afterAll(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

function sampleReport(): NewReport {
  const rs = Array.from({ length: 60 }, (_, i) => (i % 3 === 2 ? -1 : 0.9));
  return {
    title: "Test strategy",
    author: "@tester",
    disclosure: "submitted-data",
    analysis: analyze(rs.map((r) => ({ pnl: r, r }))),
  };
}

describe("fsStore", () => {
  it("creates and reads a report back without exposing the manage token", async () => {
    const store = fsStore();
    const { report, manageToken } = await store.create(sampleReport());
    expect(report.id).toMatch(/^[0-9a-z]{8}$/);
    expect(manageToken).toHaveLength(32);

    const got = await store.get(report.id);
    expect(got?.title).toBe("Test strategy");
    expect(got?.analysis.verdict).toBeDefined();
    expect((got as unknown as { manageTokenHash?: string }).manageTokenHash).toBeUndefined();
  });

  it("returns null for a missing id", async () => {
    expect(await fsStore().get("missing00")).toBeNull();
  });

  it("removes only with the correct manage token", async () => {
    const store = fsStore();
    const { report, manageToken } = await store.create(sampleReport());

    expect(await store.remove(report.id, "wrong-token")).toBe(false);
    expect(await store.get(report.id)).not.toBeNull();

    expect(await store.remove(report.id, manageToken)).toBe(true);
    expect(await store.get(report.id)).toBeNull();
  });
});
