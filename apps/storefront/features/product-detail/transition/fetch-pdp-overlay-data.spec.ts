import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchPdpOverlayData } from "./fetch-pdp-overlay-data";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("fetchPdpOverlayData returns data on a clean success", async () => {
  const fetchImpl = async () => jsonResponse({ product: { id: "p1" } });
  const result = await fetchPdpOverlayData("rad-1", new AbortController().signal, fetchImpl as never);
  assert.deepEqual(result, { kind: "data", data: { product: { id: "p1" } } });
});

test("fetchPdpOverlayData reports a move without retrying", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return jsonResponse({ moved: "/en/products/new-slug" });
  };
  const result = await fetchPdpOverlayData("old-slug", new AbortController().signal, fetchImpl as never);
  assert.deepEqual(result, { kind: "moved", href: "/en/products/new-slug" });
  assert.equal(calls, 1);
});

test("fetchPdpOverlayData reports not_found without retrying", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return jsonResponse({ error: "not_found" }, 404);
  };
  const result = await fetchPdpOverlayData("gone", new AbortController().signal, fetchImpl as never);
  assert.deepEqual(result, { kind: "not_found" });
  assert.equal(calls, 1);
});

test("fetchPdpOverlayData retries once on a transient failure, then succeeds", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls === 1) throw new TypeError("network down");
    return jsonResponse({ product: { id: "p1" } });
  };
  const result = await fetchPdpOverlayData("rad-1", new AbortController().signal, fetchImpl as never);
  assert.deepEqual(result, { kind: "data", data: { product: { id: "p1" } } });
  assert.equal(calls, 2);
});

test("fetchPdpOverlayData gives up as an error after exhausting its single retry", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    throw new TypeError("network down");
  };
  const result = await fetchPdpOverlayData("rad-1", new AbortController().signal, fetchImpl as never);
  assert.deepEqual(result, { kind: "error" });
  assert.equal(calls, 2);
});

test("fetchPdpOverlayData never retries once the caller has cancelled", async () => {
  let calls = 0;
  const controller = new AbortController();
  const fetchImpl = async () => {
    calls += 1;
    controller.abort();
    throw new DOMException("aborted", "AbortError");
  };
  const result = await fetchPdpOverlayData("rad-1", controller.signal, fetchImpl as never);
  assert.deepEqual(result, { kind: "error" });
  assert.equal(calls, 1);
});

test("fetchPdpOverlayData resolves immediately if already cancelled before starting", async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return jsonResponse({ product: { id: "p1" } });
  };
  const result = await fetchPdpOverlayData("rad-1", controller.signal, fetchImpl as never);
  assert.deepEqual(result, { kind: "error" });
  assert.equal(calls, 0);
});

test("fetchPdpOverlayData truncates a retry's own timeout to whatever budget remains, and never starts a third attempt", async () => {
  let calls = 0;
  const fetchImpl = (_url: string, init: RequestInit) => {
    calls += 1;
    return new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    });
  };
  const start = Date.now();
  const result = await fetchPdpOverlayData("rad-1", new AbortController().signal, fetchImpl as never);
  const elapsed = Date.now() - start;
  assert.deepEqual(result, { kind: "error" });
  // Attempt 1 spends the full 12s per-attempt timeout; attempt 2 gets only
  // the ~6s left in the 18s overall budget, then MAX_ATTEMPTS stops a third.
  assert.equal(calls, 2);
  assert.ok(elapsed < 20_000, `expected the overall budget to cap total wait, took ${elapsed}ms`);
});

test("fetchPdpOverlayData: closing and reopening with a new AbortController behaves like independent requests", async () => {
  // Models what the overlay's effect does on unmount/slug-change: abort the
  // old controller, then run a brand new fetch with a brand new one.
  const firstController = new AbortController();
  let firstCalls = 0;
  const hangingFetch = (_url: string, init: RequestInit) => {
    firstCalls += 1;
    return new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    });
  };
  const firstPromise = fetchPdpOverlayData("rad-1", firstController.signal, hangingFetch as never);
  firstController.abort(); // simulates closing the overlay / navigating away
  const firstResult = await firstPromise;
  assert.deepEqual(firstResult, { kind: "error" });
  assert.equal(firstCalls, 1);

  const secondController = new AbortController();
  const secondFetch = async () => jsonResponse({ product: { id: "p2" } });
  const secondResult = await fetchPdpOverlayData("rad-2", secondController.signal, secondFetch as never);
  assert.deepEqual(secondResult, { kind: "data", data: { product: { id: "p2" } } });
});
