import assert from "node:assert/strict";
import { test } from "node:test";
import {
  commissionNoticeHash,
  commissionNoticeShouldMarkRead,
  latestCustomerMessage,
  parseCommissionHash,
} from "./commission-notice-link";

const message = {
  id: "msg-9",
  author: "customer" as const,
  body: { fa: "سلام", en: "سلام" },
  createdAt: 1,
  stageId: "making",
};

test("a customer message notice opens that message, and an order notice does not", () => {
  const withMessage = {
    id: "RAD-M-1",
    messages: [message],
  };
  const orderOnly = {
    id: "RAD-M-2",
    messages: [],
  };
  assert.equal(latestCustomerMessage(withMessage)?.id, "msg-9");
  assert.equal(latestCustomerMessage(orderOnly), null);
  assert.equal(
    commissionNoticeHash(withMessage),
    "#commissions/RAD-M-1/messages/msg-9",
  );
  assert.equal(commissionNoticeHash(orderOnly), "#commissions/RAD-M-2");
  assert.deepEqual(parseCommissionHash(commissionNoticeHash(withMessage)), {
    id: "RAD-M-1",
    tab: "messages",
    messageId: "msg-9",
  });
  assert.deepEqual(parseCommissionHash("#commissions/RAD-M-2"), {
    id: "RAD-M-2",
    tab: null,
    messageId: null,
  });
  assert.equal(parseCommissionHash("#orders/1"), null);
});

test("read receipts wait for the surface the notice pointed at", () => {
  assert.equal(
    commissionNoticeShouldMarkRead({
      noticeKey: "commission:RAD-M-1:msg-9",
      tab: "summary",
      messageId: "msg-9",
      messageRendered: false,
    }),
    false,
  );
  assert.equal(
    commissionNoticeShouldMarkRead({
      noticeKey: "commission:RAD-M-1:msg-9",
      tab: "messages",
      messageId: "msg-9",
      messageRendered: false,
    }),
    false,
  );
  assert.equal(
    commissionNoticeShouldMarkRead({
      noticeKey: "commission:RAD-M-1:msg-9",
      tab: "messages",
      messageId: "msg-9",
      messageRendered: true,
    }),
    true,
  );
  assert.equal(
    commissionNoticeShouldMarkRead({
      noticeKey: "commission:RAD-M-2:created",
      tab: "messages",
      messageId: null,
      messageRendered: true,
    }),
    false,
  );
  assert.equal(
    commissionNoticeShouldMarkRead({
      noticeKey: "commission:RAD-M-2:created",
      tab: "decision",
      messageId: null,
      messageRendered: false,
    }),
    true,
  );
});
