export const DESIGNER_COLORS = [
  { id: "charcoal", value: "#2b2a27", label: { fa: "ذغالی", en: "Charcoal" } },
  {
    id: "cobalt",
    value: "#3d6b9c",
    label: { fa: "آبی لاجوردی", en: "Cobalt" },
  },
  { id: "olive", value: "#66703f", label: { fa: "زیتونی", en: "Olive" } },
  { id: "brown", value: "#7a4a2c", label: { fa: "قهوه‌ای", en: "Brown" } },
  { id: "sand", value: "#cfa981", label: { fa: "شنی", en: "Sand" } },
  { id: "cream", value: "#efe7da", label: { fa: "کرم", en: "Cream" } },
] as const;

export const MAX_DESIGNER_COLORS = 3;

export function colorLabel(value: string, locale: "fa" | "en") {
  const preset = DESIGNER_COLORS.find((color) => color.value === value);
  return preset ? preset.label[locale] : value;
}
