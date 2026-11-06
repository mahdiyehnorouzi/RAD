import { expect, test } from "@playwright/test";
import {
  E2E_TEST_PRODUCT_SLUGS,
  fillCheckoutFormAndSubmit,
  urls,
  waitForUrl,
} from "../support/flows";

test("cart, checkout, order and payment amount/item-count agree with the same source of truth", async ({
  page,
}) => {
  const { api, storefront } = urls();
  const productSlug = E2E_TEST_PRODUCT_SLUGS.amountConsistency;
  const NAV = { waitUntil: "domcontentloaded" } as const;

  await page.goto(`${storefront}/products/${productSlug}?lang=en`, NAV);
  await page.getByRole("button", { name: /add to bag/i }).click();
  await page.getByRole("button", { name: /in your bag/i }).waitFor();
  await page.goto(`${storefront}/cart?lang=en`, NAV);

  // What the cart page showed, before any order existed — the public
  // catalog/cart responses only ever expose a pre-formatted price string
  // (see GET /products/:slug), never a raw number, so the DOM text is this
  // test's only handle on what the buyer saw at that step.
  const cartAmountText = await page
    .locator("strong")
    .filter({ hasText: /toman/i })
    .first()
    .innerText();

  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await waitForUrl(page, /\/checkout(\?.*)?$/);
  const orderId = await fillCheckoutFormAndSubmit(page);

  // Server-side truth for this order: exactly one item, and the order
  // total agrees with the payment amount the gateway will be asked to
  // collect — the same two numbers the admin reconciliation flow compares.
  const order = await (
    await page.request.get(`${api}/orders/${orderId}`)
  ).json();
  expect(order.slugs).toEqual([productSlug]);
  expect(order.payment?.amount).toBe(order.total);

  // What the payment page shows the buyer must be the same toman figure —
  // no silent currency/unit drift between cart, checkout and payment.
  const amountDigits = String(order.payment?.amount ?? order.total);
  const expectedPattern = formatThousands(amountDigits);
  await expect(
    page.getByText(new RegExp(expectedPattern)).first(),
  ).toBeVisible();
  expect(cartAmountText).toMatch(new RegExp(expectedPattern));
});

function formatThousands(digits: string): string {
  // The UI formats toman with thousands separators; build a regex that
  // matches the digits regardless of which separator character is used.
  return digits
    .split("")
    .reverse()
    .reduce((acc, digit, index) => {
      const sep = index > 0 && index % 3 === 0 ? "[,،٬]?" : "";
      return digit + sep + acc;
    }, "");
}
