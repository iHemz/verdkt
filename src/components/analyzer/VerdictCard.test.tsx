import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { analyze, parseTradeLog, sampleTradeLogCsv } from "@/lib/analysis";
import { VerdictCard } from "./VerdictCard";

function sampleAnalysis() {
  return analyze(parseTradeLog(sampleTradeLogCsv()).trades);
}

describe("VerdictCard", () => {
  it("renders the verdict headline and summary", () => {
    render(<VerdictCard analysis={sampleAnalysis()} />);
    expect(screen.getByRole("status")).toHaveTextContent("NO ROBUST EDGE");
    expect(screen.getByText(/fools its author/i)).toBeInTheDocument();
  });

  it("renders the core stat labels", () => {
    render(<VerdictCard analysis={sampleAnalysis()} />);
    expect(screen.getByText("Win rate")).toBeInTheDocument();
    expect(screen.getByText("Payoff")).toBeInTheDocument();
    expect(screen.getByText("Max drawdown")).toBeInTheDocument();
  });

  it("renders all five checks", () => {
    render(<VerdictCard analysis={sampleAnalysis()} />);
    expect(screen.getByText("Positive expectancy per trade")).toBeInTheDocument();
    expect(screen.getByText("Edge holds out of sample")).toBeInTheDocument();
    expect(screen.getByText("Distinguishable from noise")).toBeInTheDocument();
    expect(screen.getByText("Enough trades to trust it")).toBeInTheDocument();
  });

  it("shows the R-proxy note when R was derived from P&L", () => {
    render(<VerdictCard analysis={sampleAnalysis()} />);
    expect(screen.getByText(/No R-multiple column found/i)).toBeInTheDocument();
  });

  it("surfaces parser warnings passed to it", () => {
    render(<VerdictCard analysis={sampleAnalysis()} warnings={["heads up"]} />);
    expect(screen.getByText(/heads up/i)).toBeInTheDocument();
  });

  it("renders the edge-attribution section for a log with dimensions", () => {
    render(<VerdictCard analysis={sampleAnalysis()} />);
    expect(screen.getByText("Where the edge lives")).toBeInTheDocument();
    expect(screen.getByText("Symbol")).toBeInTheDocument();
  });
});
