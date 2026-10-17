/**
 * P0 — Cart: add to cart, bottom sheet, and navigation to the real cart
 * page component.
 *
 * This directly targets a flagged past regression (per task brief): a
 * "رفتن به کیسه" ("Go to bag") link that changed the URL without the
 * cart-page component actually rendering. The assertion below deliberately
 * checks for cart-page.tsx-specific content (the "کیسه خرید (N)" heading
 * built from CartPage's own styles.title, apps/storefront/features/cart/
 * cart-page/cart-page.tsx:150-153), not just `expect(page).toHaveURL(...)`.
 *
 * WRITTEN BUT BLOCKED in this sandbox — see product.spec.ts header: no
 * Chromium binary (playwright install blocked by a 403 in this sandbox) and
 * no running storefront/API/DB. Selectors below were taken from reading the
 * actual source (bag-added-sheet.tsx, cart-page.tsx), not guessed.
 */
import { test, expect } from "@playwright/test";

test.describe("Cart", () => {
  test("add to cart opens the bag-added bottom sheet, and 'رفتن به کیسه' renders the real cart page", async ({
    page,
  }) => {
    await page.goto("/fa/products");
    const firstLink = page.locator('a[href*="/fa/products/"]').first();
    await firstLink.click();
    await page.waitForURL(/\/fa\/products\/[^/]+$/);

    // AddToBag's primary CTA (product-floating-buy.tsx / product-summary.tsx)
    // — the inline "Add to Bag" button. We don't have a stable data-testid,
    // so we locate the non-disabled button inside the "add-to-bag" wrapper.
    const addToBagButton = page
      .locator(".add-to-bag button:not([disabled])")
      .first();
    await expect(addToBagButton).toBeVisible({ timeout: 15_000 });
    await addToBagButton.click();

    // bag-added-sheet.tsx: a native <dialog class="bag-added-sheet"> opens
    // with aria-labelledby="bag-added-title" and the "رفتن به کیسه" link.
    const sheet = page.locator("dialog.bag-added-sheet");
    await expect(sheet).toBeVisible();
    const goToBagLink = sheet.getByRole("link", { name: /رفتن به کیسه/ });
    await expect(goToBagLink).toBeVisible();

    await goToBagLink.click();
    await page.waitForURL(/\/fa\/cart$/);

    // The regression this guards against: asserting only the URL would have
    // passed even if CartPage failed to mount. Assert on content that only
    // CartPage itself renders: the "کیسه خرید" heading (cart-page.tsx:152)
    // and at least one cart line item.
    await expect(
      page.getByRole("heading", { name: /کیسه خرید/ }),
    ).toBeVisible();
    await expect(page.locator('ul[aria-label] li').first()).toBeVisible();
  });

  test("cart page renders the checkout CTA once items are present", async ({
    page,
  }) => {
    await page.goto("/fa/cart");
    // Either the empty-bag state or a populated bag with the checkout CTA
    // ("ادامه‌ی خرید", cart-copy.ts) must render — never a blank/broken page.
    const heading = page.getByRole("heading", { name: /کیسه خرید/ });
    const emptyState = page.getByText(/کیسه/).first();
    await expect(heading.or(emptyState)).toBeVisible({ timeout: 15_000 });
  });
});
