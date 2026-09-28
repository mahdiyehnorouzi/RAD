import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { resolveArtwork } from "@/lib/artworks";
import {
  museumPortraits,
  portraitById,
  portraitFromArtwork,
} from "@/lib/difference";
import { absoluteUrl, pageMetadata, safeJsonLd } from "@/lib/seo";

/** `null` = the API has no such portrait; `undefined` = API unreachable and not in the registry. */
const resolvePortrait = cache(async (id: string) => {
  const artwork = await resolveArtwork(id).catch(() => undefined);
  if (artwork === undefined) return portraitById(museumPortraits, id);
  const portrait = artwork && portraitFromArtwork(artwork);
  return portrait && portrait.id === id ? portrait : null;
});

export function generateStaticParams() {
  return museumPortraits.map((portrait) => ({ id: portrait.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const portrait = await resolvePortrait(id);
  if (!portrait)
    return { title: "روایت پیدا نشد", robots: { index: false, follow: false } };
  const title = `روایت ساخت ${portrait.code}`;
  const description = portrait.described.fa;
  const path = `/differences/${portrait.id}`;
  const image = portrait.stageImages?.material;
  return pageMetadata({ title, description, path, image, type: "article" });
}

export default async function DifferenceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const portrait = await resolvePortrait(id);
  if (portrait === null) notFound();
  if (!portrait) return children;

  const path = `/differences/${portrait.id}`;
  const image = portrait.stageImages?.material;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${absoluteUrl(path)}#work`,
    name: `روایت ساخت ${portrait.code}`,
    alternateName: portrait.code,
    description: portrait.described.fa,
    inLanguage: "fa-IR",
    url: absoluteUrl(path),
    image: image ? absoluteUrl(image) : undefined,
    creator: {
      "@type": "Person",
      name: portrait.maker.fa,
    },
    isPartOf: { "@id": `${absoluteUrl()}#website` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      {children}
    </>
  );
}
