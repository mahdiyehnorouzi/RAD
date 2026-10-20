import { test, mock } from "node:test";
import assert from "node:assert/strict";
import type { Artwork } from "@rad/types";

// "server-only" throws when loaded outside Next's Server Component build —
// stub it so resolve.ts (and source.ts/fallback.ts, which it imports) can
// run under the plain node:test runner.
mock.module("server-only", { defaultExport: undefined, namedExports: {} });

const { resolveArtwork, ArtworkUnreachableError } = await import("./resolve");

function artwork(overrides: Partial<Artwork> & { slug: string }): Artwork {
  return {
    id: overrides.slug,
    radNumber: null,
    title: { fa: "", en: "" },
    artist: {
      id: "rad-studio",
      name: { fa: "", en: "" },
      kind: "rad",
      verified: true,
    },
    category: "ceramics",
    price: null,
    currency: "IRT",
    usdPrice: null,
    year: null,
    materials: { body: { fa: "", en: "" }, surface: null, process: null },
    dimensions: null,
    description: { fa: "", en: "" },
    story: { fa: "", en: "" },
    care: null,
    images: [],
    color: "#000",
    accent: "#000",
    shape: "round",
    passport: null,
    difference: null,
    owner: null,
    ...overrides,
  } as Artwork;
}

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

test("resolveArtwork returns a successful empty-images response as-is, never backfilled from the registry", async () => {
  await withEnv({ NODE_ENV: "production", CATALOG_SOURCE: undefined }, () =>
    withFetch(
      (async () =>
        jsonResponse(
          artwork({ slug: "woven-garden", images: [], media: [] }),
        )) as typeof fetch,
      async () => {
        const result = await resolveArtwork("woven-garden");
        assert.ok(result);
        assert.deepEqual(result!.images, []);
      },
    ),
  );
});

test("resolveArtwork never returns registry data in production when the API throws", async () => {
  await withEnv({ NODE_ENV: "production", CATALOG_SOURCE: undefined }, () =>
    withFetch(
      (async () => {
        throw new TypeError("network down");
      }) as typeof fetch,
      async () => {
        await assert.rejects(
          () => resolveArtwork("woven-garden"),
          ArtworkUnreachableError,
        );
      },
    ),
  );
});

test("resolveArtwork falls back to the registry when the API throws outside production (CATALOG_SOURCE=auto)", async () => {
  await withEnv({ NODE_ENV: "development", CATALOG_SOURCE: undefined }, () =>
    withFetch(
      (async () => {
        throw new TypeError("network down");
      }) as typeof fetch,
      async () => {
        const result = await resolveArtwork("woven-garden");
        assert.ok(result, "expected the bundled registry entry as a fallback");
        assert.equal(result!.slug, "woven-garden");
      },
    ),
  );
});

test("resolveArtwork returns null on a 404 (unknown product), never registry data, in any environment", async () => {
  await withEnv({ NODE_ENV: "production", CATALOG_SOURCE: undefined }, () =>
    withFetch(
      (async () => jsonResponse({ error: "not found" }, 404)) as typeof fetch,
      async () => {
        const result = await resolveArtwork("does-not-exist");
        assert.equal(result, null);
      },
    ),
  );
});
