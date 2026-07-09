import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Analyzer } from "./Analyzer";

describe("Analyzer (assembly)", () => {
  it("starts on the dropzone with no verdict shown", () => {
    render(<Analyzer />);
    expect(screen.getByLabelText("Upload a trade log CSV")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("analyses the built-in sample end-to-end and shows NO ROBUST EDGE", async () => {
    const user = userEvent.setup();
    render(<Analyzer />);

    await user.click(screen.getByRole("button", { name: /try a sample log/i }));

    expect(screen.getByRole("status")).toHaveTextContent("NO ROBUST EDGE");
    expect(screen.getByText("The five checks")).toBeInTheDocument();
    expect(screen.getByText(/built-in sample log/i)).toBeInTheDocument();
  });

  it("can return to the dropzone after a result", async () => {
    const user = userEvent.setup();
    render(<Analyzer />);

    await user.click(screen.getByRole("button", { name: /try a sample log/i }));
    await user.click(screen.getByRole("button", { name: /analyse another log/i }));

    expect(screen.getByLabelText("Upload a trade log CSV")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows a parser error for an unrecognised paste", async () => {
    const user = userEvent.setup();
    render(<Analyzer />);

    await user.click(screen.getByRole("button", { name: /paste csv instead/i }));
    await user.type(screen.getByLabelText("Paste trade log CSV"), "foo,bar\n1,2");
    await user.click(screen.getByRole("button", { name: /analyse pasted log/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/profit\/loss or R-multiple column/i);
  });

  it("analyses valid pasted CSV", async () => {
    const user = userEvent.setup();
    render(<Analyzer />);

    const csv = ["R", ...Array.from({ length: 60 }, (_, i) => (i % 3 === 0 ? "-1" : "0.9"))].join(
      "\n",
    );
    await user.click(screen.getByRole("button", { name: /paste csv instead/i }));
    await user.type(screen.getByLabelText("Paste trade log CSV"), csv);
    await user.click(screen.getByRole("button", { name: /analyse pasted log/i }));

    expect(screen.getByRole("status")).toHaveTextContent(/EDGE|PROMISING/);
  });
});
