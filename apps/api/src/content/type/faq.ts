export type FaqIcon = "shield-check" | "package-check" | "truck" | "palette";

export type FaqEntry = {
  id: string;
  icon: FaqIcon;
  question: { fa: string; en: string };
  answer: { fa: string; en: string };
};

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
