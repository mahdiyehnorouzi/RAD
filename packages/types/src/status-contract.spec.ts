import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isTerminalOrderStatus,
  orderStatusLabels,
  orderStatusOptions,
  orderStatusProgress,
} from "../../../apps/admin/lib/admin-data";
import { canTransitionProductStatus as apiCanTransitionProductStatus } from "../../../apps/api/src/inventory/product-status";
import {
  PRODUCT_STATUSES as API_PRODUCT_STATUSES,
  PRODUCT_STATUS_TRANSITIONS as API_PRODUCT_STATUS_TRANSITIONS,
} from "../../../apps/api/src/inventory/const/product-status";
import {
  LEGACY_ORDER_STATUS,
  MANUAL_ORDER_TRANSITIONS,
  STORE_ORDER_STATUSES as API_STORE_ORDER_STATUSES,
} from "../../../apps/api/src/orders/const/order-status";
import {
  canManuallyTransitionOrder,
  normalizeStoreOrderStatus as apiNormalizeStoreOrderStatus,
} from "../../../apps/api/src/orders/store-order-status";
import {
  PRODUCT_STATUSES,
  PRODUCT_STATUS_TRANSITIONS,
  STORE_ORDER_PROGRESS,
  STORE_ORDER_STATUSES,
  canTransitionProductStatus,
  isTerminalStoreOrderStatus,
  normalizeStoreOrderStatus,
} from "./index";

/**
 * Admin, the API, and `@rad/types` each define these contracts in their own
 * module. The API cannot import the ESM package, and admin keeps a private
 * transition map. This spec loads those modules and compares them. It does
 * not copy the tables into fixtures.
 */
const adminOrderStatuses = Object.keys(orderStatusLabels) as Array<
  keyof typeof orderStatusLabels
>;

test("store order status lists match across @rad/types, the API, and admin labels", () => {
  assert.deepEqual(API_STORE_ORDER_STATUSES, STORE_ORDER_STATUSES);
  assert.deepEqual(adminOrderStatuses, STORE_ORDER_STATUSES);
});

test("admin order progress matches the shared happy-path list", () => {
  assert.deepEqual(orderStatusProgress, STORE_ORDER_PROGRESS);
});

test("admin manual order options match the API transition map", () => {
  for (const status of STORE_ORDER_STATUSES) {
    assert.deepEqual(
      orderStatusOptions(status).slice(1),
      [...MANUAL_ORDER_TRANSITIONS[status]],
      status,
    );
  }
});

test("API manual transition checks agree with admin options, including staying put", () => {
  for (const from of STORE_ORDER_STATUSES) {
    for (const to of STORE_ORDER_STATUSES) {
      assert.equal(
        canManuallyTransitionOrder(from, to),
        orderStatusOptions(from).includes(to),
        `${from} -> ${to}`,
      );
    }
  }
});

test("admin and shared terminal order checks agree on every status", () => {
  for (const status of STORE_ORDER_STATUSES) {
    assert.equal(
      isTerminalOrderStatus(status),
      isTerminalStoreOrderStatus(status),
      status,
    );
  }
});

test("store order normalization agrees, including legacy names and unknown input", () => {
  for (const status of STORE_ORDER_STATUSES) {
    assert.equal(
      apiNormalizeStoreOrderStatus(status),
      normalizeStoreOrderStatus(status),
      status,
    );
  }
  for (const legacy of Object.keys(LEGACY_ORDER_STATUS) as Array<
    keyof typeof LEGACY_ORDER_STATUS
  >) {
    assert.equal(
      apiNormalizeStoreOrderStatus(legacy),
      LEGACY_ORDER_STATUS[legacy],
      legacy,
    );
    assert.equal(
      normalizeStoreOrderStatus(legacy),
      LEGACY_ORDER_STATUS[legacy],
      legacy,
    );
  }
  assert.equal(apiNormalizeStoreOrderStatus("not-a-status"), "confirmed");
  assert.equal(normalizeStoreOrderStatus("not-a-status"), "confirmed");
});

test("product status lists and manual transition tables match", () => {
  assert.deepEqual(API_PRODUCT_STATUSES, PRODUCT_STATUSES);
  assert.deepEqual(API_PRODUCT_STATUS_TRANSITIONS, PRODUCT_STATUS_TRANSITIONS);
});

test("API and shared product transition checks agree for every pair", () => {
  for (const from of PRODUCT_STATUSES) {
    for (const to of PRODUCT_STATUSES) {
      assert.equal(
        apiCanTransitionProductStatus(from, to),
        canTransitionProductStatus(from, to),
        `${from} -> ${to}`,
      );
    }
  }
});
