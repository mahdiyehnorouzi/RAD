import { APIRequestContext, request as playwrightRequest } from "@playwright/test";

/**
 * Direct-to-API helpers for tests that need to drive backend state faster
 * than the UI allows (admin review side of cross-app scenarios, negative
 * payment cases that must hit the real service-level validation rather than
 * client-side form validation).
 *
 * Base URL: apps/api runs on :4000 per AGENTS.md section 3. Not started by
 * playwright.config.ts's webServer — must already be running
 * (`npm run dev:api`) plus a DB (`npm run db:up`).
 */
export const API_BASE_URL = process.env.API_URL || "http://localhost:4000";

export async function newApiContext(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({ baseURL: API_BASE_URL });
}

/** A minimal 1x1 PNG, base64-encoded, used as a stand-in receipt image for
 * tests that only care about the tracking-number / state-machine validation
 * paths, not actual image content checks. `assertImageData`
 * (apps/api/src/common/image-data.ts) only checks the data-URL MIME prefix
 * and byte size — it does not parse real PNG structure — so this is safe
 * as a fixture despite not being a byte-valid PNG. */
export const FAKE_RECEIPT_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUAAScy8CMAAAAASUVORK5CYII=";

/**
 * A fresh receipt image per call, so repeated test runs don't trip
 * `assertReceiptNotReused`'s cross-order SHA-256 receiptHash duplicate
 * check (orders.service.ts `assertReceiptNotReused`) — discovered by
 * running payment.spec.ts twice in a row against the live API: the second
 * run got a real 409 `receipt_duplicate` because the static fixture's hash
 * had already been submitted on a previous order. The random suffix is
 * appended as extra (ignored, since assertImageData doesn't parse real PNG
 * bytes) base64 padding so the SHA-256 of the full string differs each time.
 */
export function freshReceiptDataUrl(): string {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `${FAKE_RECEIPT_PNG_DATA_URL}${suffix}`;
}

/** A fresh, rule-valid tracking number per call, for the same reason as
 * `freshReceiptDataUrl` — `assertReceiptNotReused` also cross-checks
 * tracking numbers across orders. */
export function freshTrackingNumber(): string {
  return `TRK${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Registers a fresh throwaway customer account and leaves the resulting
 * session cookie set on `api`. Needed for CommissionsController: unlike
 * cart/orders, `CommissionsService.create/getMine/...` call
 * `requireSignedIn(actor)` (commissions.service.ts) and reject guests with
 * 401 — discovered while running this task's tests against the live API,
 * contradicting docs/qa/flow-inventory.md's assumption that commissions are
 * "identity-scoped like cart/orders" (i.e. guest-accessible). Flagged in the
 * final report rather than silently amended in that doc.
 */
export async function registerThrowawayCustomer(api: APIRequestContext) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const res = await api.post(`${API_BASE_URL}/auth/register`, {
    data: { name: "E2E Test Customer", email, password: "password123" },
  });
  if (!res.ok()) {
    throw new Error(`POST /auth/register failed (${res.status()}): ${await res.text()}`);
  }
  return res.json();
}

export interface CheckoutPayload {
  name: string;
  phone: string;
  city: string;
  address: string;
  acceptedPolicies: Record<string, string>;
}
