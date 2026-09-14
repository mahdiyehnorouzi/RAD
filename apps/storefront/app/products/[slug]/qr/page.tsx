import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import QRCode from "qrcode";
import { ProductQr } from "@/components/product";
import { fetchProduct } from "@/lib/api";
import { getProduct, mockProducts } from "@/lib/catalog/products";
import { photoWorks } from "@/lib/catalog/photo-works";
import {
  hasRealProductImage,
  overlayLiveProduct,
} from "@/lib/catalog/category-defaults";
import { absoluteUrl } from "@/lib/seo";

const resolveProduct = cache(async (slug: string) => {
  const remote = await fetchProduct(slug).catch(() => null);
  const local =
    photoWorks.find((item) => item.slug === slug) ?? getProduct(slug);
  const visual = remote && hasRealProductImage(remote) ? remote : local ?? remote;
  return visual ? overlayLiveProduct(visual, remote ?? undefined) : null;
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
  return [...photoWorks, ...mockProducts]
    .filter(
      (product, index, all) =>
        all.findIndex((item) => item.slug === product.slug) === index,
    )
    .map((product) => ({ slug: product.slug }));
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
