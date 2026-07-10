import { describe, expect, it } from "vitest";
import { POST } from "./route";

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/v1/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/analyze", () => {
  it("returns a verdict for a trades array", async () => {
    const trades = Array.from({ length: 60 }, (_, i) => ({
      pnl: i % 3 === 2 ? -1 : 0.9,
      r: i % 3 === 2 ? -1 : 0.9,
    }));
    const res = await POST(makeReq({ trades }));
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");

    const data = await res.json();
    expect(data.apiVersion).toBe("v1");
    expect(typeof data.verdict).toBe("string");
    expect(data.metrics.trades).toBe(60);
  });

  it("accepts a raw csv string", async () => {
    const csv = ["Profit", ...Array.from({ length: 40 }, (_, i) => String(i % 3 === 2 ? -1 : 0.9))].join(
      "\n",
    );
    const res = await POST(makeReq({ csv }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.metrics.trades).toBe(40);
  });

  it("returns 400 when neither trades nor csv is provided", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 with a message for an unparseable csv", async () => {
    const res = await POST(makeReq({ csv: "foo,bar\n1,2" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/profit|column/i);
  });
});
