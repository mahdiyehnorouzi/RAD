export const DESIGNER_COLORS = [
  { id: "white", value: "#f2eee5", label: { fa: "سفید", en: "White" } },
  { id: "khaki", value: "#929074", label: { fa: "خاکی", en: "Khaki" } },
  { id: "pink", value: "#d89e89", label: { fa: "صورتی", en: "Pink" } },
  { id: "charcoal", value: "#2b2a27", label: { fa: "ذغالی", en: "Charcoal" } },
  {
    id: "cobalt",
    value: "#3d6b9c",
    label: { fa: "آبی لاجوردی", en: "Cobalt" },
  },
  { id: "olive", value: "#66703f", label: { fa: "زیتونی", en: "Olive" } },
  { id: "brown", value: "#7a4a2c", label: { fa: "قهوه‌ای", en: "Brown" } },

  { id: "cream", value: "#efe7da", label: { fa: "کرم", en: "Cream" } },
  {
    id: "matte",
    value: "matte",
    background: "linear-gradient(120deg,#c1b7a5,#aaa08d)",
    label: { fa: "مات", en: "Matte" },
  },
  {
    id: "gloss",
    value: "gloss",
    background:
      "radial-gradient(ellipse at 25% 20%,#fff8,transparent 50%),#b8916b",
    label: { fa: "براق", en: "Glossy" },
  },
  {
    id: "speckled",
    value: "speckled",
    background: "url('/catalog/photos/speckled-sculpted-mug.webp') center/250%",
    label: { fa: "خال‌دار", en: "Speckled" },
  },
  {
    id: "textured",
    value: "textured",
    background:
      "repeating-linear-gradient(75deg,#d4b89b 0px,#bb9878 1px,#d4b89b 3px)",
    label: { fa: "بافت‌دار", en: "Textured" },
  },
] as const;

export const MAX_DESIGNER_COLORS = 3;

export function colorLabel(value: string, locale: "fa" | "en") {
  const preset = DESIGNER_COLORS.find((color) => color.value === value);
  return preset ? preset.label[locale] : value;
}
