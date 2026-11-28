import "../lib/test-dom";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { domDocument } from "../lib/test-dom";
import { useDetailScrollRestore } from "./use-detail-scroll-restore";

// `activeId` plays the role of AdminOrders'/AdminCommissions' own
// `detailScrollId` — driven identically whether it changes because of a
// click on the in-app close button or because a browser Back landed on a
// hash-less URL via the existing popstate listener (see those files):
// from this hook's point of view both are just "activeId changed", so
// exercising that transition here covers both callers' triggers.
function Harness({
  activeId,
  onReady,
}: {
  activeId: string | null;
  onReady: (saveScroll: () => void) => void;
}) {
  const { saveScroll } = useDetailScrollRestore(activeId);
  onReady(saveScroll);
  return null;
}

function nextTick() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function mount() {
  const doc = domDocument();
  const host = doc.createElement("div");
  doc.body.appendChild(host);
  const root: Root = createRoot(host as unknown as Element);
  let saveScroll = () => {};
  const render = (activeId: string | null) =>
    act(async () => {
      root.render(
        createElement(Harness, {
          activeId,
          onReady: (fn) => {
            saveScroll = fn;
          },
        }),
      );
    });
  return {
    root,
    render,
    saveScroll: () => saveScroll(),
    scrollTop: () => doc.documentElement.scrollTop,
    setScrollTop: (value: number) => {
      doc.documentElement.scrollTop = value;
    },
  };
}

test("opening scrolls to the real scroll container's top immediately, not deferred", async () => {
  const view = await mount();
  view.setScrollTop(300);
  await view.render("order-1");
  // Opening is synchronous (inside the effect, no rAF) — a detail pane
  // should never paint one frame at the list's old scroll offset first.
  assert.equal(view.scrollTop(), 0);
  await act(async () => {
    view.root.unmount();
  });
});

test("a background poll that refreshes data under the same id never resets scroll", async () => {
  const view = await mount();
  view.setScrollTop(300);
  await view.render("order-1");
  assert.equal(view.scrollTop(), 0);

  // Simulate the admin scrolling within the opened detail, then a
  // background poll re-rendering with the *same* active id (refreshed
  // order/commission data, unrelated to which item is selected).
  view.setScrollTop(640);
  await view.render("order-1");
  assert.equal(
    view.scrollTop(),
    640,
    "re-rendering with the same id must not touch scroll position",
  );
  await act(async () => {
    view.root.unmount();
  });
});

test("closing restores the list's saved scroll position, from the real scroll container", async (t) => {
  const view = await mount();
  await view.render(null); // mount the hook (list screen, nothing selected)
  view.setScrollTop(300);
  view.saveScroll();
  await view.render("order-1");
  assert.equal(view.scrollTop(), 0);

  // The rAF polyfill is a real `setTimeout(…, 0)` (see test-dom.ts), so
  // asserting the pre-frame state against a real timer races the event
  // loop's own macrotask scheduling and is flaky. Mocking just this timer
  // for this one assertion makes the deferral itself deterministic to
  // observe without touching the hook's actual (real-timer) behavior.
  t.mock.timers.enable({ apis: ["setTimeout"] });
  await view.render(null);
  // The restore is deferred one frame (rAF), same as production.
  assert.equal(view.scrollTop(), 0, "not yet restored before the frame runs");
  t.mock.timers.tick(0);
  assert.equal(view.scrollTop(), 300);
  await act(async () => {
    view.root.unmount();
  });
});

test("in-app close and browser Back both close through the same `activeId → null` transition", async () => {
  // This hook only ever sees "activeId changed"; AdminCommissions' own
  // popstate listener and its close button both just set the same
  // `requestedId`/`selectedId` state that feeds `activeId` here, so this
  // single scenario stands in for either trigger.
  const view = await mount();
  await view.render(null); // mount the hook (list screen, nothing selected)
  view.setScrollTop(150);
  view.saveScroll();
  await view.render("commission-1");
  await view.render(null); // in-app close button OR a popstate-driven close
  await nextTick();
  assert.equal(view.scrollTop(), 150);
  await act(async () => {
    view.root.unmount();
  });
});

test("a stale pending restore never overwrites a newer open's scroll-to-top", async () => {
  const view = await mount();
  await view.render(null); // mount the hook (list screen, nothing selected)
  view.setScrollTop(300);
  view.saveScroll();
  await view.render("order-1"); // opens, scrollTop -> 0
  await view.render(null); // closes, schedules a restore-to-300 next frame

  // Before that frame runs, immediately open a different item — this
  // must cancel the pending restore so it can never fire afterwards and
  // clobber the fresh scroll-to-top with the old, now-irrelevant target.
  await view.render("order-2");
  assert.equal(view.scrollTop(), 0);

  await nextTick();
  assert.equal(
    view.scrollTop(),
    0,
    "the canceled restore-to-300 must not have fired",
  );
  await act(async () => {
    view.root.unmount();
  });
});

test("unmounting with a restore still pending does not apply it later", async () => {
  const view = await mount();
  await view.render(null); // mount the hook (list screen, nothing selected)
  view.setScrollTop(300);
  view.saveScroll();
  await view.render("order-1");
  await view.render(null); // schedules a restore-to-300 next frame

  await act(async () => {
    view.root.unmount();
  });
  view.setScrollTop(999); // whatever the next screen the admin navigated to has
  await nextTick();
  assert.equal(
    view.scrollTop(),
    999,
    "the unmounted hook's pending restore must not fire after unmount",
  );
});

test("never active (desktop, list and detail shown side by side) never touches scroll", async () => {
  const view = await mount();
  view.setScrollTop(555);
  // Desktop callers pass `null` for `detailScrollId` unconditionally
  // (`mobile && showDetail ? … : null`), so the hook never sees a
  // non-null id and must never move the page.
  await view.render(null);
  await view.render(null);
  assert.equal(view.scrollTop(), 555);
  await act(async () => {
    view.root.unmount();
  });
});
