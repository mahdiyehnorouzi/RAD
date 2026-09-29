import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fallbackArtworks } from "@/lib/artworks/server";
import { portraitsFrom } from "@/lib/difference";
import { resolveDifference } from "@/lib/difference/resolve";
import { absoluteUrl, pageMetadata, safeJsonLd } from "@/lib/seo";

async function resolvePortrait(id: string) {
  const work = await resolveDifference(id);
  return work && work.portrait;
}

export function generateStaticParams() {
  return portraitsFrom(fallbackArtworks).map((portrait) => ({
    id: portrait.id,
  }));
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
