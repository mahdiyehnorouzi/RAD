import { test } from "node:test";
import assert from "node:assert/strict";
import { createUpstreamSignal, isUpstreamTimeout, proxyApiRequest } from "./proxy";

test("createUpstreamSignal aborts with TimeoutError once the deadline passes", async () => {
  const inbound = new AbortController();
  const { signal, dispose } = createUpstreamSignal(inbound.signal, 5);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(signal.aborted, true);
  assert.equal(isUpstreamTimeout(signal, inbound.signal), true);
  dispose();
});

test("createUpstreamSignal aborts immediately when the inbound request is already aborted", () => {
  const inbound = new AbortController();
  inbound.abort(new DOMException("client gone", "AbortError"));
  const { signal, dispose } = createUpstreamSignal(inbound.signal, 60_000);
  assert.equal(signal.aborted, true);
  assert.equal(isUpstreamTimeout(signal, inbound.signal), false);
  dispose();
});

test("createUpstreamSignal propagates a later inbound abort without waiting for the timeout", async () => {
  const inbound = new AbortController();
  const { signal, dispose } = createUpstreamSignal(inbound.signal, 60_000);
  inbound.abort(new DOMException("client gone", "AbortError"));
  assert.equal(signal.aborted, true);
  assert.equal(isUpstreamTimeout(signal, inbound.signal), false);
  dispose();
});

test("proxyApiRequest returns a 504 with a timeout code when the upstream fetch hangs", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = (async (_target: unknown, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("aborted", "AbortError"));
      });
    });
  }) as typeof fetch;

  const request = new Request("https://storefront.example/backend/catalog");
  const response = await proxyApiRequest(request, ["catalog"]);
  assert.equal(response.status, 504);
  const body = await response.json();
  assert.equal(body.code, "timeout");
});

test("proxyApiRequest returns a 503 for a non-timeout upstream failure", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = (async () => {
    throw new TypeError("network down");
  }) as unknown as typeof fetch;

  const request = new Request("https://storefront.example/backend/catalog");
  const response = await proxyApiRequest(request, ["catalog"]);
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, "upstream_unavailable");
});

test("proxyApiRequest forwards a successful upstream response and tags it with a request id", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;

  const request = new Request("https://storefront.example/backend/catalog");
  const response = await proxyApiRequest(request, ["catalog"]);
  assert.equal(response.status, 200);
  assert.ok(response.headers.get("x-request-id"));
  // Dev-only Server-Timing: a duration measured entirely on this side, for
  // the client to line up against its own performance.now() total.
  assert.match(response.headers.get("server-timing") ?? "", /^proxy;dur=\d+$/);
});
