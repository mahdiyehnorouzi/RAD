import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PassportPage } from "@/components/passport";
import { fallbackArtworks, resolveArtwork } from "@/lib/artworks/server";
import { getCatalog } from "@/lib/catalog/get-catalog-works";
import { isGoneStatus } from "@/lib/catalog/product-status";
import {
  familyMembers,
  passportFromArtwork,
  passportsFrom,
  relatedByFeeling,
} from "@/lib/passport";
import { absoluteUrl, pageMetadata, safeJsonLd } from "@/lib/seo";
import { recover } from "@/lib/log";

const resolvePassport = cache(async (code: string) => {
  const artwork = await resolveArtwork(code).catch(
    recover(`passport ${code}`, null),
  );
  return artwork ? passportFromArtwork(artwork) : null;
});

export function generateStaticParams() {
  return passportsFrom(fallbackArtworks).map((passport) => ({
    code: passport.code,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const passport = await resolvePassport(code);
  if (!passport) {
    return {
      title: "گذرنامه پیدا نشد",
      robots: { index: false, follow: false },
    };
  }
  const image = passport.finalPhotos[0]?.src;
  return pageMetadata({
    title: `${passport.name.fa} — گذرنامه رَد ${passport.code}`,
    description: passport.inspiration.fa.slice(0, 160),
    path: `/passport/${passport.code}`,
    image,
  });
}

export default async function PassportDetail({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [passport, { artworks }] = await Promise.all([
    resolvePassport(code),
    getCatalog(),
  ]);
  if (!passport) notFound();
  const passports = passportsFrom(artworks);

  const path = `/passport/${passport.code}`;
  const image = passport.finalPhotos[0]?.src;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${absoluteUrl(path)}#passport`,
    name: passport.name.fa,
    alternateName: passport.name.en,
    description: passport.inspiration.fa,
    identifier: passport.code,
    url: absoluteUrl(path),
    image: image ? absoluteUrl(image) : undefined,
    inLanguage: ["fa-IR", "en"],
    isPartOf: { "@id": `${absoluteUrl()}#website` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <PassportPage
        passport={passport}
        family={familyMembers(passports, passport.code)}
        related={
          isGoneStatus(passport.status)
            ? relatedByFeeling(passports, passport.code)
            : []
        }
      />
    </>
  );
}
