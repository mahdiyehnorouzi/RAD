import type { Metadata } from "next";
import { museumPortraits, portraitById } from "@/lib/difference";

export function generateStaticParams() {
  return museumPortraits.map((portrait) => ({ id: portrait.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const portrait = portraitById(id);
  if (!portrait) return { title: "روایت پیدا نشد", robots: { index: false, follow: false } };
  const title = `روایت ساخت ${portrait.code}`;
  const description = portrait.described.fa;
  const path = `/differences/${portrait.id}`;
  const image = portrait.stageImages?.material;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "article", locale: "fa_IR", title, description, url: path, images: image ? [{ url: image, alt: description }] : undefined },
  };
}

export default function DifferenceLayout({ children }: { children: React.ReactNode }) { return children; }
