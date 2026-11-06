import "./test-dom";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { AdminContactMessage } from "./admin-data";
import { AdminMessages } from "../components/admin-messages";
import {
  click,
  domDocument,
  elements,
  setControlValue,
  textOf,
  type DomNode,
} from "./test-dom";

const message = (
  partial: Partial<AdminContactMessage> & Pick<AdminContactMessage, "id">,
): AdminContactMessage => ({
  topic: "order",
  source: "contact",
  name: "نگار تست",
  contact: "n@example.com",
  body: "سلام",
  status: "new",
  fromAdmin: false,
  fromOrderOwner: true,
  signedIn: false,
  createdAt: Date.UTC(2026, 0, 2),
  ...partial,
});

const open = message({ id: "m-open", body: "پیام باز" });
const resolved = message({
  id: "m-done",
  name: "سارا",
  body: "پیام بسته",
  status: "resolved",
  resolvedAt: Date.UTC(2026, 0, 3),
});
const reply = message({
  id: "m-reply",
  parentId: "m-open",
  body: "پاسخ دفتر",
  fromAdmin: true,
  createdAt: Date.UTC(2026, 0, 2, 1),
});

function buttons(root: DomNode, label: string) {
  return elements(root, "button").filter((node) =>
    textOf(node).includes(label),
  );
}

async function press(node: DomNode | undefined) {
  assert.ok(node);
  await act(async () => {
    click(node);
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function type(node: DomNode, value: string) {
  await act(async () => {
    setControlValue(node, value);
    await Promise.resolve();
  });
}

async function mount(props: Partial<Parameters<typeof AdminMessages>[0]> = {}) {
  const doc = domDocument();
  const host = doc.createElement("div");
  doc.body.appendChild(host);
  const root: Root = createRoot(host);
  const view = {
    async render(next: Partial<Parameters<typeof AdminMessages>[0]> = {}) {
      await act(async () => {
        root.render(
          createElement(AdminMessages, {
            messages: [open, resolved, reply],
            loading: false,
            loadError: false,
            onRetry: () => {},
            orders: [],
            canWrite: true,
            onSetStatus: async () => {},
            onReply: async () => {},
            onOpenOrder: () => {},
            ...props,
            ...next,
          }),
        );
      });
    },
  };
  await view.render();
  return { host, root, view };
}

test("filters count roots only and hide replies as their own rows", async () => {
  const { host, root } = await mount();
  assert.equal(elements(host, "article").length, 1);
  assert.match(textOf(host), /پیام باز/);
  assert.match(textOf(host), /پاسخ دفتر/);
  assert.doesNotMatch(textOf(host), /پیام بسته/);

  await press(buttons(host, "همه")[0]);
  assert.equal(elements(host, "article").length, 2);
  assert.match(textOf(host), /پاسخ دفتر/);

  await press(buttons(host, "رسیدگی‌شده")[0]);
  assert.equal(elements(host, "article").length, 1);
  assert.match(textOf(host), /پیام بسته/);
  assert.doesNotMatch(textOf(host), /پیام باز/);
  await act(async () => {
    root.unmount();
  });
});

test("a reader cannot reply or change status", async () => {
  const { host, root } = await mount({ canWrite: false });
  assert.equal(elements(host, "textarea").length, 0);
  assert.equal(buttons(host, "رسیدگی شد").length, 0);
  assert.equal(buttons(host, "ارسال پاسخ").length, 0);
  await act(async () => {
    root.unmount();
  });
});

test("marking a message resolved sends that id and status", async () => {
  const calls: [string, AdminContactMessage["status"]][] = [];
  const { host, root } = await mount({
    messages: [open],
    onSetStatus: async (id, status) => {
      calls.push([id, status]);
    },
  });
  await press(buttons(host, "رسیدگی شد")[0]);
  assert.deepEqual(calls, [["m-open", "resolved"]]);
  await act(async () => {
    root.unmount();
  });
});

test("a reply sends the trimmed text, and a second click is ignored while it is in flight", async () => {
  let release: (() => void) | undefined;
  const calls: string[] = [];
  const { host, root } = await mount({
    messages: [open],
    onReply: (id, body) => {
      calls.push(`${id}:${body}`);
      return new Promise<void>((resolve) => {
        release = resolve;
      });
    },
  });
  const field = elements(host, "textarea")[0];
  assert.ok(field);
  await type(field, "  پاسخ مشتری  ");
  const send = buttons(host, "ارسال پاسخ")[0];
  await press(send);
  await press(send);
  assert.deepEqual(calls, ["m-open:پاسخ مشتری"]);
  release?.();
  await act(async () => {
    root.unmount();
  });
});

test("a failed reply keeps the typed text", async () => {
  const { host, root } = await mount({
    messages: [open],
    onReply: async () => {
      throw new Error("ارتباط قطع شد");
    },
  });
  const field = elements(host, "textarea")[0];
  assert.ok(field);
  await type(field, "متن باقی بماند");
  await press(buttons(host, "ارسال پاسخ")[0]);
  assert.equal(field.value, "متن باقی بماند");
  assert.match(textOf(host), /ارتباط قطع شد/);
  await act(async () => {
    root.unmount();
  });
});

test("an order link opens that order", async () => {
  const opened: string[] = [];
  const linked = message({ id: "m-order", orderId: "ord-9", body: "سفارش" });
  const { host, root } = await mount({
    messages: [linked],
    onOpenOrder: (orderId) => {
      opened.push(orderId);
    },
  });
  await press(buttons(host, "ord-9")[0]);
  assert.deepEqual(opened, ["ord-9"]);
  await act(async () => {
    root.unmount();
  });
});
