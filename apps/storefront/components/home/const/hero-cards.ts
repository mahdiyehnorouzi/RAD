import type { Locale } from "@rad/types";
import type { HeroCard } from "../type";

/** How long the photograph faces out before the card turns to its record. */
export const HERO_CARD_FRONT_MS = 3400;
/** How long the record stays readable before the next work takes the centre. */
export const HERO_CARD_BACK_MS = 4200;
export const HERO_CARD_SWIPE_PX = 36;

export const heroScene = {
  wide: { src: "/home/hero/scene-wide.jpg", width: 1280, height: 720 },
  tall: { src: "/home/hero/scene-tall.jpg", width: 720, height: 1280 },
} as const;

export const heroCardCopy = {
  fa: {
    region: "آثار نمونه. برای عوض‌کردن بکشید یا از کلیدهای جهت استفاده کنید.",
    turnOver: (title: string) => `پشت کارت ${title}`,
    turnBack: "برگشت به عکس",
    bringForward: (title: string) => `نمایش ${title}`,
    begin: "ساختن رَدِ خودت",
    pause: "توقف چرخش کارت‌ها",
    play: "ادامه چرخش کارت‌ها",
  },
  en: {
    region: "Sample works. Swipe or use the arrow keys to change.",
    turnOver: (title: string) => `Turn over: ${title}`,
    turnBack: "Back to the photograph",
    bringForward: (title: string) => `Show ${title}`,
    begin: "Begin your own RAD",
    pause: "Pause the cards",
    play: "Play the cards",
  },
} as const;

export function heroCards(locale: Locale): HeroCard[] {
  const isFa = locale === "fa";

  return [
    {
      href: "/studio",
      src: "/home/polaroid/topographic-wall-textile.png",
      alt: isFa
        ? "بافته دیواری دست‌باف با نقش توپوگرافیک"
        : "Handwoven wall textile with a topographic composition",
      title: isFa ? "بافته توپوگرافیک" : "Topographic textile",
      material: isFa ? "پشم دست‌باف" : "Handwoven wool",
      conceptLabel: isFa ? "ایده ۰۲" : "CONCEPT 02",
      note: isFa
        ? "رد کوه، میان تار و پود."
        : "A mountain trace, held in the weave.",
      tone: "textile",
    },
    {
      href: "/studio",
      src: "/home/polaroid/alabaster-walnut-lamp.png",
      alt: isFa
        ? "چراغ سنگی دست‌تراش با پایه چوب گردو"
        : "Hand-carved alabaster lamp with a walnut base",
      title: isFa ? "چراغ سنگ و گردو" : "Alabaster & walnut lamp",
      material: isFa ? "سنگ مرمر · چوب گردو" : "Alabaster · walnut",
      conceptLabel: isFa ? "ایده ۰۱" : "CONCEPT 01",
      note: isFa
        ? "نور از دل سنگ رد می‌شود."
        : "Light passes through the stone.",
      tone: "stone",
    },
    {
      href: "/studio",
      src: "/home/polaroid/blackened-brass-incense.png",
      alt: isFa
        ? "عودسوز مجسمه‌گون از برنج سیاه‌کاری‌شده"
        : "Sculptural incense holder in blackened brass",
      title: isFa ? "عودسوز برنجی هلال" : "Crescent brass incense holder",
      material: isFa ? "برنج سیاه‌کاری‌شده" : "Blackened brass",
      conceptLabel: isFa ? "ایده ۰۳" : "CONCEPT 03",
      note: isFa
        ? "دود، شکل ناپیدای اثر است."
        : "Smoke is the work’s unseen form.",
      tone: "metal",
    },
  ];
}
