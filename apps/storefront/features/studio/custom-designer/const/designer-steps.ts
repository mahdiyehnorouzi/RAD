import type { LocaleCopy } from "@/types/locale";

export const DESIGNER_STEPS = [
  "idea",
  "form",
  "details",
  "plan",
  "review",
] as const;

export type DesignerStep = (typeof DESIGNER_STEPS)[number];

export const DESIGNER_STEP_LABEL: Record<DesignerStep, LocaleCopy> = {
  idea: { fa: "ایده", en: "Idea" },
  form: { fa: "فرم", en: "Form" },
  details: { fa: "جزئیات", en: "Details" },
  plan: { fa: "بودجه و زمان", en: "Budget & time" },
  review: { fa: "ارسال", en: "Send" },
};
