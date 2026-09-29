// Keep the folder list in step with the matching redirect in next.config.mjs.
// /catalog/images/ holds API uploads, which keep their original format.
const LEGACY_PUBLIC_IMAGE =
  /^\/(?:about|catalog\/(?!images\/)|contact|difference|help|home|making|now|shape|states|studio)[\w/-]*\.(?:png|jpe?g)$/;

/**
 * Public images are WebP; API rows written before the switch still point at
 * the old .png/.jpg names. Rewriting here avoids a redirect per image and
 * keeps next/image, which does not follow redirects, working.
 */
export function withCurrentAssetPaths<T>(value: T): T {
  if (typeof value === "string") {
    return (LEGACY_PUBLIC_IMAGE.test(value) ? value.replace(/\.(?:png|jpe?g)$/, ".webp") : value) as T;
  }
  if (Array.isArray(value)) return value.map(withCurrentAssetPaths) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, withCurrentAssetPaths(entry)]),
    ) as T;
  }
  return value;
}
