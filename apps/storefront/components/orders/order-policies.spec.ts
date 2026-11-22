import assert from "node:assert/strict";
import { test } from "node:test";
import type { Order } from "@rad/types";
import { showOrderPolicies } from "./order-policies";

const acceptance: Order["policyAcceptance"] = {
  acceptedAt: 1,
  versions: { terms: "2026-01-01" },
};

function order(
  status: Order["status"],
  payment?: Order["payment"],
): Pick<Order, "status" | "payment" | "policyAcceptance"> {
  return { status, payment, policyAcceptance: acceptance };
}

test("order policies show for a successful purchase and a still-valid pending order", () => {
  assert.equal(showOrderPolicies(order("confirmed")), true);
  assert.equal(showOrderPolicies(order("delivered")), true);
  assert.equal(showOrderPolicies(order("pending_payment")), true);
  assert.equal(showOrderPolicies(order("pending_verification")), true);
  assert.equal(showOrderPolicies(order("shipped")), true);
});

test("order policies hide when the purchase failed, closed, or has no accepted text", () => {
  assert.equal(showOrderPolicies(order("cancelled")), false);
  assert.equal(showOrderPolicies(order("returned")), false);
  assert.equal(showOrderPolicies(order("rejected")), false);
  assert.equal(showOrderPolicies(order("expired")), false);
  assert.equal(
    showOrderPolicies(
      order("pending_payment", {
        mode: "gateway",
        provider: "zarinpal",
        status: "failed",
        amount: 1,
      }),
    ),
    false,
  );
  assert.equal(
    showOrderPolicies({
      status: "confirmed",
      policyAcceptance: undefined,
    }),
    false,
  );
});
