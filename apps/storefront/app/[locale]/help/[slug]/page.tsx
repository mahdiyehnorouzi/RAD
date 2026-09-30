import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  POLICY_DOCUMENTS,
  PolicyPage,
  policyDocument,
} from "@/components/help";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return POLICY_DOCUMENTS.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = policyDocument(slug);
  if (!doc)
    return { title: "متن پیدا نشد", robots: { index: false, follow: false } };
  return pageMetadata({
    title: doc.title.fa,
    description: doc.summary.fa,
    path: `/help/${doc.slug}`,
    type: "article",
  });
}

export default async function PolicyRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = policyDocument(slug);
  if (!doc) notFound();
  return <PolicyPage slug={doc.slug} />;
}
