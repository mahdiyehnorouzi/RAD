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

const { getCatalog } = await import("./get-catalog-works");

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
