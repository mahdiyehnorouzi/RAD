/**
 * P0 — Product listing / detail / availability.
 *
 * Covers AGENTS.md §5's "backend is the sole source of truth for
 * availability" claim, verified at the catalog-read level in
 * docs/qa/flow-inventory.md (section 1): Product.status is owned
 * exclusively by InventoryService; the storefront only reads it.
 *
 * WRITTEN BUT BLOCKED in this sandbox: `npx playwright install --with-deps
 * chromium` failed (403 "not available in your location" from
 * cdn.playwright.dev when downloading Chrome for Testing) — no Chromium
 * binary is available, so no browser-based spec in this repo could be
 * executed here. Separately, apps/storefront (:3000) and apps/api (:4000 +
 * Postgres) are not running in this sandbox either. These tests are real
 * and should run as-is once both blockers are resolved in a normal dev
 * environment (see tests/e2e/automation-strategy.md).
 */
import { test, expect } from "@playwright/test";

test.describe("Product listing and detail", () => {
  test("product listing page loads and shows product cards", async ({
    page,
  }) => {
    await page.goto("/fa/products");
    // CatalogPage renders a list of works; each links to /products/[slug].
    const productLinks = page.locator('a[href*="/fa/products/"]');
    await expect(productLinks.first()).toBeVisible({ timeout: 15_000 });
    expect(await productLinks.count()).toBeGreaterThan(0);
  });

  test("PDP loads for the first listed product", async ({ page }) => {
    await page.goto("/fa/products");
    const firstLink = page.locator('a[href*="/fa/products/"]').first();
    const href = await firstLink.getAttribute("href");
    expect(href).toBeTruthy();
    await firstLink.click();
    await page.waitForURL(/\/fa\/products\/[^/]+$/);
    // PDP must render a heading with the work's name/number — there is no
    // data-testid in this codebase, so we assert structurally: a top-level
    // h1 is present and non-empty.
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
    expect((await heading.textContent())?.trim().length).toBeGreaterThan(0);
  });

  test("a sold/unavailable product shows a disabled 'فروش رفته' state, not an active buy button", async ({
    page,
  }) => {
    // We don't know a specific sold product's slug ahead of time (products
    // are 1/1 and rotate), so this test discovers one via the storefront's
    // own catalog filter UI (filterSold chip, i18n/fa.ts:116, "فروخته‌شده")
    // rather than hardcoding a slug that will go stale.
    await page.goto("/fa/products?status=sold");
    const firstLink = page.locator('a[href*="/fa/products/"]').first();
    const hasSold = await firstLink.isVisible().catch(() => false);
    test.skip(
      !hasSold,
      "No sold product currently in the catalog (?status=sold) — depends on live DB state.",
    );
    await firstLink.click();
    await page.waitForURL(/\/fa\/products\/[^/]+$/);
    // product-floating-buy.tsx renders a disabled "button add" pill reading
    // t("soldOut") ("فروش رفته", i18n/fa.ts:147) for a sold/withdrawn
    // product — never the active AddToBag CTA.
    const disabledPill = page.getByRole("button", { name: "فروش رفته" });
    await expect(disabledPill).toBeVisible();
    await expect(disabledPill).toBeDisabled();
  });
});
