import type { Locale } from "@rad/types";
import type { HeroCard } from "../type";

/** How long the photograph faces out before the card turns to its record. */
export const HERO_CARD_FRONT_MS = 3400;
/** How long the record stays readable before the next work takes the centre. */
export const HERO_CARD_BACK_MS = 4200;
export const HERO_CARD_SWIPE_PX = 36;

export const heroCardCopy = {
  fa: {
    region: "آثار نمونه. برای عوض‌کردن بکشید یا از کلیدهای جهت استفاده کنید.",
    turnOver: (title: string) => `پشت کارت ${title}`,
    turnBack: "برگشت به عکس",
    bringForward: (title: string) => `نمایش ${title}`,
    stamp: (digits: string) => `مُهر رَد ${digits}، تنها یک نسخه`,
  },
  en: {
    region: "Sample works. Swipe or use the arrow keys to change.",
    turnOver: (title: string) => `Turn over: ${title}`,
    turnBack: "Back to the photograph",
    bringForward: (title: string) => `Show ${title}`,
    stamp: (digits: string) => `RĀD seal ${digits}, one of one`,
  },
} as const;

export function heroCards(locale: Locale): HeroCard[] {
  const isFa = locale === "fa";

  return [
    {
      src: "/home/hero/work-01-wall-textile.png",
      alt: isFa
        ? "بافته دیواری دست‌باف با نقش توپوگرافیک"
        : "Handwoven wall textile with a topographic composition",
      title: isFa ? "بافته توپوگرافیک" : "Topographic textile",
      note: isFa
        ? "ردِ کوه، میان تار و پود، آرام جا مانده است."
        : "A mountain’s trace, left quietly in the weave.",
      noteArt: isFa ? "/home/hero/notes/note-01-wall-textile.png" : undefined,
      tone: "textile",
    },
    {
      src: "/home/hero/work-02-stone-lamp.png",
      alt: isFa
        ? "چراغ سنگی دست‌تراش با پایه چوب گردو"
        : "Hand-carved alabaster lamp with a walnut base",
      title: isFa ? "چراغ سنگ و گردو" : "Alabaster & walnut lamp",
      note: isFa
        ? "نور، آهسته از دلِ سنگ رد می‌شود."
        : "Light passes slowly through the stone.",
      noteArt: isFa ? "/home/hero/notes/note-02-stone-lamp.png" : undefined,
      tone: "stone",
    },
    {
      src: "/home/hero/work-03-brass-incense-holder.png",
      alt: isFa
        ? "عودسوز مجسمه‌گون از برنج سیاه‌کاری‌شده"
        : "Sculptural incense holder in blackened brass",
      title: isFa ? "عودسوز برنجی هلال" : "Crescent brass incense holder",
      note: isFa
        ? "دود، شکلِ ناپیدای این اثر است."
        : "Smoke is this work’s unseen form.",
      noteArt: isFa ? "/home/hero/notes/note-03-brass-incense-holder.png" : undefined,
      tone: "metal",
    },
    {
      src: "/home/hero/work-04-ceramic-mug.jpg",
      alt: isFa
        ? "ماگ سفالی دست‌ساز با قطره‌های لعاب آبی که از لبه‌اش آویزان‌اند"
        : "Handmade ceramic mug with blue glaze drops hanging from its rim",
      title: isFa ? "ماگ قطره‌های آبی" : "Blue drop mug",
      note: isFa
        ? "قطره‌ها، پیش از افتادن در لعاب ماندند."
        : "The drops stayed in the glaze, just before they fell.",
      noteArt: isFa ? "/home/hero/notes/note-04-ceramic-mug.png" : undefined,
      tone: "ceramic",
    },
    {
      src: "/home/hero/work-05-ceramic-teapot.jpg",
      alt: isFa
        ? "قوری سفالی دوطبقه با ضربه‌های قلم‌موی سبز"
        : "Stacked ceramic teapot with green brushstrokes",
      title: isFa ? "قوری دوطبقه" : "Stacked teapot",
      note: isFa
        ? "دو بدنه، روی هم؛ برای یک چایِ آرام."
        : "Two bodies, stacked for one slow pot of tea.",
      noteArt: isFa ? "/home/hero/notes/note-05-ceramic-teapot.png" : undefined,
      tone: "ceramic",
    },
  ];
}
