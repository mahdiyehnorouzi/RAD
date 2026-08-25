import type { Product } from "@rad/types";
export type { Product, ProductImage } from "@rad/types";
export const products: Product[] = [
  {
    slug: "red-vessel-27",
    name: "کوزه‌ی سرخ شماره ۲۷",
    subtitle: "لعاب خاکستر و اکسید آهن",
    price: "۱۲٬۸۰۰٬۰۰۰ تومان",
    usdPrice: 148,
    color: "#9f4030",
    accent: "#ead9bd",
    shape: "tall",
    category: "vases",
    images: [
      {
        alt: "نمای روبه‌روی کوزه سرخ",
        enAlt: "Front view of the red vessel",
        color: "#9f4030",
        accent: "#ead9bd",
        shape: "tall",
      },
      {
        alt: "نمای کناری کوزه سرخ",
        enAlt: "Side view of the red vessel",
        color: "#87382c",
        accent: "#ead9bd",
        shape: "tall",
      },
      {
        alt: "جزئیات لعاب کوزه سرخ",
        enAlt: "Red vessel glaze detail",
        color: "#ad4b38",
        accent: "#f0dfc2",
        shape: "round",
      },
    ],
    story:
      "ردّ حرکت دست روی این کوزه حفظ شده است؛ خطی که از دهانه آغاز می‌شود و در آتش به رنگ خاک گرم درآمده.",
    details: [
      "ارتفاع ۳۸ سانتی‌متر",
      "استون‌ور با پخت ۱۲۳۰ درجه",
      "ساخته‌شده در تهران",
      "تنها یک نسخه",
    ],
    en: {
      name: "Red Vessel No. 27",
      subtitle: "Ash glaze and iron oxide",
      story:
        "The movement of the hand remains visible on this vessel—a line beginning at the rim and turning warm earth-red in the fire.",
      details: [
        "38 cm high",
        "Stoneware fired at 1230°C",
        "Made in Tehran",
        "One of one",
      ],
    },
  },
  {
    slug: "olive-memory",
    vendor: { id: "artist-sahar", displayName: "سحر میرزایی", displayNameEn: "Sahar Mirzaei", kind: "guest_artist", verified: true },
    name: "حافظه‌ی زیتونی",
    subtitle: "لعاب مات و خاک نخودی",
    price: "۹٬۶۰۰٬۰۰۰ تومان",
    usdPrice: 112,
    color: "#4b513c",
    accent: "#dbc7a5",
    shape: "round",
    category: "vases",
    images: [
      {
        alt: "نمای روبه‌روی حافظه زیتونی",
        enAlt: "Front view of Olive Memory",
        color: "#4b513c",
        accent: "#dbc7a5",
        shape: "round",
      },
      {
        alt: "جزئیات لعاب زیتونی",
        enAlt: "Olive glaze detail",
        color: "#5c634a",
        accent: "#e0ceb0",
        shape: "wide",
      },
    ],
    story:
      "فرمی آرام و متراکم برای شاخه‌های کوتاه؛ سطح مات آن نور را نگه می‌دارد و با گذر روز تغییر می‌کند.",
    details: [
      "ارتفاع ۲۶ سانتی‌متر",
      "خاک نخودی ایران",
      "لعاب دست‌ساز مات",
      "تنها یک نسخه",
    ],
    en: {
      name: "Olive Memory",
      subtitle: "Matte glaze and buff clay",
      story:
        "A quiet, compact form for short branches. Its matte surface holds the light and changes throughout the day.",
      details: [
        "26 cm high",
        "Iranian buff clay",
        "Handmade matte glaze",
        "One of one",
      ],
    },
  },
  {
    slug: "lut-line",
    name: "خطِ لوت",
    subtitle: "پرسلان و لعاب شنی",
    price: "۱۵٬۴۰۰٬۰۰۰ تومان",
    usdPrice: 178,
    color: "#e6d8bd",
    accent: "#9e3d2d",
    shape: "wide",
    category: "tableware",
    images: [],
    story:
      "لبه‌ای نامتقارن و خطی سرخ که مسیر باد روی شن را به یاد می‌آورد؛ ظرفی میان شیء روزمره و مجسمه.",
    details: [
      "عرض ۴۵ سانتی‌متر",
      "پرسلان تقویت‌شده",
      "مناسب سرو خشک",
      "تنها یک نسخه",
    ],
    en: {
      name: "Lut Line",
      subtitle: "Porcelain and sand glaze",
      story:
        "An asymmetric rim and red line recall wind moving across sand—a vessel between everyday object and sculpture.",
      details: [
        "45 cm wide",
        "Reinforced porcelain",
        "Suitable for dry serving",
        "One of one",
      ],
    },
  },
  {
    slug: "night-clay",
    status: "sold",
    name: "خاکِ شب",
    subtitle: "لعاب مشکی نیمه‌براق",
    price: "۱۱٬۲۰۰٬۰۰۰ تومان",
    usdPrice: 130,
    color: "#28231f",
    accent: "#c8a77b",
    shape: "tall",
    category: "vases",
    story:
      "سطح تیره و دهانه‌ی روشن این اثر، تضاد کوره در شب و خاک تازه را ثبت می‌کند.",
    details: [
      "ارتفاع ۳۲ سانتی‌متر",
      "لعاب چندلایه",
      "امضاشده زیر اثر",
      "تنها یک نسخه",
    ],
    en: {
      name: "Night Clay",
      subtitle: "Semi-gloss black glaze",
      story:
        "Its dark surface and bright rim record the contrast between a kiln at night and freshly worked clay.",
      details: [
        "32 cm high",
        "Layered glaze",
        "Signed underneath",
        "One of one",
      ],
    },
  },
  {
    slug: "pomegranate-bowl",
    name: "کاسه‌ی انار",
    subtitle: "لعاب قرمز مسی",
    price: "۷٬۹۰۰٬۰۰۰ تومان",
    usdPrice: 92,
    color: "#a23b32",
    accent: "#f0dfc2",
    shape: "round",
    category: "tableware",
    story:
      "کاسه‌ای برای مرکز میز، با فرورفتگی‌های کوچک که نور را مثل دانه‌های انار تقسیم می‌کنند.",
    details: [
      "قطر ۳۰ سانتی‌متر",
      "ایمن برای مواد غذایی",
      "شست‌وشوی دستی",
      "تنها یک نسخه",
    ],
    en: {
      name: "Pomegranate Bowl",
      subtitle: "Copper-red glaze",
      story:
        "A centrepiece bowl with small impressions that divide the light like pomegranate seeds.",
      details: ["30 cm diameter", "Food safe", "Hand wash", "One of one"],
    },
  },
  {
    slug: "white-silence",
    status: "sold",
    name: "سکوتِ سفید",
    subtitle: "پرسلان بدون لعاب",
    price: "۱۳٬۵۰۰٬۰۰۰ تومان",
    usdPrice: 156,
    color: "#f2ece0",
    accent: "#5d5b4c",
    shape: "wide",
    category: "sculpture",
    story:
      "یک فرم کم‌صدا با بافت خام؛ هر تغییر نور، برجستگی تازه‌ای روی سطح آن نشان می‌دهد.",
    details: [
      "عرض ۳۷ سانتی‌متر",
      "پرسلان خام",
      "قطعه‌ی مجسمه‌ای",
      "تنها یک نسخه",
    ],
    en: {
      name: "White Silence",
      subtitle: "Unglazed porcelain",
      story:
        "A quiet form with a raw texture; every change in light reveals a new rise on its surface.",
      details: [
        "37 cm wide",
        "Raw porcelain",
        "Sculptural piece",
        "One of one",
      ],
    },
  },
];
export const getProduct = (slug: string) =>
  products.find((p) => p.slug === slug);
export const productCopy = (product: Product, locale: "fa" | "en") =>
  locale === "en"
    ? product.en
    : {
        name: product.name,
        subtitle: product.subtitle,
        story: product.story,
        details: product.details,
      };
