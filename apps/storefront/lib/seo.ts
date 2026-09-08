import type { Metadata } from "next";

const FALLBACK_SITE_URL = "https://rad-studio.rad-studio.workers.dev";

export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || FALLBACK_SITE_URL,
);

export const siteName = "رَد — آثار یکتای هنری";
export const defaultDescription =
  "خرید آثار هنری یکتا و ثبت سفارش شخصی از هنرمندان مستقل؛ سفال و سرامیک، نقاشی، مجسمه، بافت و زیورآلات هنری.";

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName,
      title,
      description,
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export const privatePageMetadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
};

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
