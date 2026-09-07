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
} from "@/components/home/sections";
import { useCatalog } from "@/components/catalog/catalog-provider";

export default function Home() {
  const { products, loading } = useCatalog();
  const featured = products.slice(0, 6);
  const hero = featured[0];
  const studio = featured[1] ?? featured[0];

  return (
    <>
      <HomeHero product={hero} />
      <DifferenceStory />
      <EvidenceFilm />
      <EntryPaths />
      <ArchiveSection products={featured} loading={loading} />
      <StudioCallout product={studio} />
      <StorySection />
      <ProvenanceSection />
      <ProcessSection />
      <OrdersEntry />
      <FinalCta />
    </>
  );
}
