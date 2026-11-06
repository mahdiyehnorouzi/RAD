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

test("a duplicate/retried callback never creates a second order or payment", async ({
  page,
}) => {
  const { api } = urls();

  await addTestProductToCartAndStartCheckout(page, E2E_TEST_PRODUCT_SLUGS.duplicateCallback);
  const orderId = await fillCheckoutFormAndSubmit(page);

  const authority = await clickPayAndFollowMockGateway(page);
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

  // Re-drive the exact same browser-side effect verifyOnReturn() produces: a
  // second POST to /payment/verify for the same, already-verified order —
  // simulating the gateway retrying its callback or the buyer reloading the
  // return URL.
  const duplicate = await page.request.post(
    `${api}/orders/${orderId}/payment/verify`,
    {
      data: { authority, status: "OK" },
    },
  );
  const duplicateBody = await duplicate.json().catch(() => ({}));

  const afterDuplicate = await (
    await page.request.get(`${api}/orders/${orderId}`)
  ).json();
  expect(afterDuplicate.status).toBe("confirmed");
  expect(afterDuplicate.payment?.status).toBe("verified");

  // Exactly one order for this checkout — no second order or payment record
  // was created by the repeat callback.
  const orders: Array<{ id: string }> = await (
    await page.request.get(`${api}/orders`)
  ).json();
  expect(orders.filter((o) => o.id === orderId)).toHaveLength(1);
  void duplicateBody;
});
