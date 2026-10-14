import type { LocaleCopy } from "@/types/locale";

export type OrderCategory = {
  id: "light" | "vessel" | "mug" | "sculpture";
  title: LocaleCopy;
  examples: LocaleCopy;
  image: { src: string; width: number; height: number };
  /** Category preselected in the order flow when this card is chosen. */
  form: string;
};

/** "What we make" — the four categories shown on the Studio landing page. */
export const ORDER_CATEGORIES: OrderCategory[] = [
  {
    id: "light",
    title: { fa: "چراغ و روشنایی", en: "Light" },
    examples: {
      fa: "چراغ رومیزی، چراغ‌خواب و هرچی که نور داره",
      en: "Lamps and lanterns",
    },
    image: {
      src: "/studio/category-lighting-lantern.webp",
      width: 1448,
      height: 1086,
    },
    form: "light",
  },
  {
    id: "vessel",
    title: { fa: "ظرف و ظروف", en: "Vessels" },
    examples: {
      fa: "کاسه، بشقاب، سینی و چیزای دیگه",
      en: "Bowls, trays and dishes",
    },
    image: {
      src: "/studio/sample-blue-bowl.webp",
      width: 1448,
      height: 1086,
    },
    form: "container",
  },
  {
    id: "mug",
    title: { fa: "ماگ و لیوان", en: "Mugs" },
    examples: {
      fa: "برای چای، قهوه یا هرچی دوست داری",
      en: "Hand-painted mugs and cups",
    },
    image: {
      src: "/studio/sample-floral-mug.webp",
      width: 1448,
      height: 1086,
    },
    form: "container",
  },
  {
    id: "sculpture",
    title: { fa: "مجسمه و فیگور", en: "Figures" },
    examples: { fa: "حیوان، فیگور و صحنه‌های کوچک", en: "Animals and small figures" },
    image: {
      src: "/studio/sample-dog-sculpture.webp",
      width: 1448,
      height: 1086,
    },
    form: "sculpture",
  },
];
