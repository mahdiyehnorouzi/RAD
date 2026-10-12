import { test } from "node:test";
import assert from "node:assert/strict";
import { createUpstreamSignal, isUpstreamTimeout, proxyApiRequest } from "./proxy-api";

test("createUpstreamSignal aborts with TimeoutError once the deadline passes", async () => {
  const inbound = new AbortController();
  const { signal, dispose } = createUpstreamSignal(inbound.signal, 5);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(signal.aborted, true);
  assert.equal(isUpstreamTimeout(signal, inbound.signal), true);
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

  const request = new Request("https://admin.example/backend/orders");
  const response = await proxyApiRequest(request, ["orders"]);
  assert.equal(response.status, 504);
  const body = await response.json();
  assert.equal(body.code, "timeout");
});

test("proxyApiRequest no longer throws unhandled on a rejected upstream fetch", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = (async () => {
    throw new TypeError("network down");
  }) as unknown as typeof fetch;

  const request = new Request("https://admin.example/backend/orders");
  const response = await proxyApiRequest(request, ["orders"]);
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, "upstream_unavailable");
});
