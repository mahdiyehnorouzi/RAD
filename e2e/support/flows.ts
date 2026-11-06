import type { Page } from "@playwright/test";
import { readRuntimeState } from "./state";
import { E2E_TEST_PRODUCT_SLUGS } from "./fixture";

export { E2E_TEST_PRODUCT_SLUGS };

export function urls() {
  const state = readRuntimeState();
  return {
    storefront: state.storefrontUrl,
    api: state.apiUrl,
    gateway: state.gatewayUrl,
  };
}

export async function setGatewayOutcome(
  orderId: string,
  outcome: "interactive" | "verify_error" | "request_down_once",
) {
  const { gateway } = urls();
  const res = await fetch(`${gateway}/test/outcomes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, outcome }),
  });
  if (!res.ok) throw new Error(`setGatewayOutcome failed: ${res.status}`);
}

/**
 * Next's dev server (Turbopack) keeps HMR's connection open as part of the
 * page's resources, so the browser's `load` event — Playwright's default
 * `goto` wait condition — never fires against it; `domcontentloaded` is
 * what every navigation in this harness actually waits for instead.
 */
const NAV = { waitUntil: "domcontentloaded" } as const;

/** Same `domcontentloaded` reasoning as `NAV`, for the gateway redirect ->
 * callback hop, which IS a real full navigation (through the mock
 * gateway's own origin) and would otherwise hang the same way. */
export async function waitForUrl(page: Page, pattern: RegExp) {
  await page.waitForURL(pattern, NAV);
}

export async function goBack(page: Page) {
  await page.goBack(NAV);
}

/**
 * PDP -> Add to bag -> /cart -> "Continue to checkout". Lands on /checkout.
 * Locale is carried as a `?lang=en` query param on the app's own links, not
 * a `/en/` path prefix, even though the route is physically under
 * `app/[locale]/...` — confirmed from the actual rendered link hrefs.
 */
export async function addTestProductToCartAndStartCheckout(
  page: Page,
  productSlug: string,
) {
  const { storefront } = urls();
  await page.goto(`${storefront}/products/${productSlug}?lang=en`, NAV);
  await page.getByRole("button", { name: /add to bag/i }).click();
  // The add is a POST; wait for the button to flip to "In your bag" before
  // navigating away, so we don't race the request.
  await page.getByRole("button", { name: /in your bag/i }).waitFor();
  await page.goto(`${storefront}/cart?lang=en`, NAV);
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await waitForUrl(page, /\/checkout(\?.*)?$/);
}

/** Fills the delivery form on /checkout and submits it. Returns the new order id. */
export async function fillCheckoutFormAndSubmit(page: Page): Promise<string> {
  await page.locator('input[name="name"]').fill("Test Buyer");
  await page.locator('input[name="phone"]').fill("09121234567");
  const province = page.locator('select[name="province"]');
  await province.selectOption({ index: 1 });
  const city = page.locator('select[name="city"]');
  await city.selectOption({ index: 1 });
  // The address field is a <textarea>, not an <input> — `input[name=...]`
  // silently never matches it.
  await page.locator('[name="address"]').fill("Test street, no. 1");
  await page
    .getByRole("checkbox", { name: /terms of sale/i })
    .check();
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await waitForUrl(page, /\/checkout\/[^/?]+(\?.*)?$/);
  const match = page.url().match(/\/checkout\/([^/?]+)/);
  if (!match) throw new Error(`Could not read order id from URL ${page.url()}`);
  return decodeURIComponent(match[1]);
}

/**
 * From the gateway payment page: click "Pay and complete order" and follow
 * the mock gateway. Returns the ZarinPal `Authority` for this attempt, read
 * off the mock StartPay URL — the real API never exposes it in order
 * responses, so this is the only place a test can observe it.
 */
export async function clickPayAndFollowMockGateway(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Pay and complete order" }).click();
  await waitForUrl(page, /\/pg\/StartPay\//);
  const match = page.url().match(/\/pg\/StartPay\/([^/?]+)/);
  if (!match) throw new Error(`Could not read Authority from URL ${page.url()}`);
  return decodeURIComponent(match[1]);
}

export async function mockGatewayPay(page: Page) {
  await page.locator("#mock-pay").click();
}

export async function mockGatewayCancel(page: Page) {
  await page.locator("#mock-cancel").click();
}
