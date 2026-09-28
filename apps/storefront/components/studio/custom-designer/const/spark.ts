export const DESIGNER_COLORS = [
  { id: "moss", value: "#263d34", label: { fa: "سبز کوره", en: "Kiln green" } },
  { id: "clay", value: "#8a4938", label: { fa: "اکسید", en: "Oxide" } },
  { id: "sand", value: "#cbb892", label: { fa: "شنی", en: "Sand" } },
  { id: "cream", value: "#eee7dc", label: { fa: "کرم", en: "Cream" } },
  { id: "blue", value: "#6ba3c4", label: { fa: "آبی", en: "Blue" } },
  { id: "ink", value: "#18231f", label: { fa: "جوهری", en: "Ink" } },
  { id: "oxide", value: "#d87855", label: { fa: "نارنجی سوخته", en: "Burnt orange" } },
  { id: "olive", value: "#4b513c", label: { fa: "زیتونی", en: "Olive" } },
] as const;

export const MAX_DESIGNER_COLORS = 3;

export function colorLabel(value: string, locale: "fa" | "en") {
  const preset = DESIGNER_COLORS.find((color) => color.value === value);
  return preset ? preset.label[locale] : value;
}
