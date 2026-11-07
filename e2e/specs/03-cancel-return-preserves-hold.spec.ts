import { expect, test } from "@playwright/test";
import {
  addTestProductToCartAndStartCheckout,
  E2E_TEST_PRODUCT_SLUGS,
  clickPayAndFollowMockGateway,
  fillCheckoutFormAndSubmit,
  goBack,
  mockGatewayPay,
  urls,
  waitForUrl,
} from "../support/flows";

test("returning from the gateway without paying preserves the order and the inventory hold", async ({
  page,
}) => {
  const { api } = urls();

  await addTestProductToCartAndStartCheckout(
    page,
    E2E_TEST_PRODUCT_SLUGS.cancelReturn,
  );
  const orderId = await fillCheckoutFormAndSubmit(page);

  await clickPayAndFollowMockGateway(page);
  const gatewayPageUrl = page.url();
  expect(gatewayPageUrl).toContain("/pg/StartPay/");

  // The buyer abandons the gateway tab (never clicks Pay or Cancel there)
  // and just goes back to the order page directly — the most common real
  // "I didn't finish paying" path.
  await goBack(page);
  await waitForUrl(page, new RegExp(`/checkout/${orderId}(\\?.*)?$`));

  const whilePending = await (
    await page.request.get(`${api}/orders/${orderId}`)
  ).json();
  expect(whilePending.status).toBe("pending_payment");
  // Nothing was ever sent to /payment/verify, so the attempt is still
  // whatever it was right after checkout — not "failed", and never silently
  // cancelled by just navigating away.
  expect(whilePending.status).not.toBe("cancelled");
  expect(whilePending.status).not.toBe("rejected");

  // The product must still be held for this buyer, not released back to
  // the shop, while the payment window is still open.
  const product = await (
    await page.request.get(`${api}/products/${whilePending.slugs[0]}`)
  ).json();
  expect(product.status).toBe("sold"); // held == "sold" with holdExpiresAt set, see AGENTS.md
  expect(product.reservedUntil).toBeTruthy();

  // The cart/checkout session is not cleared: the UI still shows a path to
  // finish paying for the SAME order, not an empty cart or a dead end.
  await expect(
    page.getByText(/secure payment|didn't go through|didn't finish/i).first(),
  ).toBeVisible();

  // Returning and then actually completing payment still works — the hold
  // was real, not already lost by the time the buyer comes back.
  const retry = page.getByRole("button", {
    name: /secure payment|try payment again|pay and complete order/i,
  });
  await retry.click();
  await waitForUrl(page, /\/pg\/StartPay\//);
  await mockGatewayPay(page);
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
});
