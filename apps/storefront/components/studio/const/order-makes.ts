import type { LocaleCopy } from "@/types/locale";

export type OrderMake = {
  id: string;
  title: LocaleCopy;
  examples: LocaleCopy;
  /** Transparent cutout; the open-idea tile has none and draws its own sketch. */
  image?: string;
};

export const ORDER_MAKES: OrderMake[] = [
  {
    id: "container",
    title: { fa: "ظرف و کاربردی", en: "Vessels and tableware" },
    examples: {
      fa: "ماگ، بشقاب، سینی، فنجان اسپرسو",
      en: "Mugs, plates, trays, espresso cups",
    },
    image: "/catalog/photos/transparent/cobalt-ripple-tray.png",
  },
  {
    id: "object",
    title: { fa: "شیء", en: "Objects" },
    examples: {
      fa: "شیء تزئینی، فرم انتزاعی، شیء رومیزی",
      en: "Decorative pieces, abstract forms, desk objects",
    },
    image: "/catalog/photos/transparent/dachshund-sculpture.png",
  },
  {
    id: "sculpture",
    title: { fa: "مجسمه", en: "Sculpture" },
    examples: {
      fa: "فیگور، حیوان، صحنه‌ی کوچک",
      en: "Figures, animals, small scenes",
    },
    image: "/catalog/photos/transparent/orange-boat-sculpture.png",
  },
  {
    id: "light",
    title: { fa: "نور", en: "Lighting" },
    examples: {
      fa: "آباژور، چراغ، فرم‌های نوری سرامیکی",
      en: "Lampshades, lamps, ceramic light forms",
    },
    image: "/catalog/graphic/orbit-sculpture-lamp.png",
  },
  {
    id: "accessory",
    title: { fa: "اکسسوری", en: "Accessories" },
    examples: {
      fa: "انگشتر، آویز، زیورآلات کوچک",
      en: "Rings, pendants, small jewellery",
    },
    image: "/catalog/photos/transparent/silver-orbit.png",
  },
  {
    id: "open",
    title: { fa: "ایده‌ی آزاد", en: "Something else" },
    examples: {
      fa: "اگر ایده‌ات دقیقاً در این دسته‌ها جا نمی‌شود، باز هم بفرستش.",
      en: "If your idea doesn’t fit these, send it anyway.",
    },
  },
];
