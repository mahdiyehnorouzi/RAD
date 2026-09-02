import type { SurprisePermission } from "../type";

export const surprisePermissions: Array<{
  id: SurprisePermission;
  title: { fa: string; en: string };
  body: { fa: string; en: string };
}> = [
  {
    id: "faithful",
    title: { fa: "وفادار", en: "Faithful" },
    body: {
      fa: "نزدیک به تصور من بمانید.",
      en: "Stay close to my concept.",
    },
  },
  {
    id: "hand",
    title: { fa: "دستِ هنرمند", en: "Artist’s hand" },
    body: {
      fa: "بازبینی معنادار را بپذیرید.",
      en: "Allow meaningful reinterpretation.",
    },
  },
  {
    id: "material",
    title: { fa: "ماده تصمیم می‌گیرد", en: "Material decides" },
    body: {
      fa: "غافلگیری پخت، بافت و دانه را در آغوش بگیرید.",
      en: "Embrace firing, grain, and texture surprises.",
    },
  },
];
