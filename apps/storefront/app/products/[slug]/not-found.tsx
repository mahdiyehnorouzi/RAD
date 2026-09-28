import type { Metadata } from "next";
import { ProductNotFound } from "@/components/product";
import { notFoundMetadata } from "@/lib/seo";

export const metadata: Metadata = notFoundMetadata(
  "اثر پیدا نشد",
  "این اثر در فروشگاه رَد نیست یا دیگر فروخته نمی‌شود.",
);

export default function NotFound() {
  return <ProductNotFound />;
}
