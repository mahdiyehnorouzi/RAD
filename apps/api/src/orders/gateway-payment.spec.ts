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
    stubZarinpal(() => {
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

  describe("order_confirmed notice only fires for an actual, committed confirmation", () => {
    test("NOK never notifies order_confirmed", async () => {
      const { buyer, order, authority } = await gatewayCheckout("notice-nok");
      await rad.orders.verifyGatewayPayment(buyer, order.id, {
        authority: authority(),
        status: "NOK",
      });
      assert.ok(!(await rad.noticeKinds(buyer)).includes("order_confirmed"));
    });

    test("an unreachable gateway (verify_error) never notifies order_confirmed", async () => {
      const { buyer, order, authority } = await gatewayCheckout("notice-error");
      stubZarinpal(() => {
        throw new Error("network down");
      });
      const result = await rad.orders.verifyGatewayPayment(buyer, order.id, {
        authority: authority(),
        status: "OK",
      });
      assert.equal(result.payment?.status, "verify_error");
      assert.ok(!(await rad.noticeKinds(buyer)).includes("order_confirmed"));
    });

    test("a late-success reservation conflict never notifies order_confirmed", async () => {
      const { buyer, order, slug, authority } = await gatewayCheckout("notice-conflict");
      await rad.dataSource.transaction((manager) =>
        rad.inventory.restock(manager, [slug]),
      );
      stubZarinpal(() => ({ data: { code: 100, message: "Verified", ref_id: 1 } }));
      const result = await rad.orders.verifyGatewayPayment(buyer, order.id, {
        authority: authority(),
        status: "OK",
      });
      assert.equal(result.payment?.status, "verify_conflict");
      assert.ok(!(await rad.noticeKinds(buyer)).includes("order_confirmed"));
    });

    test("an idempotent duplicate callback on an already-confirmed order notifies exactly once", async () => {
      const { buyer, order, authority } = await gatewayCheckout("notice-once");
      stubZarinpal(() => ({ data: { code: 100, message: "Verified", ref_id: 2 } }));
      await rad.orders.verifyGatewayPayment(buyer, order.id, {
        authority: authority(),
        status: "OK",
      });
      await rad.orders.verifyGatewayPayment(buyer, order.id, {
        authority: authority(),
        status: "OK",
      });
      const confirmations = (await rad.noticeKinds(buyer)).filter(
        (kind) => kind === "order_confirmed",
      );
      assert.equal(confirmations.length, 1);
    });

    test("a genuine confirmation does notify order_confirmed", async () => {
      const { buyer, order, authority } = await gatewayCheckout("notice-success");
      stubZarinpal(() => ({ data: { code: 100, message: "Verified", ref_id: 3 } }));
      const result = await rad.orders.verifyGatewayPayment(buyer, order.id, {
        authority: authority(),
        status: "OK",
      });
      assert.equal(result.status, "confirmed");
      assert.ok((await rad.noticeKinds(buyer)).includes("order_confirmed"));
    });
  });

  describe("retrying after an ambiguous verification never risks a double charge", () => {
    test("retryGatewayPayment refuses outright once a payment is verify_conflict", async () => {
      const { buyer, order, slug, authority } = await gatewayCheckout("retry-conflict");
      await rad.dataSource.transaction((manager) =>
        rad.inventory.restock(manager, [slug]),
      );
      stubZarinpal(() => ({ data: { code: 100, message: "Verified", ref_id: 9 } }));
      await rad.orders.verifyGatewayPayment(buyer, order.id, {
        authority: authority(),
        status: "OK",
      });

      let requestCalled = false;
      stubZarinpal((url) => {
        if (url.includes("request.json")) requestCalled = true;
        throw new Error(`unexpected request to ${url}`);
      });
      await assert.rejects(
        () => rad.orders.retryGatewayPayment(buyer, order.id),
        BadRequestException,
      );
      assert.equal(requestCalled, false); // never starts a new gateway session
    });

    test(
      "retryGatewayPayment on verify_error reconciles via the ORIGINAL Authority; " +
        "if ZarinPal now confirms success, no new gateway session is started",
      async () => {
        const { buyer, order, slug, authority } = await gatewayCheckout("retry-reconcile-ok");
        stubZarinpal(() => {
          throw new Error("network down");
        });
        const errored = await rad.orders.verifyGatewayPayment(buyer, order.id, {
          authority: authority(),
          status: "OK",
        });
        assert.equal(errored.payment?.status, "verify_error");

        let requestJsonCalled = false;
        let verifiedAuthority: string | undefined;
        stubZarinpal((url, body) => {
          if (url.includes("request.json")) {
            requestJsonCalled = true;
            return { data: { code: 100, message: "Success", authority: "SHOULD-NOT-HAPPEN" } };
          }
          verifiedAuthority = (body as { authority?: string }).authority;
          return { data: { code: 100, message: "Verified", ref_id: 55 } };
        });
        const retried = await rad.orders.retryGatewayPayment(buyer, order.id);

        assert.equal(retried.status, "confirmed");
        assert.equal(retried.payment?.redirectUrl, undefined);
        assert.equal(requestJsonCalled, false); // reconciled, never re-requested a session
        assert.equal(verifiedAuthority, authority()); // re-verified the SAME original Authority
        const product = await rad.productRow(slug);
        assert.equal(product.status, "sold");
      },
    );

    test(
      "retryGatewayPayment on verify_error refuses a new session while still ambiguous",
      async () => {
        const { buyer, order, authority } = await gatewayCheckout("retry-still-ambiguous");
        stubZarinpal(() => {
          throw new Error("network down");
        });
        await rad.orders.verifyGatewayPayment(buyer, order.id, {
          authority: authority(),
          status: "OK",
        });

        let requestJsonCalled = false;
        stubZarinpal((url) => {
          if (url.includes("request.json")) requestJsonCalled = true;
          throw new Error("still down");
        });
        await assert.rejects(
          () => rad.orders.retryGatewayPayment(buyer, order.id),
          BadRequestException,
        );
        assert.equal(requestJsonCalled, false); // never starts a second payment attempt

        const order2 = await rad.orders.get(buyer, order.id);
        assert.equal(order2.payment?.status, "verify_error");
        assert.equal(order2.status, "pending_payment");
      },
    );

    test(
      "retryGatewayPayment on verify_error that reconciles to a lost reservation " +
        "returns verify_conflict instead of starting a new session",
      async () => {
        const { buyer, order, slug, authority } = await gatewayCheckout("retry-reconcile-conflict");
        stubZarinpal(() => {
          throw new Error("network down");
        });
        await rad.orders.verifyGatewayPayment(buyer, order.id, {
          authority: authority(),
          status: "OK",
        });

        await rad.dataSource.transaction((manager) =>
          rad.inventory.restock(manager, [slug]),
        );
        let requestJsonCalled = false;
        stubZarinpal((url) => {
          if (url.includes("request.json")) requestJsonCalled = true;
          return { data: { code: 100, message: "Verified", ref_id: 66 } };
        });
        const retried = await rad.orders.retryGatewayPayment(buyer, order.id);
        assert.equal(retried.payment?.status, "verify_conflict");
        assert.notEqual(retried.status, "confirmed");
        assert.equal(requestJsonCalled, false);
        const product = await rad.productRow(slug);
        assert.equal(product.status, "available");
      },
    );

    test("a plain failed (NOK) payment can still retry normally and start a fresh session", async () => {
      const { buyer, order, authority: firstAuthority } = await gatewayCheckout(
        "retry-after-nok",
      );
      await rad.orders.verifyGatewayPayment(buyer, order.id, {
        authority: firstAuthority(),
        status: "NOK",
      });

      let secondAuthority = "";
      stubZarinpal((url) => {
        if (url.includes("request.json")) {
          secondAuthority = "A-after-nok";
          return { data: { code: 100, message: "Success", authority: secondAuthority } };
        }
        throw new Error(`unexpected request to ${url}`);
      });
      const retried = await rad.orders.retryGatewayPayment(buyer, order.id);
      assert.ok(retried.payment?.redirectUrl?.includes(secondAuthority));
      assert.notEqual(secondAuthority, firstAuthority());
    });
  });
});
