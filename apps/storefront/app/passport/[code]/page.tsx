import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PassportPage } from "@/components/passport";
import { findPassport, radPassports } from "@/lib/passport";
import { pageMetadata } from "@/lib/seo";

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
  return pageMetadata({
    title: `${passport.name.fa} — گذرنامه رَد ${passport.code}`,
    description: passport.inspiration.fa.slice(0, 160),
    path: `/passport/${passport.code}`,
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
  return (
    <section className="section">
      <PassportPage passport={passport} />
    </section>
  );
}
