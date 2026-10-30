import assert from "node:assert/strict";
import {
  after,
  afterEach,
  before,
  beforeEach,
  describe,
  mock,
  test,
} from "node:test";
import { BadRequestException } from "@nestjs/common";
import {
  startPurchaseHarness,
  type PurchaseHarness,
} from "./testing/purchase-harness";

/**
 * `adminReconcileGatewayPayment` is the staff-triggered counterpart to a
 * buyer's own `retryGatewayPayment`: it exists because nothing else ever
 * moves a `redirected`/`verify_error` PaymentIntent forward if the buyer
 * never returns (see `docs/recovery/2026-10-25-status.md`). It reuses
 * `verifyAndApplyGatewayResult` exactly as the buyer-facing paths do, so
 * these tests focus on the new entry point's own guards and on the
 * ownerKey refactor that let an admin call it without a customer `Actor`.
 */

let rad: PurchaseHarness;

before(async () => {
  rad = await startPurchaseHarness();
});

after(async () => {
  mock.reset();
  await rad?.stop();
});

beforeEach(() => {
  process.env.PAYMENT_MODE = "gateway";
  process.env.ZARINPAL_SANDBOX = "true";
});

afterEach(() => {
  mock.reset();
  delete process.env.PAYMENT_MODE;
  delete process.env.ZARINPAL_SANDBOX;
});

function stubZarinpal(
  handler: (url: string, body: unknown) => { status?: number; data?: unknown },
) {
  mock.method(
    globalThis,
    "fetch",
    async (input: unknown, init?: RequestInit) => {
      const url = String(input);
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      const result = handler(url, body);
      return new Response(
        JSON.stringify({ data: result.data ?? {}, errors: [] }),
        { status: result.status ?? 200 },
      );
    },
  );
}

async function gatewayCheckout(name: string, price = 4_800_000) {
  const buyer = rad.buyer(name);
  const slug = await rad.product(price);
  let authority = "";
  stubZarinpal((url) => {
    if (url.includes("request.json")) {
      authority = `A-${name}-${Date.now()}`;
      return { data: { code: 100, message: "Success", authority } };
    }
    throw new Error(`unexpected request to ${url}`);
  });
  const order = await rad.placeOrder(buyer, slug);
  return { buyer, slug, order, authority: () => authority };
}

describe("admin-triggered gateway reconciliation", () => {
  test("a verify_error order that ZarinPal now confirms is sold, and notifies the actual owner", async () => {
    const { buyer, slug, order, authority } = await gatewayCheckout(
      "admin-reconcile-success",
    );
    stubZarinpal(() => {
      throw new Error("network down");
    });
    await rad.orders.verifyGatewayPayment(buyer, order.id, {
      authority: authority(),
      status: "OK",
    });
    assert.equal(
      (await rad.adminOrder(order.id)).paymentStatus,
      "verify_error",
    );

    stubZarinpal(() => ({
      data: { code: 100, message: "Verified", ref_id: 1234 },
    }));
    const reconciled = await rad.admin.reconcileGatewayPayment(order.id);
    assert.equal(reconciled.status, "confirmed");
    assert.equal(reconciled.paymentStatus, "verified");
    const product = await rad.productRow(slug);
    assert.equal(product.status, "sold");
    assert.equal(product.heldBy, null);
  });

  test("a verify_error order that is still ambiguous stays verify_error, not thrown as an error", async () => {
    const { buyer, order, authority } = await gatewayCheckout(
      "admin-reconcile-still-ambiguous",
    );
    stubZarinpal(() => {
      throw new Error("network down");
    });
    await rad.orders.verifyGatewayPayment(buyer, order.id, {
      authority: authority(),
      status: "OK",
    });

    // Gateway is still unreachable on the admin's recheck too.
    const reconciled = await rad.admin.reconcileGatewayPayment(order.id);
    assert.equal(reconciled.status, "pending_payment");
    assert.equal(reconciled.paymentStatus, "verify_error");
  });

  test("a redirected order the buyer never verified is left alone when the gateway recheck is inconclusive", async () => {
    const { order } = await gatewayCheckout("admin-reconcile-redirected-left");
    assert.equal((await rad.adminOrder(order.id)).paymentStatus, "redirected");

    // ZarinPal returns its ordinary "never visited" error for an Authority
    // nobody has used yet - must not be written as verify_error.
    stubZarinpal(() => ({ status: 200, data: { code: -51, message: "nope" } }));
    const reconciled = await rad.admin.reconcileGatewayPayment(order.id);
    assert.equal(reconciled.status, "pending_payment");
    assert.equal(reconciled.paymentStatus, "redirected");
  });

  test("a redirected order the buyer actually completed (missed callback) is confirmed by the admin recheck", async () => {
    const { slug, order } = await gatewayCheckout(
      "admin-reconcile-redirected-confirms",
    );
    stubZarinpal(() => ({
      data: { code: 100, message: "Verified", ref_id: 5555 },
    }));
    const reconciled = await rad.admin.reconcileGatewayPayment(order.id);
    assert.equal(reconciled.status, "confirmed");
    assert.equal(reconciled.paymentStatus, "verified");
    const product = await rad.productRow(slug);
    assert.equal(product.status, "sold");
  });

  test("refuses a verify_conflict order - that needs a manual refund, never another verify attempt", async () => {
    const { buyer, order, authority } = await gatewayCheckout(
      "admin-reconcile-conflict",
    );
    // Lose the reservation before the (successful) verify lands.
    await rad.orders.cancel(buyer, order.id);
    stubZarinpal(() => ({
      data: { code: 100, message: "Verified", ref_id: 7777 },
    }));
    const verified = await rad.orders.verifyGatewayPayment(buyer, order.id, {
      authority: authority(),
      status: "OK",
    });
    assert.equal(verified.payment?.status, "verify_conflict");
    assert.equal(
      (await rad.adminOrder(order.id)).paymentStatus,
      "verify_conflict",
    );

    await assert.rejects(
      () => rad.admin.reconcileGatewayPayment(order.id),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        return true;
      },
    );
  });

  test("refuses a manual-card order - it has no gateway Authority to reconcile", async () => {
    delete process.env.PAYMENT_MODE; // defaults to manual_card
    const buyer = rad.buyer("admin-reconcile-manual-card");
    const slug = await rad.product(3_200_000);
    const order = await rad.placeOrder(buyer, slug);
    await assert.rejects(
      () => rad.admin.reconcileGatewayPayment(order.id),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        return true;
      },
    );
  });

  test("a second reconcile after the first already confirmed the order is refused, never re-verifies", async () => {
    const { order } = await gatewayCheckout("admin-reconcile-once");
    stubZarinpal(() => ({
      data: { code: 100, message: "Verified", ref_id: 9191 },
    }));
    const first = await rad.admin.reconcileGatewayPayment(order.id);
    assert.equal(first.paymentStatus, "verified");

    await assert.rejects(
      () => rad.admin.reconcileGatewayPayment(order.id),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        return true;
      },
    );
  });
});
