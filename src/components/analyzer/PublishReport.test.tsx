import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test-utils/render";
import { PublishReport } from "./PublishReport";

const rTrades = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ pnl: i % 3 === 2 ? -1 : 0.9, r: i % 3 === 2 ? -1 : 0.9 }));

describe("PublishReport", () => {
  it("prompts for more trades below the minimum", () => {
    renderWithProviders(<PublishReport trades={rTrades(10)} />);
    expect(screen.getByText(/at 30\+ trades/i)).toBeInTheDocument();
  });

  it("blocks publishing until the disclosure is acknowledged (zod validation)", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderWithProviders(<PublishReport trades={rTrades(60)} />);

    await user.click(screen.getByRole("button", { name: /publish a verified report/i }));
    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByText(/acknowledge this before publishing/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
