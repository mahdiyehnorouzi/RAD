import assert from "node:assert/strict";
import { test } from "node:test";
import { ConfigService } from "@nestjs/config";
import { CatalogRevalidationService } from "./catalog-revalidation.service";

function configWith(values: Record<string, string>) {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

test("notifyChanged is a no-op when the storefront URL or secret is unset", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = (() => {
    called = true;
    throw new Error("must not be called");
  }) as typeof fetch;
  try {
    await new CatalogRevalidationService(configWith({})).notifyChanged();
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("notifyChanged POSTs the shared secret to the configured URL", async () => {
  const originalFetch = globalThis.fetch;
  let seenUrl: string | undefined;
  let seenSecret: string | null | undefined;
  globalThis.fetch = (async (
    url: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    seenUrl = String(url);
    seenSecret = new Headers(init?.headers).get("x-revalidate-secret");
    return new Response(null, { status: 200 });
  }) as typeof fetch;
  try {
    const service = new CatalogRevalidationService(
      configWith({
        STOREFRONT_REVALIDATE_URL: "https://storefront.example/api/revalidate-catalog",
        CATALOG_REVALIDATE_SECRET: "shh",
      }),
    );
    await service.notifyChanged();
    assert.equal(seenUrl, "https://storefront.example/api/revalidate-catalog");
    assert.equal(seenSecret, "shh");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("notifyChanged swallows a failing request instead of throwing", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("network down");
  }) as typeof fetch;
  try {
    const service = new CatalogRevalidationService(
      configWith({
        STOREFRONT_REVALIDATE_URL: "https://storefront.example/api/revalidate-catalog",
        CATALOG_REVALIDATE_SECRET: "shh",
      }),
    );
    await assert.doesNotReject(() => service.notifyChanged());
  } finally {
    globalThis.fetch = originalFetch;
  }
});
