import { Injectable } from "@nestjs/common";
import { faqSection, type FaqIcon } from "./faq.data";

export type LocalizedFaq = {
  eyebrow: string;
  title: string;
  items: Array<{
    id: string;
    icon: FaqIcon;
    question: string;
    answer: string;
  }>;
};

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
