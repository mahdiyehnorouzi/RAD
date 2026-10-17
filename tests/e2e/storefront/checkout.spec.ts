/**
 * P0/P1 — Cart review -> customer info form validation -> order creation.
 *
 * Selectors taken from apps/storefront/components/checkout/checkout-page/
 * checkout-page.tsx (read in full for this task): the form uses real
 * `<input name="...">` fields (name/phone/city/address/postalCode), a
 * `noValidate` form with hand-rolled validation (`validate()`,
 * checkout-page.tsx:140-150), and a submit button with
 * aria-busy/disabled states.
 *
 * WRITTEN BUT BLOCKED in this sandbox — no Chromium binary (playwright
 * install blocked), no running storefront/API/DB. See
 * tests/e2e/automation-strategy.md.
 */
import { test, expect } from "@playwright/test";

async function addFirstProductToCart(page: import("@playwright/test").Page) {
  await page.goto("/fa/products");
  const firstLink = page.locator('a[href*="/fa/products/"]').first();
  await firstLink.click();
  await page.waitForURL(/\/fa\/products\/[^/]+$/);
  const addToBagButton = page
    .locator(".add-to-bag button:not([disabled])")
    .first();
  await expect(addToBagButton).toBeVisible({ timeout: 15_000 });
  await addToBagButton.click();
  await page.locator("dialog.bag-added-sheet").waitFor({ state: "visible" });
}

test.describe("Checkout", () => {
  test("cart review step links to checkout once items are present", async ({
    page,
  }) => {
    await addFirstProductToCart(page);
    await page.goto("/fa/cart");
    const checkoutCta = page.getByRole("link", { name: /ادامه‌ی خرید/ });
    await expect(checkoutCta).toBeVisible();
    await checkoutCta.click();
    await page.waitForURL(/\/fa\/checkout$/);
    await expect(page.locator("form#checkout-details")).toBeVisible();
  });

  test("submitting the checkout form with empty required fields shows field-level validation errors, not a silent failure or raw API error", async ({
    page,
  }) => {
    await addFirstProductToCart(page);
    await page.goto("/fa/checkout");
    const form = page.locator("form#checkout-details");
    await expect(form).toBeVisible();

    // Submit immediately with everything blank.
    await page.locator('button[type="submit"][form="checkout-details"]').click();

    // validate() in checkout-page.tsx requires name>=2 chars, a plausible
    // phone, a city, and address>=8 chars — all blank should fail every
    // field and focus the first invalid one (name) without ever calling
    // placeOrder/hitting the API.
    const nameField = page.locator("#checkout-name");
    await expect(nameField).toBeFocused();
    await expect(page.locator("#checkout-name-error")).toBeVisible();
  });

  test("valid checkout details + accepted policy creates an order and navigates to the payment step", async ({
    page,
  }) => {
    await addFirstProductToCart(page);
    await page.goto("/fa/checkout");

    await page.fill("#checkout-name", "Mahdiyeh Norozi");
    await page.fill("#checkout-phone", "09121234567");
    // CitySelect is a custom combobox component, not a plain <select> — use
    // its visible control rather than assuming native <select> semantics.
    const citySelect = page.locator("#checkout-city");
    await citySelect.click();
    const firstCityOption = page.getByRole("option").first();
    if (await firstCityOption.isVisible().catch(() => false)) {
      await firstCityOption.click();
    } else {
      // Fallback: if it renders as a native <select>, selectOption works too.
      await citySelect.selectOption({ index: 1 }).catch(() => {});
    }
    await page.fill("#checkout-address", "خیابان ولیعصر، پلاک ۱، تست خودکار");

    // CheckoutAgreement checkbox must be checked or submit blocks with
    // agreeMissing (checkout-page.tsx:173-177).
    const agree = page.locator('input[type="checkbox"]').first();
    await agree.check();

    await page.locator('button[type="submit"][form="checkout-details"]').click();

    // On success, orders.service.ts creates Order(pending_payment) and the
    // page navigates to /checkout/[id] (checkout-page.tsx:202).
    await page.waitForURL(/\/fa\/checkout\/[^/]+$/, { timeout: 15_000 });
    await expect(page.locator(".payment-receipt")).toBeVisible();
  });
});
