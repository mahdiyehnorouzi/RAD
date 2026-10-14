import type { LocaleCopy } from "@/types/locale";

type OrderSample = {
  id: string;
  alt: LocaleCopy;
  image: { src: string; width: number; height: number };
};

/** Previous custom orders shown in the Studio landing page carousel. */
export const ORDER_SAMPLES: OrderSample[] = [
  {
    id: "cat",
    alt: {
      fa: "مجسمه‌ی سفالی گربه‌ی سه‌رنگ، سفارش اختصاصی رَد",
      en: "A ceramic calico cat figure, a RAD custom order",
    },
    image: {
      src: "/studio/sample-cat-sculpture.webp",
      width: 1448,
      height: 1086,
    },
  },
  {
    id: "mug",
    alt: {
      fa: "ماگ سفالی با نقاشی گل، سفارش اختصاصی رَد",
      en: "A ceramic mug hand-painted with flowers, a RAD custom order",
    },
    image: {
      src: "/studio/sample-floral-mug.webp",
      width: 1448,
      height: 1086,
    },
  },
  {
    id: "vase",
    alt: {
      fa: "گلدان سفالی با شاخه‌های بابونه، سفارش اختصاصی رَد",
      en: "A ceramic vase with daisy branches, a RAD custom order",
    },
    image: {
      src: "/studio/category-vase-daisies.webp",
      width: 1448,
      height: 1086,
    },
  },
  {
    id: "bowl",
    alt: {
      fa: "کاسه‌ی سفالی آبی با لبه‌ی موجی، سفارش اختصاصی رَد",
      en: "A blue ceramic bowl with a scalloped rim, a RAD custom order",
    },
    image: {
      src: "/studio/sample-blue-bowl.webp",
      width: 1448,
      height: 1086,
    },
  },
  {
    id: "dog",
    alt: {
      fa: "مجسمه‌ی سفالی سگ باسِت، سفارش اختصاصی رَد",
      en: "A ceramic basset hound figure, a RAD custom order",
    },
    image: {
      src: "/studio/sample-dog-sculpture.webp",
      width: 1448,
      height: 1086,
    },
  },
];
