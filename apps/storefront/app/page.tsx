"use client";

import {
  ArchiveSection,
  DifferenceStory,
  EntryPaths,
  EvidenceFilm,
  FinalCta,
  HomeHero,
  OrdersEntry,
  ProcessSection,
  ProvenanceSection,
  StorySection,
  StudioCallout,
} from "@/components/home";
import { hasRealProductImage } from "@/lib/catalog";
import { useCatalog } from "@/components/catalog";

export default function Home() {
  const { products } = useCatalog();
  const featured = products.filter(hasRealProductImage).slice(0, 6);
  const hero = featured[0];
  const studio = featured[1] ?? featured[0];

  return (
    <>
      <HomeHero product={hero} />
      <DifferenceStory />
      <EvidenceFilm />
      <EntryPaths />
      <ArchiveSection products={featured} />
      <StudioCallout product={studio} />
      <StorySection />
      <ProvenanceSection />
      <ProcessSection />
      <OrdersEntry />
      <FinalCta />
    </>
  );
}
