"use client";

import { ArchiveSection } from "@/components/home/archive-section";
import { OrdersEntry, FinalCta } from "@/components/home/closing-sections";
import { EntryPaths } from "@/components/home/entry-paths";
import { EvidenceFilm } from "@/components/home/evidence-film";
import { HomeHero } from "@/components/home/home-hero";
import {
  ProcessSection,
  ProvenanceSection,
  StorySection,
} from "@/components/home/story-sections";
import { StudioCallout } from "@/components/home/studio-callout";
import { useCatalog } from "@/components/catalog-provider";

export default function Home() {
  const { products } = useCatalog();
  const featured = products
    .filter((product) => product.images?.some((image) => image.src))
    .slice(0, 6);
  const hero = featured[1] ?? featured[0] ?? products[0];
  const studio = featured[2] ?? products[1] ?? products[0];

  return (
    <>
      <HomeHero product={hero} />
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
