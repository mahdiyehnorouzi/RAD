import type { LocaleCopy } from "@/types/locale";

export const DESIGNER_COLORS = [
  { id: "moss", value: "#263d34" },
  { id: "clay", value: "#8a4938" },
  { id: "sand", value: "#cbb892" },
  { id: "cream", value: "#eee7dc" },
  { id: "blue", value: "#6ba3c4" },
  { id: "ink", value: "#18231f" },
  { id: "oxide", value: "#d87855" },
  { id: "olive", value: "#4b513c" },
] as const;

export const DESIGNER_FEELINGS: Array<{ id: string; label: LocaleCopy }> = [
  { id: "playful", label: { fa: "شوخ", en: "playful" } },
  { id: "quiet", label: { fa: "آرام", en: "quiet" } },
  { id: "homesick", label: { fa: "دلتنگ", en: "homesick" } },
  { id: "wild", label: { fa: "وحشی", en: "wild" } },
  { id: "tender", label: { fa: "نرم", en: "tender" } },
  { id: "stubborn", label: { fa: "کله‌شق", en: "stubborn" } },
  { id: "warm", label: { fa: "گرم", en: "warm" } },
];

export const MAX_DESIGNER_COLORS = 3;
