import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LivePage } from "@/components/now";
import { findLivePiece, livePieces } from "@/lib/now";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return livePieces.map((piece) => ({ code: piece.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const piece = findLivePiece(code);
  if (!piece) {
    return { title: "این رَد پیدا نشد", robots: { index: false, follow: false } };
  }
  return pageMetadata({
    title: `رَد ${piece.code} دارد ساخته می‌شود`,
    description: piece.notes[0]?.body.fa ?? piece.name.fa,
    path: `/now/${piece.code}`,
  });
}

export default async function LiveMaking({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const piece = findLivePiece(code);
  if (!piece) notFound();
  return (
    <section className="section">
      <LivePage piece={piece} />
    </section>
  );
}
