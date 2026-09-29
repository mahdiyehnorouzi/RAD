import {
  ArchiveSection,
  HomeHero,
  featuredHomeWorks,
  CertificateSection,
  ThreadJourney,
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
      {/* Keyed: ThreadJourney renders these slots side by side, and React checks server-made elements there for keys. */}
      <ThreadJourney
        hero={<HomeHero key="hero" />}
        works={<ArchiveSection key="works" products={featured} />}
        closing={<CertificateSection key="closing" />}
      />
    </>
  );
}
