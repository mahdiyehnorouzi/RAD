import "./test-dom";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AdminMessageComposer } from "@rad/ui";
import {
  domDocument,
  elements,
  pressKey,
  setMediaMatches,
  type DomNode,
} from "./test-dom";

async function mount(onSend: () => void) {
  const doc = domDocument();
  const host = doc.createElement("div");
  doc.body.appendChild(host);
  const root: Root = createRoot(host as unknown as Element);
  await act(async () => {
    root.render(
      createElement(AdminMessageComposer, {
        value: "پیام تست",
        onChange: () => {},
        onSend,
      }),
    );
  });
  const textarea = elements(host, "textarea")[0];
  if (!textarea) throw new Error("composer did not render a textarea");
  return { root, textarea: textarea as DomNode };
}

test("Enter without Shift sends, on a non-touch (mouse/keyboard) device", async () => {
  setMediaMatches("(pointer: coarse)", false);
  let sent = 0;
  const { root, textarea } = await mount(() => {
    sent += 1;
  });
  await act(async () => {
    pressKey(textarea, { key: "Enter", shiftKey: false });
  });
  assert.equal(sent, 1);
  await act(async () => {
    root.unmount();
  });
});

test("Shift+Enter never sends — it's the newline shortcut", async () => {
  setMediaMatches("(pointer: coarse)", false);
  let sent = 0;
  const { root, textarea } = await mount(() => {
    sent += 1;
  });
  await act(async () => {
    pressKey(textarea, { key: "Enter", shiftKey: true });
  });
  assert.equal(sent, 0);
  await act(async () => {
    root.unmount();
  });
});

test("Enter is ignored while an IME composition is active (isComposing)", async () => {
  setMediaMatches("(pointer: coarse)", false);
  let sent = 0;
  const { root, textarea } = await mount(() => {
    sent += 1;
  });
  await act(async () => {
    pressKey(textarea, {
      key: "Enter",
      shiftKey: false,
      isComposing: true,
    });
  });
  assert.equal(sent, 0, "Enter confirming an IME candidate must not send");
  await act(async () => {
    root.unmount();
  });
});

test("Enter is ignored during composition even via the legacy keyCode 229 signal", async () => {
  // Some browsers (older Safari in particular) don't set `isComposing`
  // reliably and instead mark a composition-related keydown with the
  // historical sentinel keyCode 229.
  setMediaMatches("(pointer: coarse)", false);
  let sent = 0;
  const { root, textarea } = await mount(() => {
    sent += 1;
  });
  await act(async () => {
    pressKey(textarea, { key: "Enter", shiftKey: false, keyCode: 229 });
  });
  assert.equal(sent, 0);
  await act(async () => {
    root.unmount();
  });
});

test("on a touch device, Enter always stays a plain newline — there is no Shift key to type one with", async () => {
  setMediaMatches("(pointer: coarse)", true);
  let sent = 0;
  const { root, textarea } = await mount(() => {
    sent += 1;
  });
  await act(async () => {
    pressKey(textarea, { key: "Enter", shiftKey: false });
  });
  assert.equal(
    sent,
    0,
    "a touch keyboard's Return must insert a newline, not send",
  );
  await act(async () => {
    root.unmount();
  });
  setMediaMatches("(pointer: coarse)", false);
});

test("a key other than Enter never sends", async () => {
  setMediaMatches("(pointer: coarse)", false);
  let sent = 0;
  const { root, textarea } = await mount(() => {
    sent += 1;
  });
  await act(async () => {
    pressKey(textarea, { key: "a", shiftKey: false });
  });
  assert.equal(sent, 0);
  await act(async () => {
    root.unmount();
  });
});
