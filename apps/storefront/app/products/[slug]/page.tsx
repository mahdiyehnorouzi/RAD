import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product";
import { fetchProduct } from "@/lib/api";
import { getProduct } from "@/lib/catalog/products";
import { photoWorks } from "@/lib/catalog/photo-works";
import {
  hasRealProductImage,
  overlayLiveProduct,
} from "@/lib/catalog/category-defaults";

export default async function PDP({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const remote = await fetchProduct(slug).catch(() => null);
  const local =
    photoWorks.find((item) => item.slug === slug) ?? getProduct(slug);
  const visual =
    remote && hasRealProductImage(remote) ? remote : local ?? remote;
  if (!visual) notFound();
  const product = overlayLiveProduct(visual, remote ?? undefined);
  return <ProductDetail product={product} />;
}
