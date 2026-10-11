const TRANSPARENT_PREFIX = "/catalog/photos/transparent/";

function imageSuffix(imageIndex: number) {
  return imageIndex === 0 ? "" : `-${imageIndex + 1}`;
}

/**
 * Reconstructs the transparent studio-photo path from a product's slug.
 * Kept for other call sites (e.g. `material-texture.ts`,
 * `product-anatomy.tsx`, `result-card.tsx`) that are out of scope for this
 * change. `components/product/listing/product-media.tsx` no longer uses
 * this — it now trusts the real `src` the API returns for `static`-storage
 * images instead of reconstructing it, since masking those paths behind
 * `/catalog/images/:id` was the only reason this existed there.
 */
export function catalogPhotoSrc(slug: string, imageIndex = 0) {
  return `${TRANSPARENT_PREFIX}${slug}${imageSuffix(imageIndex)}.webp`;
}

export function catalogLifestylePhotoSrc(slug: string, imageIndex = 0) {
  return `/catalog/photos/${slug}${imageSuffix(imageIndex)}.webp`;
}

/** Photographed in the studio: a transparent cut-out plus a lifestyle photo. */
export function hasStudioPhotos(work: {
  images?: readonly { src?: string }[];
}) {
  return Boolean(
    work.images?.some((image) => image.src?.startsWith(TRANSPARENT_PREFIX)),
  );
}

/**
 * Studio-photographed products have a lifestyle companion photo alongside
 * the transparent cut-out the API returns for `images[i].src`: same
 * filename, one directory up. Derived from the real `src` the API gives us
 * rather than reconstructed from the product slug.
 */
export function lifestylePhotoSrc(transparentSrc: string) {
  return transparentSrc.startsWith(TRANSPARENT_PREFIX)
    ? `/catalog/photos/${transparentSrc.slice(TRANSPARENT_PREFIX.length)}`
    : transparentSrc;
}
