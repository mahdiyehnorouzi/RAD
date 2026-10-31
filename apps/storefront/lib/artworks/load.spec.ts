import { test, mock } from "node:test";
import assert from "node:assert/strict";

// "server-only" throws when loaded outside Next's Server Component build —
// stub it so load.ts (and source.ts/fallback.ts, which it imports) can run
// under the plain node:test runner.
mock.module("server-only", { defaultExport: undefined, namedExports: {} });

const { loadArtworks } = await import("./load");

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function withFetch(impl: typeof fetch, fn: () => Promise<void>): Promise<void> {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return fn().finally(() => {
    globalThis.fetch = original;
  });
}

function withEnv(
  vars: Record<string, string | undefined>,
  fn: () => Promise<void>,
): Promise<void> {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) previous[key] = process.env[key];
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return fn().finally(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test("loadArtworks returns a successful empty catalog as-is in production, never backfilled from the registry", async () => {
  await withEnv({ NODE_ENV: "production", CATALOG_SOURCE: undefined }, () =>
    withFetch((async () => jsonResponse([])) as typeof fetch, async () => {
      const result = await loadArtworks();
      assert.equal(result.origin, "api");
      assert.deepEqual(result.artworks, []);
    }),
  );
});

test("loadArtworks throws in production when the API fails, never substituting the registry", async () => {
  await withEnv({ NODE_ENV: "production", CATALOG_SOURCE: undefined }, () =>
    withFetch(
      (async () => {
        throw new TypeError("network down");
      }) as typeof fetch,
      async () => {
        await assert.rejects(() => loadArtworks());
      },
    ),
  );
});

test("loadArtworks throws outside production too when CATALOG_SOURCE=api is set explicitly, never silently substituting the registry (connected integration testing)", async () => {
  await withEnv({ NODE_ENV: "development", CATALOG_SOURCE: "api" }, () =>
    withFetch(
      (async () => {
        throw new TypeError("network down");
      }) as typeof fetch,
      async () => {
        await assert.rejects(() => loadArtworks());
      },
    ),
  );
});

test("loadArtworks falls back to the registry outside production when the API fails (CATALOG_SOURCE=auto)", async () => {
  await withEnv({ NODE_ENV: "development", CATALOG_SOURCE: undefined }, () =>
    withFetch(
      (async () => {
        throw new TypeError("network down");
      }) as typeof fetch,
      async () => {
        const result = await loadArtworks();
        assert.equal(result.origin, "registry");
        assert.ok(result.artworks.length > 0);
      },
    ),
  );
});
