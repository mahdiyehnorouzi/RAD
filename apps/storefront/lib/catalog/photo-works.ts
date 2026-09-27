import { artworkRecords } from "@rad/artworks";

const TRANSPARENT_PREFIX = "/catalog/photos/transparent/";

export function catalogPhotoSrc(slug: string, imageIndex = 0) {
  const suffix = imageIndex === 0 ? "" : `-${imageIndex + 1}`;
  return `${TRANSPARENT_PREFIX}${slug}${suffix}.png`;
}

const PNG_LIFESTYLE_PHOTOS = new Set([
  "blue-window",
  "red-garden-print",
  "silver-orbit",
  "walnut-tide",
  "woven-garden",
]);

export function catalogLifestylePhotoSrc(slug: string, imageIndex = 0) {
  const suffix = imageIndex === 0 ? "" : `-${imageIndex + 1}`;
  const extension = PNG_LIFESTYLE_PHOTOS.has(slug) ? "png" : "webp";
  return `/catalog/photos/${slug}${suffix}.${extension}`;
}

/** Works photographed in the studio: a transparent cut-out plus a lifestyle photo. */
export const catalogLifestylePhotoSlugs = new Set(
  artworkRecords
    .filter((record) =>
      record.images.some((image) => image.src?.startsWith(TRANSPARENT_PREFIX)),
    )
    .map((record) => record.slug),
);
