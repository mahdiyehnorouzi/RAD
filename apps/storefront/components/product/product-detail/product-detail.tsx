"use client";

import { ProductGallery } from "./product-gallery";
import { ProductInfo } from "./product-info";
import { RelatedWorks } from "./related-works";
import { ShippingFaq } from "./shipping-faq";
import { Reviews } from "@/components/reviews";
import { PageSection } from "@/components/ui/section";
import type {Product} from "@rad/types";

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
