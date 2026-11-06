import { expect, test } from "@playwright/test";
import {
  addTestProductToCartAndStartCheckout,
  E2E_TEST_PRODUCT_SLUGS,
  clickPayAndFollowMockGateway,
  fillCheckoutFormAndSubmit,
  mockGatewayPay,
  urls,
  waitForUrl,
} from "../support/flows";

test("successful purchase: PDP -> cart -> checkout -> mocked gateway success -> confirmed order", async ({
  page,
}) => {
  const { api } = urls();

  await addTestProductToCartAndStartCheckout(page, E2E_TEST_PRODUCT_SLUGS.successfulPurchase);
  const orderId = await fillCheckoutFormAndSubmit(page);

  await clickPayAndFollowMockGateway(page);
  await mockGatewayPay(page);

  // Back on the storefront, verifyOnReturn() calls POST /payment/verify
  // automatically from the Authority/Status query params the mock gateway
  // sent back. Poll the real API (same source of truth the UI reads) until
  // it lands on "confirmed" rather than asserting on transient UI copy.
  await waitForUrl(page, new RegExp(`/checkout/${orderId}(\\?.*)?$`));
  await expect
    .poll(
      async () => {
        const res = await page.request.get(`${api}/orders/${orderId}`);
        return (await res.json()).status;
      },
      { timeout: 20_000 },
    )
    .toBe("confirmed");

  const order = await (await page.request.get(`${api}/orders/${orderId}`)).json();
  expect(order.payment?.status).toBe("verified");

  // What the buyer actually sees: a non-pending result, not the gateway button.
  await expect(
    page.getByRole("button", { name: "Pay and complete order" }),
  ).toHaveCount(0);
});
