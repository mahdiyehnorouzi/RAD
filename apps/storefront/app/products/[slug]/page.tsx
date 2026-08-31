import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { fetchProduct } from "@/lib/catalog";

export default async function PDP({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
