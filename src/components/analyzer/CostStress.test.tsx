import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CostStress } from "./CostStress";

// 240 trades, mean +0.2667R => EDGE HOLDS UP before costs
const strong = Array.from({ length: 240 }, (_, i) => (i % 3 === 2 ? -1 : 0.9));
const baseR = strong.reduce((a, b) => a + b, 0) / strong.length;

describe("CostStress", () => {
  it("shows the pre-cost verdict at zero cost", () => {
    render(<CostStress rSeries={strong} baseExpectancyR={baseR} />);
    expect(screen.getByText("EDGE HOLDS UP")).toBeInTheDocument();
    expect(screen.getByText(/No cost applied yet/i)).toBeInTheDocument();
  });

  it("degrades the verdict when a preset cost is applied", async () => {
    const user = userEvent.setup();
    render(<CostStress rSeries={strong} baseExpectancyR={baseR} />);

    await user.click(screen.getByRole("button", { name: "0.20R" }));
    // +0.2667R minus 0.20R is still positive but no longer clears the bar
    expect(screen.queryByText("EDGE HOLDS UP")).not.toBeInTheDocument();
  });

  it("flips to NO EDGE and warns it does not survive under a heavy cost", () => {
    render(<CostStress rSeries={strong} baseExpectancyR={baseR} />);
    fireEvent.change(screen.getByLabelText(/Custom round-trip cost/i), {
      target: { value: "0.4" },
    });
    expect(screen.getByText("NO EDGE")).toBeInTheDocument();
    expect(screen.getByText(/does not survive/i)).toBeInTheDocument();
  });
});
