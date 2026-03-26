import { test, expect } from "@playwright/test";
import clinics from "../../data/clinics.json";

const firstClinic = clinics[0];
const detailUrl = `/clinic/${firstClinic.slug}`;

test.describe("Clinic Detail Page", () => {
  test("loads the clinic detail page", async ({ page }) => {
    await page.goto(detailUrl);
    await expect(page.getByRole("heading", { name: firstClinic.name })).toBeVisible();
  });

  test("shows clinic address", async ({ page }) => {
    await page.goto(detailUrl);
    await expect(page.getByText(firstClinic.streetAddress)).toBeVisible();
  });

  test("shows city and state", async ({ page }) => {
    await page.goto(detailUrl);
    await expect(page.getByText(new RegExp(`${firstClinic.city}.*${firstClinic.state}`))).toBeVisible();
  });

  test("shows star rating when rating exists", async ({ page }) => {
    await page.goto(detailUrl);
    if (firstClinic.rating) {
      await expect(page.getByText(firstClinic.rating.toFixed(1))).toBeVisible();
    }
  });

  test("shows Services section", async ({ page }) => {
    await page.goto(detailUrl);
    await expect(page.getByRole("heading", { name: /services/i })).toBeVisible();
  });

  test("shows What to Expect section", async ({ page }) => {
    await page.goto(detailUrl);
    await expect(page.getByRole("heading", { name: /what to expect/i })).toBeVisible();
  });

  test("shows About section", async ({ page }) => {
    await page.goto(detailUrl);
    await expect(page.getByRole("heading", { name: /about/i })).toBeVisible();
  });

  test("shows Book an Appointment section", async ({ page }) => {
    await page.goto(detailUrl);
    await expect(page.getByRole("heading", { name: /book an appointment/i })).toBeVisible();
  });

  test("shows website link when website exists", async ({ page }) => {
    await page.goto(detailUrl);
    if (firstClinic.website) {
      await expect(page.getByRole("link", { name: /book online/i })).toBeVisible();
    }
  });

  test("shows phone number when phone exists", async ({ page }) => {
    await page.goto(detailUrl);
    if (firstClinic.phone) {
      const phoneLink = page.locator(`a[href^="tel:"]`).first();
      await expect(phoneLink).toBeVisible();
    }
  });

  test("shows Hours section when hours exist", async ({ page }) => {
    await page.goto(detailUrl);
    if (firstClinic.hours) {
      await expect(page.getByRole("heading", { name: /hours/i })).toBeVisible();
    }
  });

  test("Back to Search link works", async ({ page }) => {
    await page.goto(detailUrl);
    await page.getByRole("link", { name: /back to search/i }).click();
    await expect(page).toHaveURL("/search");
  });

  test("breadcrumb Home link works", async ({ page }) => {
    await page.goto(detailUrl);
    await page.getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL("/");
  });

  test("breadcrumb Clinics link works", async ({ page }) => {
    await page.goto(detailUrl);
    await page.getByRole("link", { name: "Clinics" }).click();
    await expect(page).toHaveURL("/search");
  });

  test("404 page for unknown slug", async ({ page }) => {
    await page.goto("/clinic/this-slug-does-not-exist-xyz");
    await expect(page.getByText("404")).toBeVisible();
  });

  test("has JSON-LD structured data", async ({ page }) => {
    await page.goto(detailUrl);
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toBeAttached();
    const content = await jsonLd.textContent();
    const data = JSON.parse(content!);
    expect(data["@type"]).toBe("MedicalClinic");
    expect(data.name).toBe(firstClinic.name);
  });
});
