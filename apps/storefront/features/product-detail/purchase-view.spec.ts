import assert from "node:assert/strict";
import { test } from "node:test";
import { purchaseView } from "./purchase-view";

const base = {
  inBag: false,
  reserved: false,
  sold: false,
  withdrawn: false,
  ownOrderId: null as string | null,
};

test("an available work is green and purchasable together", () => {
  assert.deepEqual(purchaseView({ ...base, status: "available" }), {
    open: true,
    button: "add",
  });
});

test("a sold flag never keeps the green available dot", () => {
  const view = purchaseView({
    ...base,
    status: "available",
    sold: true,
  });
  assert.equal(view.open, false);
  assert.equal(view.button, "sold");
});

test("someone else's hold is reserved, not sold and not green", () => {
  assert.deepEqual(
    purchaseView({
      ...base,
      status: "sold",
      reserved: true,
    }),
    { open: false, button: "reserved" },
  );
});

test("the viewer's own unpaid order resumes payment instead of looking sold or taken", () => {
  assert.deepEqual(
    purchaseView({
      ...base,
      status: "sold",
      sold: true,
      ownOrderId: "ord-1",
    }),
    { open: false, button: "resume" },
  );
  assert.deepEqual(
    purchaseView({
      ...base,
      status: "available",
      ownOrderId: "ord-1",
    }),
    { open: false, button: "resume" },
  );
});

test("a work already in this bag is not offered for sale again", () => {
  assert.deepEqual(purchaseView({ ...base, status: "sold", inBag: true }), {
    open: false,
    button: "in-bag",
  });
});
