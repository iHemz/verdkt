import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DimensionAttribution } from "@/lib/analysis";
import { Attribution } from "./Attribution";

const dims: DimensionAttribution[] = [
  {
    key: "symbol",
    label: "Symbol",
    insight: "80% of the positive R in your log comes from symbol = EUR_USD.",
    segments: [
      { label: "EUR_USD", n: 40, expectancyR: 0.5, winRate: 0.6, totalR: 20, share: 0.5, robust: true, role: "carrier" },
      { label: "GBP_USD", n: 40, expectancyR: -0.5, winRate: 0.4, totalR: -20, share: 0.5, robust: true, role: "drag" },
      { label: "AUD_USD", n: 8, expectancyR: 0.4, winRate: 0.6, totalR: 3.2, share: 0.1, robust: false, role: "thin" },
    ],
  },
];

describe("Attribution", () => {
  it("renders nothing when there are no dimensions", () => {
    const { container } = render(<Attribution dimensions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the section, the dimension label and its segments", () => {
    render(<Attribution dimensions={dims} />);
    expect(screen.getByText("Where the edge lives")).toBeInTheDocument();
    expect(screen.getByText("Symbol")).toBeInTheDocument();
    expect(screen.getByText("EUR_USD")).toBeInTheDocument();
    expect(screen.getByText("GBP_USD")).toBeInTheDocument();
  });

  it("labels each segment's role", () => {
    render(<Attribution dimensions={dims} />);
    expect(screen.getByText("carrier")).toBeInTheDocument();
    expect(screen.getByText("drag")).toBeInTheDocument();
    expect(screen.getByText("too thin")).toBeInTheDocument();
  });

  it("shows the insight line", () => {
    render(<Attribution dimensions={dims} />);
    expect(screen.getByText(/comes from symbol = EUR_USD/)).toBeInTheDocument();
  });
});
