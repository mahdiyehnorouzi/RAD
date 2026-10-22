import {
  ArchiveSection,
  HomeHero,
  featuredHomeWorks,
  CertificateSection,
  ThreadJourney,
} from "@/features/home";
// Imported from its own file, not the shared `@/features/home` barrel:
// that barrel is also reachable from client components elsewhere (e.g.
// components/making/making-process.tsx), and bundling JourneyWorkshop's
// next/root-params dependency into a client bundle is a build error.
import { JourneyWorkshop } from "@/features/home/sections/thread-journey/journey-workshop";
import { getCatalog } from "@/lib/catalog/get-catalog-works";
import { livePiecesFrom, workshopToday } from "@/lib/now";
import { productListJsonLd, safeJsonLd } from "@/lib/seo";

export default async function Home() {
  const { artworks, products } = await getCatalog();
  const featured = featuredHomeWorks(products);
  const today = workshopToday(livePiecesFrom(artworks));

  return (
    <>
      {/* The hero's first card (the page's LCP element) — discovered and fetched before the browser parses the image tag itself. */}
      <link
        rel="preload"
        as="image"
        href="/home/hero/work-01-wall-textile.webp"
        fetchPriority="high"
      />
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
        workshopSlot={
          <JourneyWorkshop
            key="workshop"
            piece={today && { code: today.code, image: today.image }}
          />
        }
      />
    </>
  );
}
