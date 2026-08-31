import type { Locale, Product, ProductCategory, ProductVisual } from "@rad/types";
import { visualForCategory } from "@rad/types";

export type ArtworkCategory = {
  id: ProductCategory;
  visual: ProductVisual;
  label: { fa: string; en: string };
  shortLabel: { fa: string; en: string };
  preview: { color: string; accent: string };
  fields: Array<{
    key: string;
    label: { fa: string; en: string };
    options: { fa: string[]; en: string[] };
  }>;
};

const sizeField = {
  key: "size",
  label: { fa: "ابعاد", en: "Scale" },
  options: { fa: ["کوچک", "متوسط", "بزرگ"], en: ["Small", "Medium", "Large"] },
};
const budgetField = {
  key: "budget",
  label: { fa: "بازه بودجه", en: "Budget" },
  options: {
    fa: ["تا ۱۰ میلیون", "۱۰ تا ۲۰ میلیون", "بیش از ۲۰ میلیون"],
    en: ["Up to $120", "$120–$240", "$240+"],
  },
};

export const artworkCategories: ArtworkCategory[] = [
  {
    id: "ceramics",
    visual: "vessel",
    label: { fa: "سفال و سرامیک", en: "Ceramics" },
    shortLabel: { fa: "سرامیک", en: "Ceramics" },
    preview: { color: "#9f4030", accent: "#ead9bd" },
    fields: [
      {
        key: "item",
        label: { fa: "نوع اثر", en: "Object" },
        options: { fa: ["گلدان", "ظرف", "آبجکت"], en: ["Vase", "Tableware", "Object"] },
      },
      {
        key: "surface",
        label: { fa: "سطح", en: "Surface" },
        options: { fa: ["خام", "مات", "براق"], en: ["Raw", "Matte", "Glossy"] },
      },
      sizeField,
      budgetField,
    ],
  },
  {
    id: "painting",
    visual: "painting",
    label: { fa: "نقاشی", en: "Painting" },
    shortLabel: { fa: "نقاشی", en: "Painting" },
    preview: { color: "#31534a", accent: "#d87855" },
    fields: [
      {
        key: "medium",
        label: { fa: "تکنیک", en: "Medium" },
        options: { fa: ["رنگ‌روغن", "اکریلیک", "آبرنگ"], en: ["Oil", "Acrylic", "Watercolour"] },
      },
      {
        key: "format",
        label: { fa: "قاب", en: "Format" },
        options: { fa: ["عمودی", "افقی", "مربع"], en: ["Portrait", "Landscape", "Square"] },
      },
      sizeField,
      budgetField,
    ],
  },
  {
    id: "textile",
    visual: "textile",
    label: { fa: "پارچه و بافت", en: "Textile & fibre" },
    shortLabel: { fa: "پارچه", en: "Textile" },
    preview: { color: "#b86449", accent: "#e9d7b9" },
    fields: [
      {
        key: "item",
        label: { fa: "نوع اثر", en: "Piece" },
        options: {
          fa: ["دیوارکوب", "روسری", "رومیزی", "پارچه هنری"],
          en: ["Wall hanging", "Scarf", "Table textile", "Art cloth"],
        },
      },
      {
        key: "technique",
        label: { fa: "تکنیک", en: "Technique" },
        options: {
          fa: ["نقاشی روی پارچه", "چاپ دستی", "سوزن‌دوزی", "بافت"],
          en: ["Fabric painting", "Hand print", "Embroidery", "Weaving"],
        },
      },
      sizeField,
      budgetField,
    ],
  },
  {
    id: "woodwork",
    visual: "wood",
    label: { fa: "آثار چوبی", en: "Woodwork" },
    shortLabel: { fa: "چوب", en: "Wood" },
    preview: { color: "#76523b", accent: "#d3ad7f" },
    fields: [
      {
        key: "item",
        label: { fa: "نوع اثر", en: "Object" },
        options: {
          fa: ["ظرف چوبی", "مجسمه", "دیوارکوب", "جعبه"],
          en: ["Wooden vessel", "Sculpture", "Wall piece", "Box"],
        },
      },
      {
        key: "wood",
        label: { fa: "نوع چوب", en: "Wood" },
        options: { fa: ["گردو", "راش", "زیتون", "ترکیبی"], en: ["Walnut", "Beech", "Olive", "Mixed"] },
      },
      sizeField,
      budgetField,
    ],
  },
  {
    id: "sculpture",
    visual: "sculpture",
    label: { fa: "مجسمه و آبجکت", en: "Sculpture & objects" },
    shortLabel: { fa: "مجسمه", en: "Sculpture" },
    preview: { color: "#4a5039", accent: "#d8c4a0" },
    fields: [
      {
        key: "material",
        label: { fa: "متریال", en: "Material" },
        options: {
          fa: ["فلز", "سنگ", "گچ", "ترکیب مواد"],
          en: ["Metal", "Stone", "Plaster", "Mixed media"],
        },
      },
      {
        key: "placement",
        label: { fa: "محل استفاده", en: "Placement" },
        options: { fa: ["رومیزی", "دیواری", "فضای باز"], en: ["Tabletop", "Wall", "Outdoor"] },
      },
      sizeField,
      budgetField,
    ],
  },
  {
    id: "jewelry",
    visual: "jewelry",
    label: { fa: "زیورآلات هنری", en: "Art jewellery" },
    shortLabel: { fa: "زیورآلات", en: "Jewellery" },
    preview: { color: "#b78945", accent: "#22483d" },
    fields: [
      {
        key: "item",
        label: { fa: "نوع زیور", en: "Piece" },
        options: {
          fa: ["گردنبند", "انگشتر", "گوشواره", "دستبند"],
          en: ["Necklace", "Ring", "Earrings", "Bracelet"],
        },
      },
      {
        key: "material",
        label: { fa: "متریال", en: "Material" },
        options: { fa: ["نقره", "برنج", "مس", "ترکیبی"], en: ["Silver", "Brass", "Copper", "Mixed"] },
      },
      {
        key: "style",
        label: { fa: "حس کلی", en: "Mood" },
        options: { fa: ["مینیمال", "پیکره‌وار", "هندسی"], en: ["Minimal", "Sculptural", "Geometric"] },
      },
      budgetField,
    ],
  },
  {
    id: "print",
    visual: "print",
    label: { fa: "چاپ دستی و تصویر", en: "Print & illustration" },
    shortLabel: { fa: "چاپ دستی", en: "Print" },
    preview: { color: "#243e35", accent: "#b34b37" },
    fields: [
      {
        key: "technique",
        label: { fa: "تکنیک", en: "Technique" },
        options: {
          fa: ["لینوکات", "چاپ چوب", "سیلک", "تصویرسازی"],
          en: ["Linocut", "Woodcut", "Screen print", "Illustration"],
        },
      },
      {
        key: "edition",
        label: { fa: "نسخه", en: "Edition" },
        options: { fa: ["تک‌نسخه", "نسخه محدود"], en: ["Unique", "Limited edition"] },
      },
      sizeField,
      budgetField,
    ],
  },
];

