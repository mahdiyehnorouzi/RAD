import type { LocalizedText } from "@rad/types";

/** Short shop-floor names; full category names stay on cards, PDPs and empty states. */
export const categoryChipLabels: Record<string, LocalizedText> = {
  ceramics: { fa: "سفال و سرامیک", en: "Ceramics" },
  painting: { fa: "نقاشی", en: "Painting" },
  textile: { fa: "پارچه و بافت", en: "Textile" },
  woodwork: { fa: "چوب", en: "Wood" },
  sculpture: { fa: "مجسمه و آبجکت", en: "Sculpture" },
  jewelry: { fa: "زیورآلات", en: "Jewellery" },
  print: { fa: "چاپ", en: "Print" },
};
