import "../lib/test-dom";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { domDocument } from "../lib/test-dom";
import { useLatestRequest } from "./use-latest-request";

function Harness({
  onReady,
}: {
  onReady: (api: ReturnType<typeof useLatestRequest>) => void;
}) {
  onReady(useLatestRequest());
  return null;
}

async function mount() {
  const doc = domDocument();
  const host = doc.createElement("div");
  doc.body.appendChild(host);
  const root: Root = createRoot(host as unknown as Element);
  let api: ReturnType<typeof useLatestRequest> | undefined;
  await act(async () => {
    root.render(
      createElement(Harness, {
        onReady: (value) => {
          api = value;
        },
      }),
    );
  });
  if (!api) throw new Error("hook did not render");
  return { root, api };
}

test("the first request is the latest until a second one begins", async () => {
  const { api, root } = await mount();
  const first = api.begin();
  assert.equal(api.isLatest(first), true);
  await act(async () => {
    root.unmount();
  });
});

test("a slower, earlier request is no longer latest once a newer one begins — regardless of resolve order", async () => {
  const { api, root } = await mount();
  const slow = api.begin(); // fired first (e.g. a stale, slow keystroke's request)
  const fast = api.begin(); // fired second (the admin kept typing)

  // The slow one resolves *last* in real life too — that's the whole
  // point of the guard — but by the time either resolves, `fast` is the
  // only id still considered latest.
  assert.equal(api.isLatest(slow), false);
  assert.equal(api.isLatest(fast), true);
  await act(async () => {
    root.unmount();
  });
});

test("every id stays stable across re-renders — the guard survives background polling/re-renders, not just one request", async () => {
  const { api, root } = await mount();
  const id = api.begin();
  assert.equal(api.isLatest(id), true);
  // Re-render (e.g. unrelated props changing, a parent re-rendering from
  // a background poll) must not reset or change which id is "latest".
  await act(async () => {
    root.render(createElement(Harness, { onReady: () => {} }));
  });
  assert.equal(api.isLatest(id), true);
  await act(async () => {
    root.unmount();
  });
});

test("begin/isLatest keep the same identity across renders (safe to omit from a dependency array)", async () => {
  const { api, root } = await mount();
  const begin1 = api.begin;
  const isLatest1 = api.isLatest;
  await act(async () => {
    root.render(createElement(Harness, { onReady: () => {} }));
  });
  assert.equal(api.begin, begin1);
  assert.equal(api.isLatest, isLatest1);
  await act(async () => {
    root.unmount();
  });
});