export const featuredProductSlugs = [
  "red-vessel-27",
  "blue-window",
  "woven-garden",
  "walnut-tide",
  "silver-orbit",
  "red-garden-print",
];

export const designDirections = {
  fa: ["آرام و متعادل", "خام و نامتقارن", "جسور و پیکره‌وار"],
  en: ["Quiet balance", "Raw asymmetry", "Bold statement"],
};

export const designPresets = {
  fa: ["رنگ‌های خاکی", "خطوط آزاد", "بافت طبیعی", "هندسه ساده"],
  en: ["Earth tones", "Free lines", "Natural texture", "Simple geometry"],
};

const extraLabels: Record<string, { fa: string; en: string }> = {
  vases: { fa: "گلدان", en: "Vases" },
  tableware: { fa: "ظروف", en: "Tableware" },
};

export function categoryLabel(category: string, locale: Locale) {
  const match = artworkCategories.find((item) => item.id === category);
  if (match) return match.label[locale];
  return extraLabels[category]?.[locale] ?? category;
}

export function artworkVisual(product: Pick<Product, "category" | "visual">): ProductVisual {
  return product.visual ?? visualForCategory(product.category);
}

export function artworkCategoryById(id: string) {
  return artworkCategories.find((item) => item.id === id) ?? artworkCategories[0];
}
