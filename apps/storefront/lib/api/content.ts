import { api } from "./client";
import type { FaqContent, Locale } from "@rad/types";
import { faqFallbackEn, faqFallbackFa } from "@/lib/content/faq-fallback";

export async function fetchFaq(locale: Locale = "fa"): Promise<FaqContent> {
  try {
    return await api<FaqContent>(`/content/faq?locale=${locale}`, {
      cache: "force-cache",
    });
  } catch {
    return locale === "en" ? faqFallbackEn : faqFallbackFa;
  }
}
