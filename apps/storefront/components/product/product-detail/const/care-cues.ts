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
  type LucideIcon,
} from "lucide-react";

/** First match wins, so narrower cues sit above broader ones. */
export const CARE_CUES: { icon: LucideIcon; pattern: RegExp }[] = [
  { icon: UtensilsCrossed, pattern: /غذا|food/i },
  { icon: Thermometer, pattern: /حرارت|ظرفشویی|thermal|heat|dishwasher/i },
  { icon: Sun, pattern: /آفتاب|خورشید|sun/i },
  { icon: Frame, pattern: /قاب|شیشه|frame|glass/i },
  { icon: Droplet, pattern: /روغن|oil/i },
  { icon: Sparkles, pattern: /پارچه|گردگیری|برق|cloth|dust|polish/i },
  { icon: Hand, pattern: /دست|hand|lift/i },
  { icon: Droplets, pattern: /آب|شست|رطوبت|خشک|wash|water|damp|dry/i },
];

export const CARE_FALLBACK_ICON: LucideIcon = HandHeart;
