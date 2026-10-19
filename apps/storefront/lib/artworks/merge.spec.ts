import { test } from "node:test";
import assert from "node:assert/strict";
import type { Artwork, ProductImage } from "@rad/types";
import { mergeArtwork, mergeArtworks } from "./merge";

function image(src: string, kind: ProductImage["kind"] = "image"): ProductImage {
  return { src, kind, alt: "art", enAlt: "art" };
}

function artwork(overrides: Partial<Artwork> & { slug: string }): Artwork {
  return {
    id: overrides.slug,
    radNumber: null,
    title: { fa: "", en: "" },
    artist: { id: "rad-studio", name: { fa: "", en: "" }, kind: "rad", verified: true },
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

test("mergeArtwork prefers live API images over the static registry's", () => {
  const live = artwork({
    slug: "woven-garden",
    images: [image("https://seaweedfs.example.com/woven-garden-1.webp")],
  });
  const display = artwork({
    slug: "woven-garden",
    images: [image("/catalog/photos/transparent/woven-garden.webp")],
  });
  const merged = mergeArtwork(live, display);
  assert.deepEqual(merged.images, live.images);
});

test("mergeArtwork falls back to the static registry when the API has no images", () => {
  const live = artwork({ slug: "woven-garden", images: [] });
  const display = artwork({
    slug: "woven-garden",
    images: [image("/catalog/photos/transparent/woven-garden.webp")],
  });
  const merged = mergeArtwork(live, display);
  assert.deepEqual(merged.images, display.images);
});

test("mergeArtwork keeps live images when there is no display counterpart", () => {
  const live = artwork({
    slug: "new-work",
    images: [image("https://cdn.example.com/new-work.webp")],
  });
  const merged = mergeArtwork(live, undefined);
  assert.deepEqual(merged, live);
});

test("mergeArtwork preserves video entries and ordering from the live API media", () => {
  const liveMedia = [
    image("https://cdn.example.com/a.webp"),
    image("https://cdn.example.com/clip.mp4", "video"),
    image("https://cdn.example.com/b.webp"),
  ];
  const live = artwork({
    slug: "woven-garden",
    images: [liveMedia[0], liveMedia[2]],
    media: liveMedia,
  });
  const display = artwork({
    slug: "woven-garden",
    images: [image("/catalog/photos/transparent/woven-garden.webp")],
  });
  const merged = mergeArtwork(live, display);
  assert.deepEqual(merged.media, liveMedia);
  assert.deepEqual(merged.images, live.images);
});

test("mergeArtwork falls back to display media when live has none", () => {
  const live = artwork({ slug: "woven-garden", images: [], media: [] });
  const display = artwork({
    slug: "woven-garden",
    images: [image("/catalog/photos/transparent/woven-garden.webp")],
    media: [image("/catalog/photos/transparent/woven-garden.webp")],
  });
  const merged = mergeArtwork(live, display);
  assert.deepEqual(merged.media, display.media);
});

test("mergeArtwork accepts legacy API-proxied image paths as real media", () => {
  const live = artwork({
    slug: "woven-garden",
    images: [image("/catalog/images/42")],
  });
  const display = artwork({
    slug: "woven-garden",
    images: [image("/catalog/photos/transparent/woven-garden.webp")],
  });
  const merged = mergeArtwork(live, display);
  assert.deepEqual(merged.images, live.images);
});

test("mergeArtworks only keeps works the API still knows about, each with its own correctly-sourced images", () => {
  const live = [
    artwork({
      slug: "woven-garden",
      images: [image("https://seaweedfs.example.com/woven-garden-1.webp")],
    }),
    artwork({ slug: "no-photos-yet", images: [] }),
  ];
  const display = [
    artwork({
      slug: "woven-garden",
      images: [image("/catalog/photos/transparent/woven-garden.webp")],
    }),
    artwork({
      slug: "no-photos-yet",
      images: [image("/catalog/photos/transparent/no-photos-yet.webp")],
    }),
    artwork({
      slug: "discontinued",
      images: [image("/catalog/photos/transparent/discontinued.webp")],
    }),
  ];
  const merged = mergeArtworks(live, display);
  assert.equal(merged.length, 2);
  assert.deepEqual(
    merged.map((a) => a.slug),
    ["woven-garden", "no-photos-yet"],
  );
  assert.deepEqual(merged[0].images, live[0].images);
  assert.deepEqual(merged[1].images, display[1].images);
});
