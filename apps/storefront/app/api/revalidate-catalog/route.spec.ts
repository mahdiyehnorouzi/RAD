import assert from "node:assert/strict";
import { test, mock } from "node:test";

let updateTagCalls: string[] = [];
let revalidatePathCalls: Array<[string, string?]> = [];
let resetCalls = 0;

mock.module("next/cache", {
  namedExports: {
    updateTag: (tag: string) => updateTagCalls.push(tag),
    revalidatePath: (path: string, type?: string) =>
      revalidatePathCalls.push([path, type]),
  },
});
mock.module("@/lib/catalog/get-catalog-works", {
  namedExports: { resetProcessCatalogCache: () => resetCalls++ },
});

const { POST } = await import("./route");

const ORIGINAL_SECRET = process.env.CATALOG_REVALIDATE_SECRET;

function withSecret(value: string | undefined, fn: () => Promise<void>) {
  if (value === undefined) delete process.env.CATALOG_REVALIDATE_SECRET;
  else process.env.CATALOG_REVALIDATE_SECRET = value;
  updateTagCalls = [];
  revalidatePathCalls = [];
  resetCalls = 0;
  return fn().finally(() => {
    if (ORIGINAL_SECRET === undefined)
      delete process.env.CATALOG_REVALIDATE_SECRET;
    else process.env.CATALOG_REVALIDATE_SECRET = ORIGINAL_SECRET;
  });
}

function request(secret: string) {
  return new Request("https://storefront.example/api/revalidate-catalog", {
    method: "POST",
    headers: { "x-revalidate-secret": secret },
  });
}

test("rejects a request with no secret configured", () =>
  withSecret(undefined, async () => {
    const response = await POST(request("anything"));
    assert.equal(response.status, 503);
    assert.deepEqual(updateTagCalls, []);
  }));

test("rejects a request with the wrong secret", () =>
  withSecret("shh", async () => {
    const response = await POST(request("wrong"));
    assert.equal(response.status, 401);
    assert.deepEqual(updateTagCalls, []);
  }));

test("invalidates the catalog cache when the secret matches", () =>
  withSecret("shh", async () => {
    const response = await POST(request("shh"));
    assert.equal(response.status, 200);
    assert.deepEqual(updateTagCalls, ["catalog"]);
    assert.equal(resetCalls, 1);
    assert.deepEqual(revalidatePathCalls, [
      ["/", "layout"],
      ["/fa", undefined],
      ["/en", undefined],
    ]);
  }));

test("a secret of the wrong length is rejected, not thrown on", () =>
  withSecret("shh", async () => {
    const response = await POST(request("way-too-long-a-guess"));
    assert.equal(response.status, 401);
  }));

test("rate-limits a burst of requests per instance", () =>
  withSecret("shh", async () => {
    let lastStatus = 0;
    for (let i = 0; i < 40; i++) {
      lastStatus = (await POST(request("shh"))).status;
    }
    assert.equal(lastStatus, 429);
  }));
