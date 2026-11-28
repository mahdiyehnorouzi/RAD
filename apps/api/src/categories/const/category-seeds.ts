import type { LocalizedText } from "@rad/types";

/**
 * Parent rows seeded for the store slugs that already exist in code.
 * Labels match the storefront's `artworkCategories` / `extraLabels`.
 * Child categories are never seeded.
 */
export const KNOWN_CATEGORY_SEEDS: {
  slug: string;
  name: LocalizedText;
  sortOrder: number;
}[] = [
  {
    slug: "ceramics",
    name: { fa: "سفال و سرامیک", en: "Ceramics" },
    sortOrder: 0,
  },
  {
    slug: "painting",
    name: { fa: "نقاشی", en: "Painting" },
    sortOrder: 1,
  },
  {
    slug: "textile",
    name: { fa: "پارچه و بافت", en: "Textile & fibre" },
    sortOrder: 2,
  },
  {
    slug: "woodwork",
    name: { fa: "آثار چوبی", en: "Woodwork" },
    sortOrder: 3,
  },
  {
    slug: "sculpture",
    name: { fa: "مجسمه و آبجکت", en: "Sculpture & objects" },
    sortOrder: 4,
  },
  {
    slug: "jewelry",
    name: { fa: "زیورآلات هنری", en: "Art jewellery" },
    sortOrder: 5,
  },
  {
    slug: "print",
    name: { fa: "چاپ دستی و تصویر", en: "Print & illustration" },
    sortOrder: 6,
  },
  { slug: "vases", name: { fa: "گلدان", en: "Vases" }, sortOrder: 7 },
  {
    slug: "tableware",
    name: { fa: "ظروف", en: "Tableware" },
    sortOrder: 8,
  },
];
