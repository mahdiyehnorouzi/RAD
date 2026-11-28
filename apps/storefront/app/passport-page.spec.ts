import assert from "node:assert/strict";
import { test, mock } from "node:test";
import type { Artwork } from "@rad/types";

// BUG-12: a scanned QR for a published artwork redirected to the passport
// page, but the page rendered nothing (blank white page) whenever the
// *unrelated* catalog lookup (used only to compute "family"/"related"
// passports) failed — an unhandled rejection inside the page's own
// Promise.all. These mocks isolate that behavior from the real
// artwork/catalog/UI implementations. Lives outside app/[locale]/... because
// Node's test runner resolves file arguments as glob patterns, and
// "[locale]"/"[code]" are bracket-expression glob syntax there — a spec file
// inside those directories is silently never matched/run.

mock.module("@/components/passport", {
  namedExports: { PassportPage: () => null },
});
mock.module("@/lib/catalog/product-status", {
  namedExports: { isGoneStatus: () => false },
});
mock.module("@/lib/passport", {
  namedExports: {
    familyMembers: () => [],
    passportsFrom: () => [],
    relatedByFeeling: () => [],
    passportFromArtwork: (artwork: Artwork) => ({
      code: String(artwork.radNumber),
      name: artwork.title,
      inspiration: artwork.description,
      finalPhotos: [],
      status: "available",
    }),
  },
});
mock.module("@/lib/seo", {
  namedExports: {
    absoluteUrl: (path = "") => `https://rad-object.test${path}`,
    pageMetadata: (input: unknown) => input,
    safeJsonLd: () => "{}",
  },
});

let catalogResult: () => Promise<{
  artworks: Artwork[];
  products: unknown[];
  origin: "api" | "registry";
}>;
mock.module("@/lib/catalog/get-catalog-works", {
  namedExports: { getCatalog: () => catalogResult() },
});

let resolvedArtwork: () => Promise<Artwork | null>;
mock.module("@/lib/artworks/server", {
  namedExports: {
    fallbackArtworks: [],
    resolveArtwork: () => resolvedArtwork(),
  },
});

const { default: PassportDetail } =
  await import("./[locale]/passport/[code]/page");

function artwork(radNumber: number): Artwork {
  return {
    id: String(radNumber),
    slug: `work-${radNumber}`,
    radNumber,
    title: { fa: "اثر", en: "Work" },
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
  } as Artwork;
}

test("renders the passport when the artwork resolves, even if the unrelated catalog lookup rejects", async () => {
  resolvedArtwork = async () => artwork(84);
  catalogResult = () => Promise.reject(new Error("catalog API unreachable"));

  const result = await PassportDetail({
    params: Promise.resolve({ code: "084" }),
  });

  assert.ok(result, "expected the page to render instead of throwing");
});

test("still calls notFound when the scanned code itself has no artwork", async () => {
  resolvedArtwork = async () => null;
  catalogResult = async () => ({ artworks: [], products: [], origin: "api" });

  await assert.rejects(() =>
    PassportDetail({ params: Promise.resolve({ code: "999" }) }),
  );
});
