import { Injectable } from "@nestjs/common";
import { faqSection } from "./faq.data";
import type { LocalizedFaq } from "./type";

@Injectable()
export class ContentService {
  faq(locale: "fa" | "en" = "fa"): LocalizedFaq {
    const lang = locale === "en" ? "en" : "fa";
    return {
      eyebrow: faqSection.eyebrow[lang],
      title: faqSection.title[lang],
      items: faqSection.items.map((item) => ({
        id: item.id,
        icon: item.icon,
        question: item.question[lang],
        answer: item.answer[lang],
      })),
    };
  }
}
