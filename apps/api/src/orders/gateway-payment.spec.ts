import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, describe, mock, test } from "node:test";
import { BadRequestException } from "@nestjs/common";
import {
  startPurchaseHarness,
  type PurchaseHarness,
} from "./testing/purchase-harness";

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

/** Stubs `fetch` with ZarinPal-shaped responses for `request.json`/`verify.json`. */
function stubZarinpal(
  handler: (url: string, body: unknown) => { status?: number; data?: unknown },
) {
  mock.method(globalThis, "fetch", async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const result = handler(url, body);
    return new Response(JSON.stringify({ data: result.data ?? {}, errors: [] }), {
      status: result.status ?? 200,
    });
  });
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

describe("ZarinPal gateway payment", () => {
  test("checkout returns a redirect and stores the Authority", async () => {
    const { order, authority } = await gatewayCheckout("redirect");
    assert.equal(order.payment?.mode, "gateway");
    assert.equal(order.payment?.provider, "zarinpal");
    assert.ok(order.payment?.redirectUrl?.includes(authority()));
    assert.equal(order.status, "pending_payment");
  });

  test("Status=OK + a valid Authority verifies, confirms the order, and sells the work", async () => {
    const { buyer, slug, order, authority } = await gatewayCheckout("success");
    stubZarinpal((url) => {
      assert.ok(url.includes("verify.json"));
      return { data: { code: 100, message: "Verified", ref_id: 998877 } };
    });
    const confirmed = await rad.orders.verifyGatewayPayment(buyer, order.id, {
      authority: authority(),
      status: "OK",
    });
    assert.equal(confirmed.status, "confirmed");
    assert.equal(confirmed.payment?.status, "verified");
    assert.equal(confirmed.payment?.gatewayRefId, "998877");
    const product = await rad.productRow(slug);
    assert.equal(product.status, "sold");
    assert.equal(product.heldBy, null);
  });

  test("a duplicate callback on an already-verified payment is a no-op (idempotent)", async () => {
    const { buyer, order, authority } = await gatewayCheckout("idempotent");
    let verifyCalls = 0;
    stubZarinpal((url) => {
      verifyCalls += 1;
      return { data: { code: 100, message: "Verified", ref_id: 1 } };
    });
    await rad.orders.verifyGatewayPayment(buyer, order.id, {
      authority: authority(),
      status: "OK",
    });
    // Second callback (browser refresh / duplicate webhook): no ZarinPal call at all.
    const again = await rad.orders.verifyGatewayPayment(buyer, order.id, {
      authority: authority(),
      status: "OK",
    });
    assert.equal(again.status, "confirmed");
    assert.equal(verifyCalls, 1);
  });

  test("Status=NOK marks the payment failed but leaves the order payable for a retry", async () => {
    const { buyer, order, slug, authority } = await gatewayCheckout("cancelled");
    const result = await rad.orders.verifyGatewayPayment(buyer, order.id, {
      authority: authority(),
      status: "NOK",
    });
    assert.equal(result.status, "pending_payment");
    assert.equal(result.payment?.status, "failed");
    const product = await rad.productRow(slug);
    assert.equal(product.status, "sold"); // still reserved, not restocked — retryable
    void order;
  });

  test("an Authority that doesn't match the stored one is rejected", async () => {
    const { buyer, order } = await gatewayCheckout("mismatch");
    await assert.rejects(
      () =>
        rad.orders.verifyGatewayPayment(buyer, order.id, {
          authority: "forged-authority",
          status: "OK",
        }),
      BadRequestException,
    );
  });

  test("a gateway error during verify is flagged verify_error and is safe to retry", async () => {
    const { buyer, order, authority } = await gatewayCheckout("gateway-down");
    stubZarinpal(() => {
      throw new Error("network down");
    });
    const result = await rad.orders.verifyGatewayPayment(buyer, order.id, {
      authority: authority(),
      status: "OK",
    });
    assert.equal(result.status, "pending_payment");
    assert.equal(result.payment?.status, "verify_error");

    // Retrying (ZarinPal recovers) succeeds without a second checkout/order.
    stubZarinpal(() => ({ data: { code: 100, message: "Verified", ref_id: 42 } }));
    const retried = await rad.orders.verifyGatewayPayment(buyer, order.id, {
      authority: authority(),
      status: "OK",
    });
    assert.equal(retried.status, "confirmed");
  });

  test("retryGatewayPayment starts a fresh session on the SAME order, not a new one", async () => {
    const { buyer, order, authority: firstAuthority } =
      await gatewayCheckout("retry-same-order");
    let secondAuthority = "";
    stubZarinpal((url) => {
      if (url.includes("request.json")) {
        secondAuthority = "A-second-attempt";
        return { data: { code: 100, message: "Success", authority: secondAuthority } };
      }
      throw new Error(`unexpected request to ${url}`);
    });
    const retried = await rad.orders.retryGatewayPayment(buyer, order.id);
    assert.equal(retried.id, order.id);
    assert.notEqual(secondAuthority, firstAuthority());
    assert.ok(retried.payment?.redirectUrl?.includes(secondAuthority));

    // The old Authority is dead; only the fresh one verifies this order now.
    await assert.rejects(
      () =>
        rad.orders.verifyGatewayPayment(buyer, order.id, {
          authority: firstAuthority(),
          status: "OK",
        }),
      BadRequestException,
    );
  });

  test(
    "a late verified payment after the reservation was lost is flagged verify_conflict, " +
      "never double-sold",
    async () => {
      const { buyer, order, slug, authority } = await gatewayCheckout("late-success");
      // Simulate the hold being lost before the gateway's callback arrives
      // (e.g. an admin-side restock, or — in production — the 30-minute
      // window elapsing): free the product out from under this order.
      await rad.dataSource.transaction((manager) =>
        rad.inventory.restock(manager, [slug]),
      );

      stubZarinpal(() => ({ data: { code: 100, message: "Verified", ref_id: 777 } }));
      const result = await rad.orders.verifyGatewayPayment(buyer, order.id, {
        authority: authority(),
        status: "OK",
      });
      assert.equal(result.payment?.status, "verify_conflict");
      assert.notEqual(result.status, "confirmed");
      const product = await rad.productRow(slug);
      assert.equal(product.status, "available"); // never silently marked sold
    },
  );
});
