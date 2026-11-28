import "./test-dom";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { AdminCommission } from "./admin-data";
import { CommissionMessages } from "../components/admin-commissions";
import {
  click,
  domDocument,
  elements,
  pressKey,
  setControlValue,
  setMediaMatches,
  textOf,
  type DomNode,
} from "./test-dom";

const commission: AdminCommission = {
  id: "RAD-M-test-82",
  ownerKey: "owner-1",
  customerName: "آیدا تست",
  artistName: "سحر تست",
  stage: "making",
  nextActor: "artist",
  concept: "کاسه تست جداگانه",
  intendedUse: "آزمایشی",
  material: "سرامیک",
  messages: [],
  createdAt: Date.UTC(2026, 0, 1),
  updatedAt: Date.UTC(2026, 0, 1),
  payload: {},
};

function findTextarea(host: DomNode) {
  return elements(host, "textarea")[0];
}
function findSendButton(host: DomNode) {
  return elements(host, "button").find(
    (node) => node.getAttribute("aria-label") === "ارسال پیام",
  );
}

async function mount(
  onMessage: Parameters<typeof CommissionMessages>[0]["onMessage"],
) {
  const doc = domDocument();
  const host = doc.createElement("div");
  doc.body.appendChild(host);
  const root: Root = createRoot(host as unknown as Element);
  await act(async () => {
    root.render(
      createElement(CommissionMessages, {
        commission,
        canWrite: true,
        onMessage,
      }),
    );
  });
  return { root, host };
}

async function type(node: DomNode, value: string) {
  await act(async () => {
    setControlValue(node, value);
  });
}

async function press(node: DomNode | undefined) {
  assert.ok(node);
  await act(async () => {
    click(node);
    await Promise.resolve();
    await Promise.resolve();
  });
}

test("isolated local data: sending trims the draft and clears it on success", async () => {
  setMediaMatches("(pointer: coarse)", false);
  const calls: unknown[] = [];
  const { host, root } = await mount(async (...args) => {
    calls.push(args);
  });
  const field = findTextarea(host);
  assert.ok(field);
  await type(field, "  سلام، این یک پیام تست محلی است  ");
  await press(findSendButton(host));
  assert.equal(calls.length, 1);
  const [id, body, internal] = calls[0] as [
    string,
    { fa: string; en: string },
    boolean,
    string,
  ];
  assert.equal(id, commission.id);
  assert.equal(body.fa, "سلام، این یک پیام تست محلی است");
  assert.equal(internal, false);
  assert.equal(field.value, "", "the draft is cleared after a successful send");
  await act(async () => {
    root.unmount();
  });
});

test("a failed send keeps the typed draft and shows a retry action", async () => {
  const { host, root } = await mount(async () => {
    throw new Error("ارتباط قطع شد");
  });
  const field = findTextarea(host);
  assert.ok(field);
  await type(field, "متن باید باقی بماند");
  await press(findSendButton(host));
  assert.equal(field.value, "متن باید باقی بماند");
  assert.match(textOf(host), /ارتباط قطع شد/);
  assert.match(textOf(host), /تلاش دوباره/);
  await act(async () => {
    root.unmount();
  });
});

test("duplicate-send protection: a second click while the first is still in flight is ignored", async () => {
  let release: (() => void) | undefined;
  const calls: string[] = [];
  const { host, root } = await mount((id, body) => {
    calls.push(body.fa);
    return new Promise<void>((resolve) => {
      release = resolve;
    });
  });
  const field = findTextarea(host);
  assert.ok(field);
  await type(field, "پیام تکراری نباید دوبار برود");
  const send = findSendButton(host);
  await press(send);
  await press(send); // still in flight — must be a no-op
  assert.deepEqual(calls, ["پیام تکراری نباید دوبار برود"]);
  release?.();
  await act(async () => {
    root.unmount();
  });
});

test("retrying after a failure reuses the same idempotency key, editing first gets a new one", async () => {
  const operationIds: string[] = [];
  let shouldFail = true;
  const { host, root } = await mount(async (_id, _body, _internal, opId) => {
    operationIds.push(opId as unknown as string);
    if (shouldFail) throw new Error("ناموفق");
  });
  const field = findTextarea(host);
  assert.ok(field);
  await type(field, "پیام با قابلیت تلاش دوباره");
  await press(findSendButton(host));
  assert.equal(operationIds.length, 1);

  // Retrying the same failed send (no edit) must reuse the same
  // operation id, so the server can recognize it as the same attempt.
  shouldFail = false;
  const retryButton = elements(host, "button").find((node) =>
    textOf(node).includes("تلاش دوباره"),
  );
  await press(retryButton);
  assert.equal(operationIds.length, 2);
  assert.equal(operationIds[0], operationIds[1]);
  await act(async () => {
    root.unmount();
  });
});

test("Enter sends on a non-touch device; Shift+Enter and an active IME composition do not", async () => {
  setMediaMatches("(pointer: coarse)", false);
  const calls: string[] = [];
  const { host, root } = await mount(async (_id, body) => {
    calls.push(body.fa);
  });
  const field = findTextarea(host);
  assert.ok(field);
  await type(field, "ارسال با اینتر");
  await act(async () => {
    pressKey(field, { key: "Enter", shiftKey: true });
  });
  assert.equal(calls.length, 0, "Shift+Enter must not send");
  await act(async () => {
    pressKey(field, { key: "Enter", shiftKey: false, isComposing: true });
  });
  assert.equal(calls.length, 0, "Enter during IME composition must not send");
  await act(async () => {
    pressKey(field, { key: "Enter", shiftKey: false });
    await Promise.resolve();
    await Promise.resolve();
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0], "ارسال با اینتر");
  await act(async () => {
    root.unmount();
  });
});
