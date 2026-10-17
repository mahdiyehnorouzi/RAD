/**
 * P0 — Receipt submission happy path + negative cases surfacing the real
 * structured Persian error codes.
 *
 * Important: payment-receipt.tsx (the storefront component) already blocks
 * a missing-image or malformed-tracking submission *client-side* before it
 * ever reaches the API (see onSubmit in payment-receipt.tsx — it checks
 * `!image` and `tracking.trim() && !number` and returns early with a local
 * copy string, never calling the API). So a UI-level negative test for
 * those two specific cases would only ever exercise the frontend guard, not
 * the real backend business rule described in AGENTS.md §5
 * (ConfirmPaymentDto only enforces @MaxLength(40); the actual 4-32
 * alphanumeric rule lives in `normalizeTrackingNumber`,
 * apps/api/src/orders/payment-receipt.ts:13-16).
 *
 * To actually exercise and assert on the backend's structured error codes
 * (`receipt_required`, `tracking_invalid`, confirmed present in
 * orders.service.ts:248/264), the negative cases here call the API
 * directly via Playwright's `request` fixture, bypassing the frontend guard
 * — this is the only way to reach the real service-level validation per
 * AGENTS.md's two-layer tracking-number rule.
 *
 * Runs against the live API in this sandbox. Note: the actual error body
 * shape is `{ error, statusCode, code }` (ApiExceptionFilter,
 * apps/api/src/common/http-exception.filter.ts) — not `{ message }` as a
 * naive reading of NestJS defaults would suggest; discovered by running
 * this test and inspecting the real response.
 */
import { test, expect } from "@playwright/test";
import { newApiContext, freshReceiptDataUrl } from "../../fixtures/api";
import {
  addToCart,
  checkout,
  confirmPayment,
  pickAvailableProductSlug,
  submitHappyPathReceipt,
} from "../../helpers/checkout-flow";

test.describe("Payment receipt submission (API-level, exercises real backend rules)", () => {
  test("happy path: valid receipt + tracking number moves the order to pending_verification", async () => {
    const api = await newApiContext();
    const slug = await pickAvailableProductSlug(api);
    await addToCart(api, slug);
    const order = await checkout(api);

    const res = await submitHappyPathReceipt(api, order.id);
    expect(res.status(), await res.text()).toBe(201);
    const body = await res.json();
    expect(body.status ?? body.order?.status).toBe("pending_verification");

    await api.dispose();
  });

  test("missing receipt image is rejected with code 'receipt_required' and a Persian message", async () => {
    const api = await newApiContext();
    const slug = await pickAvailableProductSlug(api);
    await addToCart(api, slug);
    const order = await checkout(api);

    const res = await confirmPayment(api, order.id, {
      trackingNumber: "TRK1234567",
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    // ApiExceptionFilter (common/http-exception.filter.ts) reshapes Nest's
    // HttpException into { error, statusCode, code } — the business-rule
    // message lives in `error`, not `message`.
    expect(body.code).toBe("receipt_required");
    expect(body.error).toMatch(/[؀-ۿ]/); // Persian text present

    await api.dispose();
  });

  test("invalid tracking number (fails the real 4-32 alphanumeric rule) is rejected with code 'tracking_invalid'", async () => {
    const api = await newApiContext();
    const slug = await pickAvailableProductSlug(api);
    await addToCart(api, slug);
    const order = await checkout(api);

    // "ab" normalizes to 2 chars after stripping spaces/dashes — fails the
    // ^[A-Z0-9]{4,32}$ rule in normalizeTrackingNumber (payment-receipt.ts:13-16),
    // while still passing the DTO's @MaxLength(40) sanity bound. This is
    // exactly the two-layer distinction AGENTS.md §5 calls out.
    const res = await confirmPayment(api, order.id, {
      receiptImage: freshReceiptDataUrl(),
      trackingNumber: "ab",
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("tracking_invalid");
    expect(body.error).toMatch(/[؀-ۿ]/);

    await api.dispose();
  });
});
