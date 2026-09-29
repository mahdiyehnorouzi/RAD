import type { LocaleCopy } from "@/types/locale";

export type OrderMake = {
  id: string;
  title: LocaleCopy;
  examples: LocaleCopy;
  /** Transparent cutout of a real RAD work. */
  image: string;
  /** Category preselected in the order flow when this card is chosen. */
  form: string;
  /** Optional use/style preselected alongside the category. */
  use?: string;
};

/** Reading order: two wide cards, then three narrow ones. */
export const ORDER_MAKES: OrderMake[] = [
  {
    id: "container",
    title: { fa: "ظرف و کاربردی", en: "Tableware" },
    examples: { fa: "ماگ، بشقاب، کاسه و …", en: "Mugs, plates, bowls and more" },
    image: "/catalog/photos/transparent/cobalt-ripple-tray.webp",
    form: "container",
  },
  {
    id: "object",
    title: { fa: "شیء", en: "Objects" },
    examples: { fa: "فرم‌های انتزاعی و رومیزی", en: "Abstract and desk forms" },
    image: "/catalog/photos/transparent/dachshund-sculpture.webp",
    form: "open",
    use: "decor",
  },
  {
    id: "accessory",
    title: { fa: "اکسسوری", en: "Accessories" },
    examples: { fa: "انگشتر، آویز و …", en: "Rings, pendants and more" },
    image: "/catalog/photos/transparent/silver-orbit.webp",
    form: "accessory",
  },
  {
    id: "sculpture",
    title: { fa: "مجسمه", en: "Sculpture" },
    examples: { fa: "فیگور، حیوان و صحنه‌های کوچک", en: "Figures, animals, small scenes" },
    image: "/catalog/photos/transparent/orange-boat-sculpture.webp",
    form: "sculpture",
  },
  {
    id: "light",
    title: { fa: "نور", en: "Lighting" },
    examples: { fa: "آباژور و فرم‌های نوری", en: "Lampshades and light forms" },
    image: "/catalog/graphic/orbit-sculpture-lamp.webp",
    form: "light",
  },
];
