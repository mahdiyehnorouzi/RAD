import type { ProductCategory } from "@rad/types";
import type { DesignerStep } from "../const";

/** Everything the visitor has typed or picked in the studio, kept across reloads and sign-in. */
export type DesignerDraft = {
  step: DesignerStep;
  reached: DesignerStep;
  category: ProductCategory | "";
  prompt: string;
  intendedUse: string;
  dimensions: string;
  budget: string;
  uploads: string[];
  sketch: string;
  hasVoice: boolean;
  colors: string[];
  feeling: string;
  freedom: number;
};
