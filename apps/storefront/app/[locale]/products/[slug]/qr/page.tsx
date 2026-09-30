import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import QRCode from "qrcode";
import { formatRadCode } from "@rad/types";
import { ProductQr } from "@/components/product";
import { productFromArtwork } from "@/lib/artworks";
import { resolveArtwork } from "@/lib/artworks/server";
import { registryProducts } from "@/lib/catalog/get-catalog-works";
import { passportFromArtwork } from "@/lib/passport";
import { absoluteUrl } from "@/lib/seo";
import { recover } from "@/lib/log";

const resolveWork = cache(async (slug: string) => {
  const artwork = await resolveArtwork(slug).catch(
    recover(`product qr ${slug}`, null),
  );
  if (!artwork || artwork.slug !== slug || artwork.price === null) return null;
  return {
    product: productFromArtwork(artwork),
    made: passportFromArtwork(artwork)?.dateCreated,
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = (await resolveWork(slug))?.product;
  if (!product) {
    return { title: "اثر پیدا نشد", robots: { index: false, follow: false } };
  }

  return {
    title: `QR · ${product.name}`,
    description: `کد QR اثر ${product.name}`,
    alternates: { canonical: `/products/${product.slug}/qr` },
    robots: { index: false, follow: true },
  };
}

export function generateStaticParams() {
  return registryProducts().map((product) => ({ slug: product.slug }));
}

export default async function ProductQrPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = await resolveWork(slug);
  if (!work) notFound();
  const { product, made } = work;

  const targetUrl = absoluteUrl(
    product.radNumber
      ? `/r/${formatRadCode(product.radNumber)}`
      : `/products/${product.slug}`,
  );
  const qrSvg = await QRCode.toString(targetUrl, {
    type: "svg",
    margin: 1,
    width: 280,
    errorCorrectionLevel: "M",
    color: { dark: "#1a1714", light: "#ffffff" },
  });

  return (
    <ProductQr
      product={product}
      targetUrl={targetUrl}
      qrSvg={qrSvg}
      made={made}
    />
  );
}
