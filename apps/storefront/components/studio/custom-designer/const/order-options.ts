import type { ProductCategory } from "@rad/types";
import type { LocaleCopy } from "@/types/locale";

type Option = { id: string; label: LocaleCopy };

export const UNSURE_FORM = "unsure";

export const FORM_OPTIONS: Array<Option & { category: ProductCategory }> = [
  { id: "container", label: { fa: "ظرف", en: "Vessel" }, category: "tableware" },
  { id: "mug", label: { fa: "ماگ", en: "Mug" }, category: "tableware" },
  { id: "object", label: { fa: "شیء", en: "Object" }, category: "ceramics" },
  { id: "sculpture", label: { fa: "مجسمه", en: "Sculpture" }, category: "sculpture" },
  { id: "lamp", label: { fa: "چراغ", en: "Lamp" }, category: "ceramics" },
  {
    id: "accessory",
    label: { fa: "زیورآلات / اکسسوری", en: "Jewellery / accessory" },
    category: "jewelry",
  },
  {
    id: UNSURE_FORM,
    label: {
      fa: "نمی‌دانم؛ ایده‌ی خودم را دارم",
      en: "I don’t know — I just have my own idea",
    },
    category: "ceramics",
  },
];

export const SIZE_OPTIONS: Array<Option & { hint: LocaleCopy }> = [
  { id: "palm", label: { fa: "کف دست", en: "Palm-sized" }, hint: { fa: "حدود ۱۰ سانتی‌متر", en: "about 10 cm" } },
  { id: "small", label: { fa: "کوچک", en: "Small" }, hint: { fa: "حدود ۲۰ سانتی‌متر", en: "about 20 cm" } },
  { id: "medium", label: { fa: "متوسط", en: "Medium" }, hint: { fa: "حدود ۳۵ سانتی‌متر", en: "about 35 cm" } },
  { id: "large", label: { fa: "بزرگ", en: "Large" }, hint: { fa: "حدود ۵۰ سانتی‌متر", en: "about 50 cm" } },
  { id: "xlarge", label: { fa: "خیلی بزرگ", en: "Very large" }, hint: { fa: "بیش از ۶۰ سانتی‌متر", en: "over 60 cm" } },
];

export const DEFAULT_SIZE_INDEX = 1;

export const BUDGET_OPTIONS: Option[] = [
  { id: "under-3", label: { fa: "تا ۳ میلیون تومان", en: "Up to $35" } },
  { id: "3-5", label: { fa: "۳ تا ۵ میلیون", en: "$35–60" } },
  { id: "5-8", label: { fa: "۵ تا ۸ میلیون", en: "$60–100" } },
  { id: "8-12", label: { fa: "۸ تا ۱۲ میلیون", en: "$100–150" } },
  { id: "more", label: { fa: "بیشتر", en: "More" } },
  { id: "unsure", label: { fa: "نمی‌دانم", en: "I don’t know" } },
];

export const DATED_TIMELINE = "date";

export const TIMELINE_OPTIONS: Option[] = [
  { id: "relaxed", label: { fa: "عجله‌ای ندارم", en: "I’m not in a hurry" } },
  { id: "weeks", label: { fa: "حدود ۲ تا ۳ هفته", en: "In about 2–3 weeks" } },
  { id: "month", label: { fa: "حدود یک ماه", en: "In about a month" } },
  { id: DATED_TIMELINE, label: { fa: "تاریخ مشخصی دارم", en: "I have a specific date" } },
];

/** Matches `freedomToPermission` bands so the words agree with what the maker receives. */
export function fidelityKey(freedom: number) {
  if (freedom <= 33) return "fidelityFaithful" as const;
  if (freedom <= 66) return "fidelityHand" as const;
  return "fidelityFree" as const;
}

export function optionLabel(options: Option[], id: string, locale: "fa" | "en") {
  return options.find((option) => option.id === id)?.label[locale] ?? "";
}
