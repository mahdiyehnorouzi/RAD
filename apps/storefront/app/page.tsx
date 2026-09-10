"use client";

import {
  ArchiveSection,
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
      <DifferenceStory />
      <EvidenceFilm />
      <HomeProcessSection />
      <CertificateSection />
      <FinalCta />
    </>
  );
}
