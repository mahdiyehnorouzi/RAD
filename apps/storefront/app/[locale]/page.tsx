import {
  ArchiveSection,
  HomeHero,
  featuredHomeWorks,
  CertificateSection,
  ThreadJourney,
} from "@/features/home";
import { getCatalog } from "@/lib/catalog/get-catalog-works";
import { livePiecesFrom, workshopToday } from "@/lib/now";
import { productListJsonLd, safeJsonLd } from "@/lib/seo";

export default async function Home() {
  const { artworks, products } = await getCatalog();
  const featured = featuredHomeWorks(products);
  const today = workshopToday(livePiecesFrom(artworks));

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
        workshop={today && { code: today.code, image: today.image }}
      />
    </>
  );
}
