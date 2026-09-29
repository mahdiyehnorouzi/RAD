const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://www.rad-object.com";

/** Absolute storefront URL for a storefront path; absolute URLs pass through. */
export function storefrontUrl(path: string) {
  return new URL(path, STOREFRONT_URL).toString();
}
