import { expect, test } from "@playwright/test";
import {
  addTestProductToCartAndStartCheckout,
  E2E_TEST_PRODUCT_SLUGS,
  clickPayAndFollowMockGateway,
  fillCheckoutFormAndSubmit,
  mockGatewayPay,
  setGatewayOutcome,
  urls,
  waitForUrl,
} from "../support/flows";

/**
 * Models "API error or lost response, then retry" as an unreachable gateway
 * at verify time (`verify_error`) — the one form of this that's already
 * well-defined end to end (see `gateway-payment.spec.ts`'s "a gateway error
 * during verify is flagged verify_error and is safe to retry"): the buyer
 * actually paid, but the first check of that can't be confirmed, and a
 * retry must re-check the SAME attempt rather than risk a second charge.
 *
 * A gateway outage at the EARLIER `checkout()` step is a different, open
 * question: `orders.service.ts` already commits the order, clears the cart,
 * and reserves inventory in one transaction before calling the gateway, so
 * a failure there leaves a real `pending_payment` order the buyer was never
 * told the id of, with an emptied cart they can't use to retry from. That
 * looks like a gap, not something this test should quietly route around by
 * inventing a UI retry path that doesn't exist — it's reported separately
 * below as a risk, per AGENTS.md's "don't silently invent a business rule."
 */
test("verify_error (gateway unreachable at verify time) is safe to retry and never double-confirms", async ({
  page,
}) => {
  const { api } = urls();

  await addTestProductToCartAndStartCheckout(page, E2E_TEST_PRODUCT_SLUGS.gatewayErrorRetry);
  const orderId = await fillCheckoutFormAndSubmit(page);

  await clickPayAndFollowMockGateway(page);

  // The buyer actually pays, but the verify call right after is simulated
  // as unreachable.
  await setGatewayOutcome(orderId, "verify_error");
  await mockGatewayPay(page);
  await waitForUrl(page, new RegExp(`/checkout/${orderId}(\\?.*)?$`));

  await expect
    .poll(async () => {
      const res = await page.request.get(`${api}/orders/${orderId}`);
      return (await res.json()).payment?.status;
    })
    .toBe("verify_error");

  const ambiguous = await (
    await page.request.get(`${api}/orders/${orderId}`)
  ).json();
  expect(ambiguous.status).toBe("pending_payment"); // never silently confirmed
  await expect(
    page.getByText("Payment result not yet clear"),
  ).toBeVisible();

  // The gateway recovers; a retry must re-check the SAME attempt and land
  // on confirmed, not start (or double-count) a new charge.
  await setGatewayOutcome(orderId, "interactive");
  await page
    .getByRole("button", { name: "Check payment status again" })
    .click();

  await expect
    .poll(
      async () => {
        const res = await page.request.get(`${api}/orders/${orderId}`);
        return (await res.json()).status;
      },
      { timeout: 20_000 },
    )
    .toBe("confirmed");

  const orders: Array<{ id: string }> = await (
    await page.request.get(`${api}/orders`)
  ).json();
  expect(orders.filter((o) => o.id === orderId)).toHaveLength(1);
});
