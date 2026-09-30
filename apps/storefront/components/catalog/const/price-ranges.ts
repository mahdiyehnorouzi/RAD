import type { LocalizedText } from "@rad/types";

type PriceRange = {
  id: string;
  /** Whole toman, inclusive; `null` leaves that side open. */
  min: number | null;
  max: number | null;
  label: LocalizedText;
};

export const priceRanges: PriceRange[] = [
  {
    id: "under-3m",
    min: null,
    max: 3_000_000,
    label: { fa: "تا ۳ میلیون تومان", en: "Up to 3M toman" },
  },
  {
    id: "3m-5m",
    min: 3_000_000,
    max: 5_000_000,
    label: { fa: "۳ تا ۵ میلیون تومان", en: "3M–5M toman" },
  },
  {
    id: "over-5m",
    min: 5_000_000,
    max: null,
    label: { fa: "۵ میلیون تومان به بالا", en: "5M toman and up" },
  },
];
