import { test, expect } from "@playwright/test";

test.describe("Search Page", () => {
  test("loads with no query and shows all clinics", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { name: /all iv therapy clinics/i })).toBeVisible();
    await expect(page.getByText(/result/i)).toBeVisible();
  });

  test("shows results for Seattle search", async ({ page }) => {
    await page.goto("/search?q=Seattle");
    await expect(page.getByText(/iv therapy clinics near/i)).toBeVisible();
    await expect(page.getByText(/seattle/i).first()).toBeVisible();
  });

  test("shows no results message for unknown city", async ({ page }) => {
    await page.goto("/search?q=ZZZNonexistentCityXXX");
    await expect(page.getByText(/no clinics found/i)).toBeVisible();
  });

  test("filters by rating using sidebar", async ({ page }) => {
    await page.goto("/search?q=Seattle");
    await page.getByText("4.5+ Stars").click();
    await expect(page).toHaveURL(/rating=4\.5/);
  });

  test("sorts by most reviewed", async ({ page }) => {
    await page.goto("/search");
    await page.getByText("Most Reviewed").click();
    await expect(page).toHaveURL(/sort=reviews/);
  });

  test("sorts alphabetically", async ({ page }) => {
    await page.goto("/search");
    await page.getByText("Name A–Z").click();
    await expect(page).toHaveURL(/sort=name/);
  });

  test("clinic cards link to detail pages", async ({ page }) => {
    await page.goto("/search?q=Seattle");
    const firstCard = page.locator("a[href^='/clinic/']").first();
    await expect(firstCard).toBeVisible();
    const href = await firstCard.getAttribute("href");
    expect(href).toMatch(/^\/clinic\//);
  });

  test("clicking a clinic card navigates to detail page", async ({ page }) => {
    await page.goto("/search?q=Seattle");
    const firstCard = page.locator("a[href^='/clinic/']").first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/clinic\//);
  });

  test("shows result count", async ({ page }) => {
    await page.goto("/search?q=Seattle");
    await expect(page.getByText(/\d+ result/)).toBeVisible();
  });

  test("search bar is pre-filled with current query", async ({ page }) => {
    await page.goto("/search?q=Seattle");
    const input = page.locator("input[type='text'], input:not([type])").first();
    await expect(input).toHaveValue("Seattle");
  });
});
