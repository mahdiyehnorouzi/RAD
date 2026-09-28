import {
  Droplet,
  Droplets,
  Frame,
  Hand,
  HandHeart,
  Sparkles,
  Sun,
  Thermometer,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { LocaleCopy } from "@/types/locale";

type CareCue = { icon: LucideIcon; title: LocaleCopy; pattern: RegExp };

/** First match wins, so narrower cues sit above broader ones. */
export const CARE_CUES: CareCue[] = [
  {
    icon: UtensilsCrossed,
    title: { fa: "غذا", en: "Food" },
    pattern: /غذا|food/i,
  },
  {
    icon: Thermometer,
    title: { fa: "حرارت", en: "Heat" },
    pattern: /حرارت|ظرفشویی|thermal|heat|dishwasher/i,
  },
  {
    icon: Sun,
    title: { fa: "نور", en: "Light" },
    pattern: /آفتاب|خورشید|sun/i,
  },
  {
    icon: Frame,
    title: { fa: "قاب", en: "Framing" },
    pattern: /قاب|شیشه|frame|glass/i,
  },
  {
    icon: Droplet,
    title: { fa: "روغن", en: "Oiling" },
    pattern: /روغن|oil/i,
  },
  {
    icon: Droplets,
    title: { fa: "شست‌وشو", en: "Washing" },
    pattern: /بشوی|شست|wash/i,
  },
  {
    icon: Sparkles,
    title: { fa: "پاک‌کردن", en: "Cleaning" },
    pattern: /پارچه|گردگیری|برق|پاک|cloth|dust|polish|wipe/i,
  },
  {
    icon: Waves,
    title: { fa: "رطوبت", en: "Moisture" },
    pattern: /آب|رطوبت|خشک|water|damp|dry/i,
  },
  {
    icon: Hand,
    title: { fa: "نگهداری", en: "Keeping" },
    pattern: /سطح|محکم|دست|surface|steady|hand|lift/i,
  },
];

export const CARE_FALLBACK: Pick<CareCue, "icon" | "title"> = {
  icon: HandHeart,
  title: { fa: "نگهداری", en: "Keeping" },
};
