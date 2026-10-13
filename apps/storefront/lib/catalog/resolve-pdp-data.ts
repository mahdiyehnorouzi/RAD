import { cache } from "react";
import QRCode from "qrcode";
import { formatRadCode, type Artwork, type Product } from "@rad/types";
import type { RadPassport } from "@/components/passport/type";
import { fetchFaq } from "@/lib/api";
import { productFromArtwork } from "@/lib/artworks";
import { resolveArtwork } from "@/lib/artworks/server";
import { getCatalog } from "@/lib/catalog/get-catalog-works";
import { relatedWorks } from "@/lib/catalog/related";
import { passportFromArtwork } from "@/lib/passport";
import { absoluteUrl } from "@/lib/seo";
import { recover } from "@/lib/log";

export type ResolvedWork =
  | { kind: "moved"; to: string }
  | {
      kind: "product";
      product: Product;
      artwork: Artwork;
      priceToman: number;
      passport?: RadPassport;
      passportPath?: string;
    };

/**
 * Only works offered in the shop have a product page. A RAD number resolves to
 * its slug, and a work never offered for sale lives on its passport. Both are
 * temporary redirects: slugs and prices can still change.
 *
 * This is the single source of truth for "what product page data does this
 * slug resolve to" — both the real route (`app/[locale]/products/[slug]/
 * page.tsx`) and the product-card overlay's data endpoint
 * (`app/api/pdp/[slug]/route.ts`) call this, so there is exactly one place
 * that decides availability/pricing/passport resolution, not two.
 */
export const resolveWork = cache(
  async (slug: string): Promise<ResolvedWork | null> => {
    const artwork = await resolveArtwork(slug);
    if (!artwork) return null;
    const passport = passportFromArtwork(artwork);
    const passportPath = passport ? `/passport/${passport.code}` : undefined;
    if (artwork.price === null)
      return passportPath ? { kind: "moved", to: passportPath } : null;
    if (artwork.slug !== slug)
      return { kind: "moved", to: `/products/${artwork.slug}` };
    return {
      kind: "product",
      product: productFromArtwork(artwork),
      artwork,
      priceToman: artwork.price,
      passport: passport ?? undefined,
      passportPath,
    };
  },
);

export type PdpData = {
  product: Product;
  artwork: Artwork;
  priceToman: number;
  passport?: RadPassport;
  passportPath?: string;
  qrSvg?: string;
  related: Product[];
  faq: Awaited<ReturnType<typeof fetchFaq>>;
};

/**
 * Everything `ProductDetail` needs for a *complete* render — the same data
 * the direct route fetches, used also by the card-click overlay so the two
 * never diverge. Returns `null` for an unknown slug, or the redirect target
 * for a moved one; callers decide how to handle each themselves.
 */
export async function resolvePdpData(
  slug: string,
): Promise<PdpData | { moved: string } | null> {
  const work = await resolveWork(slug);
  if (!work) return null;
  if (work.kind === "moved") return { moved: work.to };

  const { product, artwork, priceToman, passport, passportPath } = work;
  const qrTarget = absoluteUrl(
    product.radNumber
      ? `/r/${formatRadCode(product.radNumber)}`
      : `/products/${product.slug}`,
  );
  const [faq, qrSvg, catalog] = await Promise.all([
    fetchFaq("fa"),
    QRCode.toString(qrTarget, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#1a1714", light: "#00000000" },
    }).catch(recover("product qr svg", undefined)),
    getCatalog(),
  ]);

  return {
    product,
    artwork,
    priceToman,
    passport,
    passportPath,
    qrSvg,
    related: relatedWorks(product, catalog.products),
    faq,
  };
}
