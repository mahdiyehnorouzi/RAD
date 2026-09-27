import assert from "node:assert/strict";
import { after, before, describe, mock, test } from "node:test";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { CartItem } from "../database/entities";
import { ORDER_PAYMENT_WINDOW_MS } from "./const";
import {
  startPurchaseHarness,
  type PurchaseHarness,
} from "./testing/purchase-harness";

const MINUTE = 60 * 1000;
const AMOUNT_MISMATCH = "مبلغ واریزی با مبلغ سفارش مطابقت ندارد.";

let rad: PurchaseHarness;

before(async () => {
  rad = await startPurchaseHarness();
});

after(async () => {
  mock.timers.reset();
  await rad?.stop();
});

/** Fast-forward the API clock; Postgres rows keep their real timestamps. */
function travel(ms: number) {
  mock.timers.reset();
  mock.timers.enable({ apis: ["Date"], now: Date.now() + ms });
}

describe("E2E purchase (card-to-card)", () => {
  test("1. purchase an existing product: cart → checkout → receipt → admin approve → confirmed → unavailable", async () => {
    const slug = await rad.product(12_500_000);
    const buyer = rad.buyer("sara");

    await assert.rejects(
      rad.cart.add(buyer, "no-such-work"),
      NotFoundException,
    );

    const bag = await rad.cart.add(buyer, slug);
    assert.deepEqual(bag.slugs, [slug]);
    assert.ok(bag.holds[slug] > Date.now(), "work is held while in the bag");

    const order = await rad.orders.checkout(buyer, {
      name: "سارا",
      phone: "۰۹۱۲۱۲۳۴۵۶۷",
      city: "تهران",
      address: "ولیعصر",
    });
    assert.equal(order.status, "pending_payment");
    assert.equal(order.total, 12_500_000);
    assert.equal(order.payment?.amount, 12_500_000);
    assert.ok(
      order.payment?.manualCard?.cardNumber,
      "card-to-card instructions shown",
    );
    const due = order.payment?.dueAt ?? 0;
    assert.ok(
      Math.abs(due - (Date.now() + ORDER_PAYMENT_WINDOW_MS)) < MINUTE,
      "30-minute payment window starts when the order is created",
    );

    await assert.rejects(
      rad.admin.approvePayment(order.id, null),
      BadRequestException,
      "admin cannot confirm before a receipt exists",
    );

    const receipt = rad.receipt();
    const submitted = await rad.orders.confirmPayment(buyer, order.id, {
      receiptImage: receipt,
      trackingNumber: "۱۲۳۴۵۶۷۸",
    });
    assert.equal(submitted.status, "pending_verification");
    assert.equal(submitted.payment?.trackingNumber, "12345678");

    const review = await rad.adminOrder(order.id);
    assert.equal(review.customer, "سارا");
    assert.equal(review.phone, "09121234567");
    assert.equal(review.products[0]?.slug, slug);
    assert.equal(review.amount, 12_500_000);
    assert.equal(review.paymentAmount, 12_500_000);
    assert.equal(review.receiptImage, receipt);
    assert.equal(review.paymentTrackingNumber, "12345678");
    assert.equal(review.status, "pending_verification");

    const approved = await rad.admin.approvePayment(order.id, "staff-1");
    assert.equal(approved.status, "confirmed");
    assert.equal(approved.paymentStatus, "verified");

    const confirmed = await rad.orders.get(buyer, order.id);
    assert.equal(confirmed.status, "confirmed");
    assert.ok((await rad.noticeKinds(buyer)).includes("order_confirmed"));

    const product = await rad.productRow(slug);
    assert.equal(product.status, "sold");
    assert.equal(product.heldBy, null);
    await assert.rejects(
      rad.cart.add(rad.buyer("late"), slug),
      ConflictException,
    );
  });

  test("2. purchase a 1/1 product: nobody else can take it at any stage", async () => {
    const slug = await rad.product();
    const owner = rad.buyer("owner");
    const other = rad.buyer("other");

    await rad.cart.add(owner, slug);
    await assert.rejects(
      rad.cart.add(other, slug),
      ConflictException,
      "held in a bag",
    );

    const order = await rad.orders.checkout(owner, { phone: "09120000001" });
    await assert.rejects(
      rad.cart.add(other, slug),
      ConflictException,
      "pending payment",
    );

    await rad.orders.confirmPayment(owner, order.id, {
      receiptImage: rad.receipt(),
      trackingNumber: rad.trackingNumber(),
    });
    await assert.rejects(
      rad.cart.add(other, slug),
      ConflictException,
      "pending verification",
    );

    await rad.admin.approvePayment(order.id, null);
    await assert.rejects(
      rad.cart.add(other, slug),
      ConflictException,
      "confirmed",
    );
    await assert.rejects(
      rad.cart.add(owner, slug),
      ConflictException,
      "even the buyer cannot re-add it",
    );

    await assert.rejects(
      rad.admin.updateOrder(order.id, { status: "pending_payment" }),
      BadRequestException,
    );
  });

  test("3. send a correct receipt: pending verification never expires on its own", async () => {
    const slug = await rad.product();
    const buyer = rad.buyer("paid");
    const order = await rad.placeOrder(buyer, slug);

    const submitted = await rad.orders.confirmPayment(buyer, order.id, {
      receiptImage: rad.receipt(),
      trackingNumber: rad.trackingNumber(),
    });
    assert.equal(submitted.status, "pending_verification");
    assert.equal(submitted.payment?.status, "submitted");
    assert.equal(submitted.payment?.dueAt, undefined, "payment clock stopped");

    try {
      travel(6 * 60 * MINUTE);
      await rad.inventory.releaseExpiredHolds();
      const later = await rad.orders.get(buyer, order.id);
      assert.equal(later.status, "pending_verification");
      await assert.rejects(
        rad.cart.add(rad.buyer("sniper"), slug),
        ConflictException,
      );
    } finally {
      mock.timers.reset();
    }

    const product = await rad.productRow(slug);
    assert.equal(product.status, "sold");
    assert.equal(product.holdExpiresAt, null);
  });

  test("4. wrong receipt: a receipt or tracking number already used for another order is refused", async () => {
    const buyerA = rad.buyer("honest");
    const buyerB = rad.buyer("copycat");
    const orderA = await rad.placeOrder(buyerA, await rad.product());
    const orderB = await rad.placeOrder(buyerB, await rad.product());

    const receipt = rad.receipt();
    const tracking = rad.trackingNumber();
    await rad.orders.confirmPayment(buyerA, orderA.id, {
      receiptImage: receipt,
      trackingNumber: tracking,
    });

    await assert.rejects(
      rad.orders.confirmPayment(buyerB, orderB.id, {
        receiptImage: receipt,
        trackingNumber: "99887766",
      }),
      ConflictException,
      "same screenshot",
    );
    await assert.rejects(
      rad.orders.confirmPayment(buyerB, orderB.id, {
        receiptImage: rad.receipt(),
        trackingNumber: tracking,
      }),
      ConflictException,
      "same tracking number",
    );
    assert.equal(
      (await rad.orders.get(buyerB, orderB.id)).status,
      "pending_payment",
    );
  });

  test("5. wrong amount: admin rejects with a reason the customer can read", async () => {
    const slug = await rad.product(9_000_000);
    const buyer = rad.buyer("short");
    const order = await rad.placeOrder(buyer, slug);
    await rad.orders.confirmPayment(buyer, order.id, {
      receiptImage: rad.receipt(),
      trackingNumber: rad.trackingNumber(),
    });

    await assert.rejects(
      rad.admin.rejectPayment(order.id, "  ", null),
      BadRequestException,
    );

    const rejected = await rad.admin.rejectPayment(
      order.id,
      AMOUNT_MISMATCH,
      "staff-1",
    );
    assert.equal(rejected.status, "rejected");
    assert.equal(rejected.rejectionReason, AMOUNT_MISMATCH);

    const seen = await rad.orders.get(buyer, order.id);
    assert.equal(seen.status, "rejected");
    assert.equal(seen.payment?.status, "rejected");
    assert.equal(seen.payment?.rejectionReason, AMOUNT_MISMATCH);
    assert.ok((await rad.noticeKinds(buyer)).includes("order_rejected"));

    await assert.rejects(
      rad.orders.confirmPayment(buyer, order.id, {
        receiptImage: rad.receipt(),
        trackingNumber: rad.trackingNumber(),
      }),
      BadRequestException,
      "a rejected order is closed",
    );
    await assert.rejects(
      rad.admin.approvePayment(order.id, null),
      BadRequestException,
    );
  });

  test("6. invalid receipt / invalid format is refused and the order keeps waiting", async () => {
    const buyer = rad.buyer("sloppy");
    const order = await rad.placeOrder(buyer, await rad.product());
    const tracking = rad.trackingNumber();
    const oversized = `data:image/png;base64,${"A".repeat(1.5 * 1024 * 1024)}`;

    const invalid: Array<{ receiptImage?: string; trackingNumber?: string }> = [
      { trackingNumber: tracking },
      { receiptImage: "", trackingNumber: tracking },
      { receiptImage: "not-a-data-url", trackingNumber: tracking },
      {
        receiptImage: "data:application/pdf;base64,JVBERi0xLjQ=",
        trackingNumber: tracking,
      },
      {
        receiptImage: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
        trackingNumber: tracking,
      },
      { receiptImage: "data:image/png;base64,", trackingNumber: tracking },
      { receiptImage: oversized, trackingNumber: tracking },
      { receiptImage: rad.receipt() },
      { receiptImage: rad.receipt(), trackingNumber: "12" },
      { receiptImage: rad.receipt(), trackingNumber: "12#45$78" },
    ];
    for (const input of invalid) {
      await assert.rejects(
        rad.orders.confirmPayment(buyer, order.id, input),
        BadRequestException,
        JSON.stringify(input).slice(0, 80),
      );
    }

    const still = await rad.orders.get(buyer, order.id);
    assert.equal(still.status, "pending_payment");
    assert.equal(still.payment?.status, "created");
  });

  test("7. resubmit receipt: the customer can replace it while awaiting verification", async () => {
    const buyer = rad.buyer("retry");
    const order = await rad.placeOrder(buyer, await rad.product());

    await rad.orders.confirmPayment(buyer, order.id, {
      receiptImage: rad.receipt(),
      trackingNumber: "11112222",
    });
    const second = rad.receipt();
    const resubmitted = await rad.orders.confirmPayment(buyer, order.id, {
      receiptImage: second,
      trackingNumber: "33334444",
    });
    assert.equal(resubmitted.status, "pending_verification");
    assert.equal(resubmitted.payment?.trackingNumber, "33334444");

    const review = await rad.adminOrder(order.id);
    assert.equal(
      review.receiptImage,
      second,
      "admin reviews the latest receipt",
    );
    assert.equal(review.paymentTrackingNumber, "33334444");
    assert.equal(review.receiptSubmissions, 2);

    await rad.admin.approvePayment(order.id, null);
    await assert.rejects(
      rad.orders.confirmPayment(buyer, order.id, {
        receiptImage: rad.receipt(),
        trackingNumber: "55556666",
      }),
      BadRequestException,
      "no resubmission after confirmation",
    );
  });

  test("8. two buyers for the same product: only one can ever reach payment", async () => {
    const slug = await rad.product();
    const buyerA = rad.buyer("a");
    const buyerB = rad.buyer("b");

    const race = await Promise.allSettled([
      rad.cart.add(buyerA, slug),
      rad.cart.add(buyerB, slug),
    ]);
    assert.equal(
      race.filter((result) => result.status === "fulfilled").length,
      1,
    );
    const loser = race.findIndex((result) => result.status === "rejected");
    assert.ok(
      (race[loser] as PromiseRejectedResult).reason instanceof
        ConflictException,
    );
    const [winner, other] = loser === 1 ? [buyerA, buyerB] : [buyerB, buyerA];

    const order = await rad.orders.checkout(winner, { phone: "09120000002" });

    // A cart row written before holds existed must not let the other buyer through.
    const cartItems = rad.dataSource.getRepository(CartItem);
    await cartItems.save(
      cartItems.create({
        ownerKey: `guest:${other.guestId}`,
        productSlug: slug,
      }),
    );
    await assert.rejects(
      rad.orders.checkout(other, { phone: "09120000003" }),
      ConflictException,
    );

    await rad.orders.confirmPayment(winner, order.id, {
      receiptImage: rad.receipt(),
      trackingNumber: rad.trackingNumber(),
    });
    try {
      travel(2 * 60 * MINUTE);
      await rad.inventory.releaseExpiredHolds();
      await assert.rejects(rad.cart.add(other, slug), ConflictException);
      assert.equal(
        (await rad.orders.get(winner, order.id)).status,
        "pending_verification",
      );
    } finally {
      mock.timers.reset();
    }
    assert.equal(
      (await rad.orders.list(other)).length,
      0,
      "second buyer never got an order",
    );
  });

  test("9. payment rejected by admin: the product is released and can be bought again", async () => {
    const slug = await rad.product();
    const first = rad.buyer("first");
    const next = rad.buyer("next");

    const order = await rad.placeOrder(first, slug);
    await rad.orders.confirmPayment(first, order.id, {
      receiptImage: rad.receipt(),
      trackingNumber: rad.trackingNumber(),
    });
    await rad.admin.rejectPayment(
      order.id,
      "رسید مربوط به این سفارش نیست.",
      null,
    );

    const product = await rad.productRow(slug);
    assert.equal(product.status, "available");
    assert.equal(product.heldBy, null);

    const again = await rad.placeOrder(next, slug);
    assert.equal(again.status, "pending_payment");
  });

  test("unpaid order expires after 30 minutes and the work returns to the shop", async () => {
    const slug = await rad.product();
    const buyer = rad.buyer("slow");
    const order = await rad.placeOrder(buyer, slug);

    try {
      travel(ORDER_PAYMENT_WINDOW_MS - MINUTE);
      await rad.inventory.releaseExpiredHolds();
      assert.equal(
        (await rad.orders.get(buyer, order.id)).status,
        "pending_payment",
      );

      travel(ORDER_PAYMENT_WINDOW_MS + MINUTE);
      await rad.inventory.releaseExpiredHolds();
      const expired = await rad.orders.get(buyer, order.id);
      assert.equal(expired.status, "expired");
      assert.equal(expired.payment?.status, "failed");

      await assert.rejects(
        rad.orders.confirmPayment(buyer, order.id, {
          receiptImage: rad.receipt(),
          trackingNumber: rad.trackingNumber(),
        }),
        BadRequestException,
      );
      assert.equal((await rad.productRow(slug)).status, "available");
      await rad.cart.add(rad.buyer("patient"), slug);
    } finally {
      mock.timers.reset();
    }
  });
});
