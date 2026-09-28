import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  POLICY_DOCUMENTS,
  PolicyPage,
  currentPolicyVersion,
  formatPolicyDate,
  policyDocument,
  policyVersion,
} from "@/components/help";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

/** Only archived versions get their own URL; the current one lives at `/help/[slug]`. */
export function generateStaticParams() {
  return POLICY_DOCUMENTS.flatMap((doc) =>
    doc.versions
      .slice(1)
      .map((version) => ({ slug: doc.slug, version: version.id })),
  );
}

function resolve(slug: string, version: string) {
  const doc = policyDocument(slug);
  const shown = doc && policyVersion(doc, version);
  if (!doc || !shown || shown.id === currentPolicyVersion(doc).id)
    return undefined;
  return { doc, shown };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; version: string }>;
}): Promise<Metadata> {
  const { slug, version } = await params;
  const found = resolve(slug, version);
  if (!found)
    return { title: "متن پیدا نشد", robots: { index: false, follow: false } };
  const { doc, shown } = found;
  return {
    ...pageMetadata({
      title: `${doc.title.fa} — نسخه‌ی ${formatPolicyDate(shown.id, "fa")}`,
      description: doc.summary.fa,
      path: `/help/${doc.slug}/v/${shown.id}`,
      type: "article",
    }),
    alternates: { canonical: `/help/${doc.slug}` },
    robots: { index: false, follow: true },
  };
}

export default async function PolicyVersionRoute({
  params,
}: {
  params: Promise<{ slug: string; version: string }>;
}) {
  const { slug, version } = await params;
  const found = resolve(slug, version);
  if (!found) notFound();
  return <PolicyPage slug={found.doc.slug} version={found.shown.id} />;
}
