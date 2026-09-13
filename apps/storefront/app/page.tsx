import {
  ArchiveSection,
  DifferenceStory,
  HomeHero,
  featuredHomeWorks,
} from "@/components/home";
import { getCatalogWorks } from "@/lib/catalog/get-catalog-works";
import { productListJsonLd, safeJsonLd } from "@/lib/seo";

export default async function Home() {
  const products = await getCatalogWorks();
  const featured = featuredHomeWorks(products);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(productListJsonLd(featured, "/")),
        }}
      />
      <HomeHero />
      <ArchiveSection products={featured} />
      <DifferenceStory />
    </>
  );
}
