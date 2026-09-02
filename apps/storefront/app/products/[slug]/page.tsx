import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product";
import { fetchProduct } from "@/lib/api/catalog";

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
