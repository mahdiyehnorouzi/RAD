import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminProductImage } from "./admin-data";
import {
  briefExcerpt,
  canSelectAsCover,
  coverImage,
  coverImageIndex,
  selectAsCover,
  selectAsCoverBySrc,
} from "./product-cover";

function image(
  overrides: Partial<AdminProductImage> & Pick<AdminProductImage, "storage">,
): AdminProductImage {
  if (
    overrides.storage === "cloudinary" ||
    overrides.storage === "cloudinary_video" ||
    overrides.storage === "seaweedfs" ||
    overrides.storage === "seaweedfs_video"
  ) {
    return {
      storage: overrides.storage,
      objectKey:
        "objectKey" in overrides
          ? (overrides.objectKey ?? "")
          : "rad/products/p/a",
      src: overrides.src,
    };
  }
  return {
    storage: overrides.storage,
    src: "src" in overrides ? (overrides.src as string) : "/images/a.jpg",
  };
}

test("the first persisted still image is the cover", () => {
  const images = [
    image({ storage: "cloudinary", objectKey: "cover-key", src: "/cover.jpg" }),
    image({ storage: "cloudinary", objectKey: "other-key", src: "/other.jpg" }),
  ];
  assert.equal(coverImageIndex(images), 0);
  assert.equal(coverImage(images)?.objectKey, "cover-key");
});

test("video cannot be selected or treated as cover", () => {
  const video = image({
    storage: "cloudinary_video",
    objectKey: "vid-key",
    src: "/clip.mp4",
  });
  const photo = image({
    storage: "cloudinary",
    objectKey: "photo-key",
    src: "/photo.jpg",
  });
  assert.equal(canSelectAsCover(video), false);
  assert.equal(coverImageIndex([video, photo]), 1);
  assert.deepEqual(selectAsCover([video, photo], 0), [video, photo]);
});

test("incomplete or failed uploads cannot become the persisted cover", () => {
  const pending = image({
    storage: "cloudinary",
    objectKey: "",
    src: "blob:pending",
  });
  const ready = image({
    storage: "cloudinary",
    objectKey: "ready-key",
    src: "/ready.jpg",
  });
  assert.equal(canSelectAsCover(pending, { pending: true }), false);
  assert.equal(
    canSelectAsCover({ ...pending, src: "blob:err" }, { error: "fail" }),
    false,
  );
  assert.equal(coverImageIndex([pending, ready]), 1);
});

test("selectAsCover moves the chosen image first and keeps the rest in order", () => {
  const a = image({ storage: "static", src: "/a.jpg" });
  const b = image({ storage: "static", src: "/b.jpg" });
  const c = image({ storage: "static", src: "/c.jpg" });
  assert.deepEqual(selectAsCover([a, b, c], 2), [c, a, b]);
  assert.deepEqual(selectAsCover([a, b, c], 0), [a, b, c]);
});

test("selectAsCoverBySrc is a no-op for unknown or unfinished media", () => {
  const ready = image({
    storage: "cloudinary",
    objectKey: "ready-key",
    src: "/ready.jpg",
  });
  const pending = image({
    storage: "cloudinary",
    objectKey: "",
    src: "blob:pending",
  });
  const images = [ready, pending];
  assert.deepEqual(selectAsCoverBySrc(images, "missing"), images);
  assert.deepEqual(
    selectAsCoverBySrc(images, "blob:pending", {
      "blob:pending": { pending: true },
    }),
    images,
  );
});

test("existing products keep their current cover when gallery order is unchanged", () => {
  const cover = image({ storage: "static", src: "/existing-cover.jpg" });
  const extra = image({ storage: "static", src: "/extra.jpg" });
  assert.equal(coverImage([cover, extra])?.src, "/existing-cover.jpg");
});

test("briefExcerpt keeps short text and clips long Persian briefs", () => {
  assert.equal(briefExcerpt("کوتاه"), "کوتاه");
  const long = "الف".repeat(120);
  const excerpt = briefExcerpt(long, 40);
  assert.ok(excerpt.endsWith("…"));
  assert.ok(excerpt.length < long.length);
});
