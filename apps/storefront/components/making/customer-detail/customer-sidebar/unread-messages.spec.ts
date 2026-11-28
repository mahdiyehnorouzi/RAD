import assert from "node:assert/strict";
import { test } from "node:test";
import type { Notice } from "@rad/types";
import { unreadMessageIds } from "./unread-messages";

function notice(overrides: Partial<Notice>): Notice {
  return {
    id: `n-${Math.random()}`,
    kind: "commission_message",
    productSlug: "RAD-M-1",
    read: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

test("3 unread incoming messages are reported as 3 unread ids", () => {
  const notices = [
    notice({ messageId: "m-1" }),
    notice({ messageId: "m-2" }),
    notice({ messageId: "m-3" }),
  ];
  const ids = unreadMessageIds(notices, "RAD-M-1");
  assert.equal(ids.size, 3);
  assert.ok(ids.has("m-1") && ids.has("m-2") && ids.has("m-3"));
});

test("a read notice does not count as unread", () => {
  const notices = [
    notice({ messageId: "m-1", read: true }),
    notice({ messageId: "m-2", read: false }),
  ];
  const ids = unreadMessageIds(notices, "RAD-M-1");
  assert.deepEqual([...ids], ["m-2"]);
});

test("notices for a different commission are excluded (independent conversations)", () => {
  const notices = [
    notice({ messageId: "m-1", productSlug: "RAD-M-1" }),
    notice({ messageId: "m-2", productSlug: "RAD-M-2" }),
  ];
  assert.deepEqual([...unreadMessageIds(notices, "RAD-M-1")], ["m-1"]);
  assert.deepEqual([...unreadMessageIds(notices, "RAD-M-2")], ["m-2"]);
});

test("notices of another kind, or without a messageId, are excluded", () => {
  const notices = [
    notice({ kind: "commission_quote", messageId: undefined }),
    notice({ kind: "commission_message", messageId: undefined }),
    notice({ kind: "commission_message", messageId: "m-1" }),
  ];
  assert.deepEqual([...unreadMessageIds(notices, "RAD-M-1")], ["m-1"]);
});

test("no unread notices means an empty set, never negative or stale", () => {
  assert.equal(unreadMessageIds([], "RAD-M-1").size, 0);
});
