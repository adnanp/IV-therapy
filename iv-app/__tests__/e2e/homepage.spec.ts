import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads and shows hero title", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /find iv therapy clinics/i })).toBeVisible();
  });

  test("shows the search bar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder(/city, state, or zip/i)).toBeVisible();
  });

  test("shows How It Works section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /how it works/i })).toBeVisible();
    await expect(page.getByText("Search")).toBeVisible();
    await expect(page.getByText("Compare")).toBeVisible();
    await expect(page.getByText("Book")).toBeVisible();
  });

  test("shows Browse by City section with city links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /browse by city/i })).toBeVisible();
    const cityLinks = page.locator("a[href*='/search?q=']");
    await expect(cityLinks.first()).toBeVisible();
  });

  test("shows Top Rated Clinics section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /top rated clinics/i })).toBeVisible();
  });

  test("search navigates to results page for city", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(/city, state, or zip/i).fill("Seattle");
    await page.getByRole("button", { name: /search/i }).click();
    await expect(page).toHaveURL(/\/search\?q=Seattle/);
  });

  test("search navigates to results page for zip code", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(/city, state, or zip/i).fill("98101");
    await page.getByRole("button", { name: /search/i }).click();
    await expect(page).toHaveURL(/\/search\?zip=98101/);
  });

  test("clicking a city link navigates to search results", async ({ page }) => {
    await page.goto("/");
    const firstCityLink = page.locator("a[href*='/search?q=']").first();
    await firstCityLink.click();
    await expect(page).toHaveURL(/\/search/);
  });

  test("header logo links back to homepage", async ({ page }) => {
    await page.goto("/search");
    await page.getByText("IVDirectory").click();
    await expect(page).toHaveURL("/");
  });

  test("Browse Clinics nav link goes to search", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Browse Clinics" }).click();
    await expect(page).toHaveURL("/search");
  });
});
