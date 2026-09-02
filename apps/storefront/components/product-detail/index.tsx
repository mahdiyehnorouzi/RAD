"use client";

import { ProductGallery } from "@/components/product-detail/product-gallery";
import { ProductInfo } from "@/components/product-detail/product-info";
import { RelatedWorks } from "@/components/product-detail/related-works";
import { ShippingFaq } from "@/components/product-detail/shipping-faq";
import { Reviews } from "@/components/reviews";
import { PageSection } from "@/components/ui/section";
import type { Product } from "@/lib/products";

export function ProductDetail({ product }: { product: Product }) {
  return (
    <>
      <PageSection className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:items-start">
        <ProductGallery product={product} />
        <ProductInfo product={product} />
      </PageSection>
      <ShippingFaq />
      <Reviews product={product} />
      <RelatedWorks currentSlug={product.slug} />
    </>
  );
}
