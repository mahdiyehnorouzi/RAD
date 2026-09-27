import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import QRCode from "qrcode";
import { ProductQr } from "@/components/product";
import { productFromArtwork, resolveArtwork } from "@/lib/artworks";
import { displayWorks } from "@/lib/catalog/get-catalog-works";
import { absoluteUrl } from "@/lib/seo";

const resolveProduct = cache(async (slug: string) => {
  const artwork = await resolveArtwork(slug).catch(() => null);
  if (!artwork || artwork.slug !== slug || artwork.price === null) return null;
  return productFromArtwork(artwork);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolveProduct(slug);
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
  return displayWorks.map((product) => ({ slug: product.slug }));
}

export default async function ProductQrPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await resolveProduct(slug);
  if (!product) notFound();

  const targetUrl = absoluteUrl(`/products/${product.slug}`);
  const qrSvg = await QRCode.toString(targetUrl, {
    type: "svg",
    margin: 1,
    width: 280,
    errorCorrectionLevel: "M",
    color: { dark: "#1a1714", light: "#ffffff" },
  });

  return <ProductQr product={product} targetUrl={targetUrl} qrSvg={qrSvg} />;
}
