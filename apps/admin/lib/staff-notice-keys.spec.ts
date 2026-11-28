import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminCommission } from "./admin-data";
import {
  commissionMessageNoticeKey,
  commissionNoticeKey,
} from "./staff-notice-keys";

function commission(messages: AdminCommission["messages"]): AdminCommission {
  return {
    id: "RAD-M-keys-1",
    ownerKey: "owner-1",
    customerName: "مشتری",
    artistName: "هنرمند",
    stage: "making",
    nextActor: "artist",
    concept: "",
    intendedUse: "",
    material: "",
    messages,
    createdAt: 0,
    updatedAt: 0,
    payload: {},
  };
}

test("commissionMessageNoticeKey is a stable, message-specific key", () => {
  assert.equal(
    commissionMessageNoticeKey("RAD-M-1", "m-1"),
    "commission:RAD-M-1:m-1",
  );
  assert.notEqual(
    commissionMessageNoticeKey("RAD-M-1", "m-1"),
    commissionMessageNoticeKey("RAD-M-1", "m-2"),
    "two different messages in the same commission must have different keys",
  );
  assert.notEqual(
    commissionMessageNoticeKey("RAD-M-1", "m-1"),
    commissionMessageNoticeKey("RAD-M-2", "m-1"),
    "the same message id in two different commissions must not collide",
  );
});

test("commissionNoticeKey still tracks only the latest non-internal customer message (unchanged behavior)", () => {
  const withMessages = commission([
    {
      id: "m-1",
      author: "customer",
      body: { fa: "", en: "" },
      createdAt: 1,
      stageId: "making",
    },
    {
      id: "m-2",
      author: "artist",
      body: { fa: "", en: "" },
      createdAt: 2,
      stageId: "making",
    },
    {
      id: "m-3",
      author: "customer",
      body: { fa: "", en: "" },
      createdAt: 3,
      stageId: "making",
    },
    {
      id: "m-4",
      author: "customer",
      body: { fa: "", en: "" },
      createdAt: 4,
      internal: true,
      stageId: "making",
    },
  ]);
  assert.equal(
    commissionNoticeKey(withMessages),
    commissionMessageNoticeKey("RAD-M-keys-1", "m-3"),
    "the latest non-internal customer message, not the latest message overall",
  );
});

test("commissionNoticeKey with no customer messages falls back to a stable 'created' key", () => {
  assert.equal(
    commissionNoticeKey(commission([])),
    "commission:RAD-M-keys-1:created",
  );
});
