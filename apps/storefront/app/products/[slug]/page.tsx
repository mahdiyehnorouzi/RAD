import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product";
import { fetchProduct } from "@/lib/api";
import { getProduct } from "@/lib/catalog";

export default async function PDP({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug).catch(() =>
    process.env.NODE_ENV === "development" ? getProduct(slug) : null,
  );
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
