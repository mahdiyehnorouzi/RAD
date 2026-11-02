import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { AdminOrder } from "./admin-data";
import { AdminOrders } from "../components/orders/admin-orders";
import {
  assertOrderList,
  orderMatchesQuery,
  queryOrders,
} from "./order-queue";

const now = Date.UTC(2026, 9, 28, 12);

function order(
  partial: Partial<AdminOrder> & Pick<AdminOrder, "id" | "status" | "createdAt">,
): AdminOrder {
  return {
    customer: "مهدیه نوروزی",
    phone: "09120001122",
    city: "تهران",
    address: "ولیعصر",
    productName: "فنجان مریم نعنایی",
    products: [{ slug: "cup-021", name: "فنجان مریم نعنایی", radNumber: 21 }],
    amount: 2_000_000,
    ...partial,
  };
}

const orders: AdminOrder[] = [
  order({
    id: "ord-new",
    status: "pending_verification",
    paymentStatus: "submitted",
    createdAt: now - 60_000,
    customer: "مهدیه نوروزی",
    paymentTrackingNumber: "778899",
  }),
  order({
    id: "ord-old",
    status: "delivered",
    paymentStatus: "verified",
    createdAt: now - 40 * 24 * 60 * 60 * 1000,
    customer: "سارا رضایی",
    amount: 4_500_000,
    trackingCode: "IR123456",
    productName: "کاسه",
    products: [{ slug: "bowl", name: "کاسه", radNumber: 4 }],
  }),
  order({
    id: "ord-stuck",
    status: "confirmed",
    paymentStatus: "verify_conflict",
    paymentProvider: "zarinpal",
    createdAt: now - 2 * 24 * 60 * 60 * 1000,
    customer: "علی حسینی",
    amount: 900_000,
  }),
  order({
    id: "ord-expired",
    status: "expired",
    createdAt: now - 3 * 24 * 60 * 60 * 1000,
    customer: "نگار",
    phone: "۰۹۱۲۱۱۱۲۲۳۳",
  }),
];

test("a non-array orders payload is rejected instead of looking like an empty shop", () => {
  assert.throws(() => assertOrderList({}), /نامعتبر/);
  assert.throws(() => assertOrderList(null), /نامعتبر/);
  assert.deepEqual(assertOrderList([]), []);
  assert.equal(assertOrderList(orders).length, orders.length);
});

test("search matches order id, customer, work, RAD number, and Persian digits", () => {
  assert.equal(orderMatchesQuery(orders[0], "ord-new"), true);
  assert.equal(orderMatchesQuery(orders[0], "مهدیه فنجان"), true);
  assert.equal(orderMatchesQuery(orders[0], "RAD 021"), true);
  assert.equal(orderMatchesQuery(orders[0], "778899"), true);
  assert.equal(orderMatchesQuery(orders[3], "09121112233"), true);
  assert.equal(orderMatchesQuery(orders[1], "IR123456"), true);
  assert.equal(orderMatchesQuery(orders[0], "کاسه"), false);
});

test("filters, date window, sort, and pagination stay on the loaded list", () => {
  const review = queryOrders({
    orders,
    filter: "pending_verification",
    query: "",
    sort: "newest",
    dateRange: "all",
    page: 1,
    now,
  });
  assert.deepEqual(
    review.matched.map((item) => item.id),
    ["ord-new"],
  );

  const attention = queryOrders({
    orders,
    filter: "needs_attention",
    query: "",
    sort: "amount_desc",
    dateRange: "all",
    page: 1,
    now,
  });
  assert.deepEqual(
    attention.matched.map((item) => item.id),
    ["ord-expired", "ord-stuck"],
  );

  const recent = queryOrders({
    orders,
    filter: "all",
    query: "سارا",
    sort: "newest",
    dateRange: "7d",
    page: 1,
    now,
  });
  assert.equal(recent.total, 0);
  assert.equal(recent.counts.all, 0);

  const priced = queryOrders({
    orders,
    filter: "all",
    query: "",
    sort: "amount_asc",
    dateRange: "all",
    page: 1,
    pageSize: 2,
    now,
  });
  assert.deepEqual(
    priced.items.map((item) => item.id),
    ["ord-stuck", "ord-new"],
  );
  assert.equal(priced.pages, 2);
  assert.equal(priced.total, 4);
  assert.equal(priced.counts.delivered, 1);

  const clamped = queryOrders({
    orders,
    filter: "all",
    query: "",
    sort: "newest",
    dateRange: "all",
    page: 9,
    pageSize: 2,
    now,
  });
  assert.equal(clamped.page, 2);
  assert.equal(clamped.items.length, 2);
});

const noop = async () => {};

test("orders render distinguishes failure, an empty database, and real rows", () => {
  const errorHtml = renderToStaticMarkup(
    createElement(AdminOrders, {
      orders: [],
      loading: false,
      loadError: true,
      onRetry: () => {},
      messages: [],
      onSetMessageStatus: noop,
      onReplyMessage: noop,
      damageReports: [],
      onReviewDamage: async () => false,
      canWrite: true,
      onChange: noop,
      onApprovePayment: async () => false,
      onRejectPayment: async () => false,
      products: [],
    }),
  );
  assert.match(errorHtml, /دریافت سفارش‌ها ناموفق بود/);
  assert.doesNotMatch(errorHtml, /هنوز سفارشی ثبت نشده/);

  const emptyHtml = renderToStaticMarkup(
    createElement(AdminOrders, {
      orders: [],
      loading: false,
      loadError: false,
      onRetry: () => {},
      messages: [],
      onSetMessageStatus: noop,
      onReplyMessage: noop,
      damageReports: [],
      onReviewDamage: async () => false,
      canWrite: false,
      onChange: noop,
      onApprovePayment: async () => false,
      onRejectPayment: async () => false,
      products: [],
    }),
  );
  assert.match(emptyHtml, /هنوز سفارشی ثبت نشده/);
  assert.doesNotMatch(emptyHtml, /دریافت سفارش‌ها ناموفق بود/);

  const listHtml = renderToStaticMarkup(
    createElement(AdminOrders, {
      orders,
      loading: false,
      loadError: false,
      onRetry: () => {},
      messages: [],
      onSetMessageStatus: noop,
      onReplyMessage: noop,
      damageReports: [],
      onReviewDamage: async () => false,
      canWrite: true,
      onChange: noop,
      onApprovePayment: async () => false,
      onRejectPayment: async () => false,
      products: [],
    }),
  );
  assert.match(listHtml, /مهدیه نوروزی/);
  assert.match(listHtml, /سارا رضایی/);
  assert.match(listHtml, /علی حسینی/);
  assert.match(listHtml, /نگار/);
  assert.match(listHtml, /پرداخت تأیید شد/);
  assert.match(listHtml, /تحویل داده شد/);

  const corruptHtml = renderToStaticMarkup(
    createElement(AdminOrders, {
      orders: {} as AdminOrder[],
      loading: false,
      loadError: false,
      onRetry: () => {},
      messages: [],
      onSetMessageStatus: noop,
      onReplyMessage: noop,
      damageReports: [],
      onReviewDamage: async () => false,
      canWrite: true,
      onChange: noop,
      onApprovePayment: async () => false,
      onRejectPayment: async () => false,
      products: [],
    }),
  );
  assert.match(corruptHtml, /دریافت سفارش‌ها ناموفق بود/);
  assert.doesNotMatch(corruptHtml, /هنوز سفارشی ثبت نشده/);
});
