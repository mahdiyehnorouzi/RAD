import type { ProductCategory, ProductVisual } from "@rad/types";

export type MockLocale = "fa" | "en";

export interface MockDesignField {
  key: string;
  label: { fa: string; en: string };
  options: { fa: string[]; en: string[] };
}

export interface MockCategory {
  id: ProductCategory;
  label: { fa: string; en: string };
  shortLabel: { fa: string; en: string };
  visual: ProductVisual;
  preview: { color: string; accent: string };
  fields: MockDesignField[];
}

const sizeField: MockDesignField = {
  key: "size",
  label: { fa: "ابعاد", en: "Scale" },
  options: {
    fa: ["کوچک", "متوسط", "بزرگ"],
    en: ["Small", "Medium", "Large"],
  },
};

const budgetField: MockDesignField = {
  key: "budget",
  label: { fa: "بازه بودجه", en: "Budget" },
  options: {
    fa: ["تا ۱۰ میلیون", "۱۰ تا ۲۰ میلیون", "بیش از ۲۰ میلیون"],
    en: ["Up to $120", "$120–$240", "$240+"],
  },
};

export const mockCategories: MockCategory[] = [
  {
    id: "ceramics",
    label: { fa: "سفال و سرامیک", en: "Ceramics" },
    shortLabel: { fa: "سرامیک", en: "Ceramics" },
    visual: "vessel",
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
    label: { fa: "نقاشی", en: "Painting" },
    shortLabel: { fa: "نقاشی", en: "Painting" },
    visual: "painting",
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
    label: { fa: "پارچه و بافت", en: "Textile & fibre" },
    shortLabel: { fa: "پارچه", en: "Textile" },
    visual: "textile",
    preview: { color: "#b86449", accent: "#e9d7b9" },
    fields: [
      {
        key: "item",
        label: { fa: "نوع اثر", en: "Piece" },
        options: { fa: ["دیوارکوب", "روسری", "رومیزی", "پارچه هنری"], en: ["Wall hanging", "Scarf", "Table textile", "Art cloth"] },
      },
      {
        key: "technique",
        label: { fa: "تکنیک", en: "Technique" },
        options: { fa: ["نقاشی روی پارچه", "چاپ دستی", "سوزن‌دوزی", "بافت"], en: ["Fabric painting", "Hand print", "Embroidery", "Weaving"] },
      },
      sizeField,
      budgetField,
    ],
  },
  {
    id: "woodwork",
    label: { fa: "آثار چوبی", en: "Woodwork" },
    shortLabel: { fa: "چوب", en: "Wood" },
    visual: "wood",
    preview: { color: "#76523b", accent: "#d3ad7f" },
    fields: [
      {
        key: "item",
        label: { fa: "نوع اثر", en: "Object" },
        options: { fa: ["ظرف چوبی", "مجسمه", "دیوارکوب", "جعبه"], en: ["Wooden vessel", "Sculpture", "Wall piece", "Box"] },
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
    label: { fa: "مجسمه و آبجکت", en: "Sculpture & objects" },
    shortLabel: { fa: "مجسمه", en: "Sculpture" },
    visual: "sculpture",
    preview: { color: "#4a5039", accent: "#d8c4a0" },
    fields: [
      {
        key: "material",
        label: { fa: "متریال", en: "Material" },
        options: { fa: ["فلز", "سنگ", "گچ", "ترکیب مواد"], en: ["Metal", "Stone", "Plaster", "Mixed media"] },
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
    label: { fa: "زیورآلات هنری", en: "Art jewellery" },
    shortLabel: { fa: "زیورآلات", en: "Jewellery" },
    visual: "jewelry",
    preview: { color: "#b78945", accent: "#22483d" },
    fields: [
      {
        key: "item",
        label: { fa: "نوع زیور", en: "Piece" },
        options: { fa: ["گردنبند", "انگشتر", "گوشواره", "دستبند"], en: ["Necklace", "Ring", "Earrings", "Bracelet"] },
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
    label: { fa: "چاپ دستی و تصویر", en: "Print & illustration" },
    shortLabel: { fa: "چاپ دستی", en: "Print" },
    visual: "print",
    preview: { color: "#243e35", accent: "#b34b37" },
    fields: [
      {
        key: "technique",
        label: { fa: "تکنیک", en: "Technique" },
        options: { fa: ["لینوکات", "چاپ چوب", "سیلک", "تصویرسازی"], en: ["Linocut", "Woodcut", "Screen print", "Illustration"] },
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

export const mockStorefront = {
  brand: {
    subtitle: { fa: "گالری آثار یکتا", en: "UNIQUE WORKS" },
    title: { fa: "رَد — آثار یکتای هنری", en: "RAD — Unique Artworks" },
    description: {
      fa: "آثار یکتای هنری و سفارش‌های شخصی از هنرمندان مستقل",
      en: "One-of-one artworks and personal commissions by independent makers",
    },
  },
  categories: mockCategories,
  featuredProductSlugs: [
    "red-vessel-27",
    "blue-window",
    "woven-garden",
    "walnut-tide",
    "silver-orbit",
    "red-garden-print",
  ],
  design: {
    directions: {
      fa: ["آرام و متعادل", "خام و نامتقارن", "جسور و پیکره‌وار"],
      en: ["Quiet balance", "Raw asymmetry", "Bold statement"],
    },
    presets: {
      fa: ["رنگ‌های خاکی", "خطوط آزاد", "بافت طبیعی", "هندسه ساده"],
      en: ["Earth tones", "Free lines", "Natural texture", "Simple geometry"],
    },
  },
} as const;

export function getMockCategory(id: ProductCategory) {
  return mockCategories.find((category) => category.id === id) ?? mockCategories[0];
}

export function mockCategoryLabel(id: ProductCategory, locale: MockLocale) {
  return getMockCategory(id).label[locale];
}
