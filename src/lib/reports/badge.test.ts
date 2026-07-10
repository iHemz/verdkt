import { describe, expect, it } from "vitest";
import { badgeSvg } from "./badge";

describe("badgeSvg", () => {
  it("renders an SVG carrying the label and the verdict", () => {
    const svg = badgeSvg("NO ROBUST EDGE", "fail");
    expect(svg).toContain("<svg");
    expect(svg).toContain("VERDKT");
    expect(svg).toContain("VERIFIED");
    expect(svg).toContain("NO ROBUST EDGE");
  });

  it("handles the unverified fallback", () => {
    expect(badgeSvg("UNVERIFIED", "none")).toContain("UNVERIFIED");
  });

  it("escapes special characters so the SVG stays valid", () => {
    // verdicts are a fixed set, but the escaper must be robust
    const svg = badgeSvg("EDGE HOLDS UP", "pass");
    expect(svg).not.toContain("<script");
  });
});
