import { APIRequestContext } from "@playwright/test";
import { ORDER_POLICY_SLUGS, currentPolicyVersions } from "@rad/types";
import {
  API_BASE_URL,
  freshReceiptDataUrl,
  freshTrackingNumber,
} from "../fixtures/api";

/**
 * API-level helpers that drive the cart -> checkout -> confirm-payment chain
 * directly (bypassing the storefront UI) for tests that need fast, precise
 * control over backend state and error codes — e.g. the admin side of a
 * cross-app scenario, or negative payment cases that must exercise the real
 * service-level validation (`normalizeTrackingNumber`, `assertCanSubmitReceipt`)
 * rather than the client-side form guard in payment-receipt.tsx (which never
 * lets an invalid request reach the API at all).
 *
 * All calls are unauthenticated/guest — this mirrors how OrdersController and
 * CartController work in production (no @UseGuards, identity resolved via a
 * guest cookie through IdentityService). Playwright's APIRequestContext
 * persists cookies across calls automatically, which is what makes the
 * guest `ownerKey` stay consistent across add-to-cart -> checkout -> confirm.
 */

export async function pickAvailableProductSlug(
  api: APIRequestContext,
): Promise<string> {
  const res = await api.get(`${API_BASE_URL}/products`);
  if (!res.ok()) {
    throw new Error(
      `GET /products failed (${res.status()}) — is the API running on :4000 with a seeded DB?`,
    );
  }
  const body = (await res.json()) as { products?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
  const products = Array.isArray(body) ? body : body.products ?? [];
  const available = products.find((p) => p.status === "available");
  if (!available) {
    throw new Error(
      "No product with status 'available' found — seed the DB (npm run setup --workspace @rad/api) before running this test.",
    );
  }
  return available.slug as string;
}

export async function addToCart(api: APIRequestContext, slug: string) {
  const res = await api.post(`${API_BASE_URL}/cart/items`, {
    data: { slug },
  });
  if (!res.ok()) {
    throw new Error(`POST /cart/items failed (${res.status()}): ${await res.text()}`);
  }
  return res.json();
}

export async function checkout(api: APIRequestContext) {
  const res = await api.post(`${API_BASE_URL}/orders`, {
    data: {
      name: "Mahdiyeh Test",
      phone: "09121234567",
      city: "Tehran",
      address: "Valiasr St, No. 1, E2E test order",
      acceptedPolicies: currentPolicyVersions(ORDER_POLICY_SLUGS),
    },
  });
  if (!res.ok()) {
    throw new Error(`POST /orders failed (${res.status()}): ${await res.text()}`);
  }
  return res.json() as Promise<{ id: string }>;
}

export async function confirmPayment(
  api: APIRequestContext,
  orderId: string,
  body: { receiptImage?: string; trackingNumber?: string },
) {
  return api.post(`${API_BASE_URL}/orders/${orderId}/confirm-payment`, {
    data: body,
  });
}

export async function submitHappyPathReceipt(
  api: APIRequestContext,
  orderId: string,
) {
  return confirmPayment(api, orderId, {
    receiptImage: freshReceiptDataUrl(),
    trackingNumber: freshTrackingNumber(),
  });
}
