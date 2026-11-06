import { expect, test } from "@playwright/test";
import {
  addTestProductToCartAndStartCheckout,
  E2E_TEST_PRODUCT_SLUGS,
  clickPayAndFollowMockGateway,
  fillCheckoutFormAndSubmit,
  mockGatewayCancel,
  mockGatewayPay,
  urls,
  waitForUrl,
} from "../support/flows";

test("failed payment (NOK) stays payable, and retry succeeds", async ({
  page,
}) => {
  const { api } = urls();

  await addTestProductToCartAndStartCheckout(page, E2E_TEST_PRODUCT_SLUGS.failedPaymentRetry);
  const orderId = await fillCheckoutFormAndSubmit(page);

  await clickPayAndFollowMockGateway(page);
  await mockGatewayCancel(page); // Status=NOK

  await waitForUrl(page, new RegExp(`/checkout/${orderId}(\\?.*)?$`));
  // The callback lands first; verifyOnReturn()'s own POST /payment/verify
  // call (which flips payment.status away from "redirected") happens async
  // after mount, so poll for it rather than reading once right away.
  await expect
    .poll(async () => {
      const res = await page.request.get(`${api}/orders/${orderId}`);
      return (await res.json()).payment?.status;
    })
    .toBe("failed");

  const afterNok = await (await page.request.get(`${api}/orders/${orderId}`)).json();
  expect(afterNok.status).toBe("pending_payment");

  // The retry button the UI shows for a plain failed payment.
  const retryButton = page.getByRole("button", { name: "Try payment again" });
  await retryButton.click();
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

  // Exactly one order and one product sale came out of this, despite the
  // first failed attempt and the retry.
  const final = await (await page.request.get(`${api}/orders/${orderId}`)).json();
  expect(final.payment?.status).toBe("verified");
});
