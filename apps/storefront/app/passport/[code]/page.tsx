import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PassportPage } from "@/components/passport";
import { findPassport, radPassports } from "@/lib/passport";
import { absoluteUrl, pageMetadata, safeJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return radPassports.map((passport) => ({ code: passport.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const passport = findPassport(code);
  if (!passport) {
    return { title: "گذرنامه پیدا نشد", robots: { index: false, follow: false } };
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
  const passport = findPassport(code);
  if (!passport) notFound();

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
    <section className="section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <PassportPage passport={passport} />
    </section>
  );
}
