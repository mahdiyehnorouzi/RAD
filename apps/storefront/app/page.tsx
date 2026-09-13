import {
  ArchiveSection,
  DifferenceStory,
  AboutRadPreview,
  HomeHero,
  featuredHomeWorks,
  CertificateSection,
  TodayInWorkshop,
} from "@/components/home";
import { EntryPaths } from "@/components/home/sections";
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
      <EntryPaths />
      <TodayInWorkshop />
      <AboutRadPreview />
      <ArchiveSection products={featured} />
      <DifferenceStory />
      <CertificateSection />
    </>
  );
}
