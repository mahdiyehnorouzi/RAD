"use client";

import {
  ArchiveSection,
  AboutRadPreview,
  CertificateSection,
  DifferenceStory,
  EntryPaths,
  EvidenceFilm,
  FinalCta,
  HomeHero,
  HomeProcessSection,
  featuredHomeWorks,
} from "@/components/home";
import { useCatalog } from "@/components/catalog/catalog-provider";

export default function Home() {
  const { products, loading } = useCatalog();
  const featured = featuredHomeWorks(products);

  return (
    <>
      <HomeHero />
      <EntryPaths />
      <ArchiveSection products={featured} loading={loading} />
      <AboutRadPreview />
      <DifferenceStory />
      <EvidenceFilm />
      <HomeProcessSection />
      <CertificateSection />
      <FinalCta />
    </>
  );
}
