import type { ProductCategory } from "@rad/types";
import type { LocaleCopy } from "@/types/locale";

type MakingStep = {
  id: string;
  label: LocaleCopy;
  /** Shown only when the work's materials name this stage. */
  when?: RegExp;
};

const CERAMIC_PATH: MakingStep[] = [
  { id: "clay", label: { fa: "گل", en: "Clay" } },
  { id: "form", label: { fa: "فرم", en: "Form" } },
  { id: "dry", label: { fa: "خشک‌شدن", en: "Drying" } },
  { id: "glaze", label: { fa: "لعاب", en: "Glaze" }, when: /لعاب|glaz/i },
  { id: "kiln", label: { fa: "کوره", en: "Kiln" } },
];

/**
 * Stages every work of a medium passes through, so no date or claim is
 * invented. Media whose path varies from work to work have none yet.
 */
export const MAKING_PATHS: Partial<Record<ProductCategory, MakingStep[]>> = {
  ceramics: CERAMIC_PATH,
  vases: CERAMIC_PATH,
  tableware: CERAMIC_PATH,
};
