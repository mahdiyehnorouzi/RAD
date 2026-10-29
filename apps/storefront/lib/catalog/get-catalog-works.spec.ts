import assert from "node:assert/strict";
import { test, mock } from "node:test";

mock.module("server-only", { defaultExport: undefined, namedExports: {} });

let loadArtworksCalls = 0;
let nextResult: { artworks: unknown[]; origin: "api" | "registry" } = {
  artworks: [],
  origin: "api",
};

mock.module("@/lib/artworks/server", {
  namedExports: {
    fallbackArtworks: [],
    loadArtworks: async () => {
      loadArtworksCalls++;
      return nextResult;
    },
  },
});
mock.module("@/lib/artworks", {
  namedExports: {
    shopProducts: (artworks: Array<{ slug: string }>) =>
      artworks.map((artwork) => ({ slug: artwork.slug })),
  },
});

const { getCatalog, getCatalogIndex, resetProcessCatalogCache } =
  await import("./get-catalog-works");

test("a genuinely empty API response is re-checked sooner than a non-empty one", async (t) => {
  t.mock.timers.enable({ apis: ["Date"] });

  nextResult = { artworks: [], origin: "api" };
  await getCatalog();
  assert.equal(loadArtworksCalls, 1);

  // Within the short empty-result window: still cached, no re-fetch.
  t.mock.timers.tick(4_000);
  await getCatalog();
  assert.equal(loadArtworksCalls, 1);

  // Past the short window (but well inside the normal 30s one): re-fetches.
  t.mock.timers.tick(2_000);
  await getCatalog();
  assert.equal(loadArtworksCalls, 2);
});

test("getCatalogIndex does not publish bundled registry rows as the customer catalog", async () => {
  resetProcessCatalogCache();
  nextResult = {
    origin: "registry",
    artworks: [
      {
        slug: "croissant-handle-mug",
        title: { fa: "demo", en: "demo" },
        radNumber: 1,
        category: "ceramics",
        difference: null,
      },
    ],
  };
  const index = await getCatalogIndex();
  assert.deepEqual(index, []);
});
