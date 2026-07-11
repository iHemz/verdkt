import { describe, expect, it } from "vitest";
import { toDukascopyInstrument } from "./symbols";

describe("toDukascopyInstrument", () => {
  it("strips Exness-style broker suffixes", () => {
    expect(toDukascopyInstrument("XAUUSDm")).toBe("xauusd");
    expect(toDukascopyInstrument("EURUSDm")).toBe("eurusd");
    expect(toDukascopyInstrument("GBPCADm")).toBe("gbpcad");
  });

  it("handles punctuation-style suffixes", () => {
    expect(toDukascopyInstrument("EURUSD.r")).toBe("eurusd");
    expect(toDukascopyInstrument("USDJPY_i")).toBe("usdjpy");
  });

  it("passes through a clean instrument", () => {
    expect(toDukascopyInstrument("audusd")).toBe("audusd");
  });

  it("returns null for the unmappable", () => {
    expect(toDukascopyInstrument("NOTAREALPAIR")).toBeNull();
    expect(toDukascopyInstrument(undefined)).toBeNull();
    expect(toDukascopyInstrument("")).toBeNull();
  });
});
