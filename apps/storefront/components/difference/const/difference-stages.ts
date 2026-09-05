import type { DifferenceStageId } from "../type";

export const differenceStages: Array<{
  id: DifferenceStageId;
  index: { fa: string; en: string };
  title: { fa: string; en: string };
}> = [
  {
    id: "described",
    index: { fa: "۰۱", en: "01" },
    title: { fa: "آنچه توصیف شد", en: "What they described" },
  },
  {
    id: "imagined",
    index: { fa: "۰۲", en: "02" },
    title: { fa: "آنچه هوش مصنوعی تصور کرد", en: "What AI imagined" },
  },
  {
    id: "artist",
    index: { fa: "۰۳", en: "03" },
    title: { fa: "بازخوانی هنرمند", en: "How the artist reinterpreted it" },
  },
  {
    id: "material",
    index: { fa: "۰۴", en: "04" },
    title: { fa: "آنچه ماده ساخت", en: "What the material produced" },
  },
];
