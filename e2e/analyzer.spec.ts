import { expect, test } from "@playwright/test";

test.describe("Verdkt analyzer", () => {
  test("landing page renders the hero and dropzone", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Verdkt/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("honest verdict");
    await expect(page.getByLabel("Upload a trade log CSV")).toBeVisible();
  });

  test("analyses the built-in sample and shows the sign-flip verdict", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /try a sample log/i }).click();

    await expect(page.getByRole("status")).toHaveText("NO ROBUST EDGE");
    await expect(page.getByText("The five checks")).toBeVisible();
    await expect(page.getByText(/sign flip vs first half/i)).toBeVisible();
    await expect(page.getByRole("img", { name: /Cumulative R equity curve/i })).toBeVisible();
    await expect(page.getByText("Where the edge lives")).toBeVisible();
  });

  test("returns to the dropzone via 'Analyse another log'", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /try a sample log/i }).click();
    await page.getByRole("button", { name: /analyse another log/i }).click();
    await expect(page.getByLabel("Upload a trade log CSV")).toBeVisible();
  });

  test("shows an error for an unrecognised paste", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /paste csv instead/i }).click();
    await page.getByLabel("Paste trade log CSV").fill("foo,bar\n1,2");
    await page.getByRole("button", { name: /analyse pasted log/i }).click();
    await expect(page.getByText(/profit\/loss or R-multiple column/i)).toBeVisible();
  });
});
