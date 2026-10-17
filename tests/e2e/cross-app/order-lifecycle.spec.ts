/**
 * P0 — Cross-app Scenario A: customer completes checkout + receipt
 * submission, admin approves payment via the API, then the customer-visible
 * order status updates (UI poll/refetch on /orders/[id]).
 *
 * Per the task brief, the admin side is driven via Playwright's `request`
 * fixture (API calls) rather than the admin UI, since it's faster and the
 * admin-side UI flow is covered separately in tests/e2e/admin/orders.spec.ts.
 *
 * Admin auth: see tests/helpers/admin-auth.ts — requires E2E_ADMIN_EMAIL /
 * E2E_ADMIN_PASSWORD env vars for a real seeded admin account. No admin
 * seed user was found in apps/api/seed/*.ts during this task's
 * investigation (docs/qa/flow-inventory.md), so this is NOT invented —
 * the test fails loudly if those env vars are absent rather than faking it.
 *
 * WRITTEN BUT BLOCKED in this sandbox: no running apps/api/storefront/DB,
 * no Chromium binary, and no known admin credentials. See
 * tests/e2e/automation-strategy.md.
 */
import { test, expect } from "@playwright/test";
import { newApiContext } from "../../fixtures/api";
import { loginAsAdmin } from "../../helpers/admin-auth";
import {
  addToCart,
  checkout,
  pickAvailableProductSlug,
  submitHappyPathReceipt,
} from "../../helpers/checkout-flow";

test("customer checkout + receipt submission -> admin approves -> customer order shows confirmed", async ({
  page,
}) => {
  // 1. Customer: add to cart, checkout, submit receipt — via API context so
  // the guest ownerKey cookie is captured and reused for the status check.
  const customerApi = await newApiContext();
  const slug = await pickAvailableProductSlug(customerApi);
  await addToCart(customerApi, slug);
  const order = await checkout(customerApi);
  const receiptRes = await submitHappyPathReceipt(customerApi, order.id);
  expect(receiptRes.status(), await receiptRes.text()).toBe(201);
  const afterSubmit = await receiptRes.json();
  expect(afterSubmit.status ?? afterSubmit.order?.status).toBe(
    "pending_verification",
  );

  // 2. Admin: approve payment via POST /admin/orders/:id/payment/approve
  // (AdminService.approvePayment -> PaymentReviewService.approve, per
  // docs/qa/flow-inventory.md section 3).
  const adminApi = await newApiContext();
  await loginAsAdmin(adminApi);
  const approveRes = await adminApi.post(
    `${process.env.API_URL || "http://localhost:4000"}/admin/orders/${order.id}/payment/approve`,
  );
  expect(approveRes.status(), await approveRes.text()).toBe(200);
  const approved = await approveRes.json();
  expect(approved.status ?? approved.order?.status).toBe("confirmed");

  // 3. Customer-visible order status update: the storefront order detail
  // page (/orders/[id]) must reflect "confirmed" after a refetch — this is
  // the actual UI assertion for the scenario (not just a second API call),
  // since the task asks us to assert the *customer-visible* status updates.
  // Reuse the customer's own cookies by copying them into the page context.
  const cookies = await customerApi.storageState();
  await page.context().addCookies(cookies.cookies);
  await page.goto(`/fa/orders/${order.id}`);
  // store-order-status.ts maps "confirmed" -> i18n key "shopStageConfirmed"
  // -> fa.ts:339 "سفارش تأیید شد".
  await expect(page.getByText("سفارش تأیید شد")).toBeVisible({
    timeout: 15_000,
  });

  await customerApi.dispose();
  await adminApi.dispose();
});
