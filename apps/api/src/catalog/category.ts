/**
 * Admin-facing Persian category labels and their mapping to the English
 * `Product.category` values actually persisted in the database (and used by
 * `packages/types`' `ProductCategory`). Moved out of `admin.mapper.ts` so
 * `product-attributes` (category assignment) can share it without an
 * awkward cross-module import.
 */
export const ADMIN_CATEGORIES = [
  "گلدان",
  "ظروف",
  "مجسمه",
  "سفال و سرامیک",
  "نقاشی",
  "پارچه و بافت",
  "آثار چوبی",
  "زیورآلات هنری",
  "چاپ دستی و تصویر",
];

const categoryToStore: Record<string, string> = {
  گلدان: "ceramics",
  ظروف: "ceramics",
  مجسمه: "sculpture",
  "سفال و سرامیک": "ceramics",
  نقاشی: "painting",
  "پارچه و بافت": "textile",
  "آثار چوبی": "woodwork",
  "زیورآلات هنری": "jewelry",
  "چاپ دستی و تصویر": "print",
};

const storeToCategory: Record<string, string> = {
  vases: "گلدان",
  tableware: "ظروف",
  ceramics: "سفال و سرامیک",
  sculpture: "مجسمه",
  painting: "نقاشی",
  textile: "پارچه و بافت",
  woodwork: "آثار چوبی",
  jewelry: "زیورآلات هنری",
  print: "چاپ دستی و تصویر",
};

export function toStoreCategory(label: string) {
  return categoryToStore[label] ?? "ceramics";
}

export function toAdminCategory(value: string) {
  return storeToCategory[value] ?? "سفال و سرامیک";
}

/**
 * The canonical English `Product.category` values (mirrors `ProductCategory`
 * in `@rad/types`). Unlike `ADMIN_CATEGORIES`, this set has no duplicate
 * labels collapsing into the same value, so attribute-category assignment
 * (`product-attributes`) is keyed on these directly instead of on
 * `ADMIN_CATEGORIES`'s lossy Persian labels — `toStoreCategory` is a
 * many-to-one map (e.g. "گلدان" and "ظروف" both resolve to "ceramics"), so
 * storing an attribute's category as the admin's chosen *label* and later
 * reading it back via `toAdminCategory` does not round-trip to that same
 * label. Storing the already-resolved store value sidesteps that entirely.
 */
export const STORE_CATEGORIES = [
  "ceramics",
  "painting",
  "textile",
  "woodwork",
  "sculpture",
  "jewelry",
  "print",
  "vases",
  "tableware",
] as const;
