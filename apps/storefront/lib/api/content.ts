import { api } from "./client";
import type { FaqContent, Locale } from "@rad/types";

export async function fetchFaq(locale: Locale = "fa"): Promise<FaqContent> {
  return api<FaqContent>(`/content/faq?locale=${locale}`, { cache: "no-store" });
}
