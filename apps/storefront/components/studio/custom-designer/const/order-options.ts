import type { ProductCategory } from "@rad/types";
import type { LocaleCopy } from "@/types/locale";

type Option = { id: string; label: LocaleCopy };

export type FormOption = Option & { category: ProductCategory; image: string };

/** Reading order: two wide cards, then three narrow ones. */
export const FORM_OPTIONS: FormOption[] = [
  {
    id: "container",
    label: { fa: "ظرف و کاربردی", en: "Tableware" },
    category: "tableware",
    image: "/catalog/photos/transparent/speckled-sculpted-mug.webp",
  },
  {
    id: "sculpture",
    label: { fa: "مجسمه", en: "Sculpture" },
    category: "sculpture",
    image: "/catalog/photos/transparent/orange-boat-sculpture.webp",
  },
  {
    id: "open",
    label: { fa: "ایده‌ی آزاد", en: "Open idea" },
    category: "ceramics",
    image: "/catalog/photos/transparent/olive-loop-vessel.webp",
  },
  {
    id: "accessory",
    label: { fa: "اکسسوری", en: "Accessory" },
    category: "jewelry",
    image: "/catalog/photos/transparent/silver-orbit.webp",
  },
  {
    id: "light",
    label: { fa: "نور", en: "Lighting" },
    category: "ceramics",
    image: "/catalog/graphic/orbit-sculpture-lamp.webp",
  },
];

/** Ids from the earlier multi-select studio, so saved drafts still land somewhere. */
export const LEGACY_FORM_IDS: Record<string, string> = {
  mug: "container",
  object: "open",
  lamp: "light",
  unsure: "open",
};

export const USE_OPTIONS: Option[] = [
  { id: "tabletop", label: { fa: "رومیزی", en: "Tabletop" } },
  { id: "everyday", label: { fa: "کاربردی", en: "Everyday use" } },
  { id: "decor", label: { fa: "تزئینی", en: "Decorative" } },
  { id: "gift", label: { fa: "هدیه", en: "Gift" } },
];

/** Smallest first, so the size track grows along the reading direction. */
export const SIZE_OPTIONS: Array<Option & { hint: LocaleCopy; scale: number }> = [
  {
    id: "small",
    label: { fa: "کوچک", en: "Small" },
    hint: { fa: "۱۰ تا ۱۵ سانتی‌متر", en: "10–15 cm" },
    scale: 0.62,
  },
  {
    id: "medium",
    label: { fa: "متوسط", en: "Medium" },
    hint: { fa: "۱۵ تا ۲۵ سانتی‌متر", en: "15–25 cm" },
    scale: 0.8,
  },
  {
    id: "large",
    label: { fa: "بزرگ", en: "Large" },
    hint: { fa: "بیش از ۲۵ سانتی‌متر", en: "over 25 cm" },
    scale: 1,
  },
];

export const DEFAULT_SIZE = "medium";

export const BUDGET_OPTIONS: Option[] = [
  { id: "under-3", label: { fa: "تا ۳ میلیون تومان", en: "Up to $35" } },
  { id: "3-5", label: { fa: "۳ تا ۵ میلیون تومان", en: "$35–60" } },
  { id: "5-8", label: { fa: "۵ تا ۸ میلیون تومان", en: "$60–100" } },
  { id: "8-12", label: { fa: "۸ تا ۱۲ میلیون تومان", en: "$100–150" } },
  { id: "more", label: { fa: "بیشتر از ۱۲ میلیون تومان", en: "More than $150" } },
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
