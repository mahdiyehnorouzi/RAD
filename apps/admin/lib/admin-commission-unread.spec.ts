import "./test-dom";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { AdminCommission } from "./admin-data";
import { commissionMessageNoticeKey } from "./staff-notice-keys";
import { AdminChromeContext } from "../components/admin-shell";
import { CommissionMessages } from "../components/admin-commissions";
import { domDocument, elements, textOf, type DomNode } from "./test-dom";

/**
 * BUG-03: a customer message gets its own unread dot/sr-only label, and
 * is marked read only once it actually scrolls into view (an
 * IntersectionObserver callback reporting `isIntersecting`), never just
 * because the commission was opened. There is no global
 * `IntersectionObserver` in this lightweight DOM, so this test supplies a
 * fake one that records every observed node and lets the test fire its
 * callback on demand - the same shape a real browser's observer has.
 */

type ObserverEntry = {
  target: unknown;
  callback: IntersectionObserverCallback;
};

function installFakeIntersectionObserver() {
  const observed: ObserverEntry[] = [];
  class FakeIntersectionObserver {
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }
    observe(target: unknown) {
      observed.push({ target, callback: this.callback });
    }
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  }
  (
    globalThis as unknown as { IntersectionObserver: unknown }
  ).IntersectionObserver = FakeIntersectionObserver;
  return observed;
}

function intersect(entry: ObserverEntry) {
  entry.callback(
    [
      {
        target: entry.target,
        isIntersecting: true,
      } as IntersectionObserverEntry,
    ],
    null as unknown as IntersectionObserver,
  );
}

const commission: AdminCommission = {
  id: "RAD-M-unread-1",
  ownerKey: "owner-1",
  customerName: "آیدا تست",
  artistName: "سحر تست",
  stage: "making",
  nextActor: "artist",
  concept: "کاسه تست جداگانه",
  intendedUse: "آزمایشی",
  material: "سرامیک",
  messages: [
    {
      id: "m-1",
      author: "customer",
      body: {
        fa: "سلام، سفارش من کی تمام می‌شود؟",
        en: "Hi, when is it done?",
      },
      createdAt: Date.UTC(2026, 0, 1),
      stageId: "making",
    },
    {
      id: "m-2",
      author: "artist",
      body: { fa: "به زودی", en: "Soon" },
      createdAt: Date.UTC(2026, 0, 2),
      stageId: "making",
    },
  ],
  createdAt: Date.UTC(2026, 0, 1),
  updatedAt: Date.UTC(2026, 0, 1),
  payload: {},
};

function findListItems(host: DomNode) {
  return elements(host, "li");
}

async function mount(
  noticeKeys: Set<string>,
  readNotice: (key: string) => void,
) {
  const doc = domDocument();
  const host = doc.createElement("div");
  doc.body.appendChild(host);
  const root: Root = createRoot(host as unknown as Element);
  await act(async () => {
    root.render(
      createElement(
        AdminChromeContext.Provider,
        {
          value: {
            workspace: {} as never,
            section: "overview" as never,
            go: () => {},
            announce: () => {},
            openOrder: () => {},
            handedOrderId: null,
            clearHandedOrder: () => {},
            readNotice,
            noticeKeys,
            noticeKeysReady: true,
          },
        },
        createElement(CommissionMessages, {
          commission,
          canWrite: true,
          onMessage: async () => {},
        }),
      ),
    );
  });
  return { root, host };
}

test("an unseen customer message shows a dot and an accessible unread label; the artist's own message never does", async () => {
  (domDocument() as unknown as { visibilityState: string }).visibilityState =
    "visible";
  installFakeIntersectionObserver();
  const { host, root } = await mount(new Set(), () => {});
  const items = findListItems(host);
  const customerItem = items.find((item) =>
    item.className.includes("from-customer"),
  );
  const artistItem = items.find((item) =>
    item.className.includes("from-admin"),
  );
  assert.ok(customerItem?.className.includes("unread"));
  assert.match(textOf(customerItem!), /خوانده‌نشده/);
  assert.ok(!artistItem?.className.includes("unread"));
  await act(async () => {
    root.unmount();
  });
});

test("a message already in the staff read-cursor shows no dot", async () => {
  (domDocument() as unknown as { visibilityState: string }).visibilityState =
    "visible";
  installFakeIntersectionObserver();
  const alreadyRead = new Set([
    commissionMessageNoticeKey(commission.id, "m-1"),
  ]);
  const { host, root } = await mount(alreadyRead, () => {});
  const customerItem = findListItems(host).find((item) =>
    item.className.includes("from-customer"),
  );
  assert.ok(!customerItem?.className.includes("unread"));
  await act(async () => {
    root.unmount();
  });
});

test("scrolling the message into view marks exactly that message's key read, not the whole conversation", async () => {
  (domDocument() as unknown as { visibilityState: string }).visibilityState =
    "visible";
  const observed = installFakeIntersectionObserver();
  const readKeys: string[] = [];
  const { root } = await mount(new Set(), (key) => readKeys.push(key));

  const customerEntry = observed[0];
  assert.ok(customerEntry, "the customer message must be observed");
  await act(async () => {
    intersect(customerEntry);
  });
  assert.deepEqual(readKeys, [
    commissionMessageNoticeKey(commission.id, "m-1"),
  ]);
  await act(async () => {
    root.unmount();
  });
});

test("merely mounting (opening the commission) never calls readNotice on its own", async () => {
  (domDocument() as unknown as { visibilityState: string }).visibilityState =
    "visible";
  installFakeIntersectionObserver();
  const readKeys: string[] = [];
  const { root } = await mount(new Set(), (key) => readKeys.push(key));
  assert.deepEqual(
    readKeys,
    [],
    "opening the commission must not auto-mark any message read",
  );
  await act(async () => {
    root.unmount();
  });
});
