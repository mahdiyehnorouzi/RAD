import type { DesignerStep } from "../const";

/** Everything the visitor has typed or picked in the studio, kept across reloads and sign-in. */
export type DesignerDraft = {
  step: DesignerStep;
  reached: DesignerStep;
  prompt: string;
  uploads: string[];
  sketch: string;
  hasVoice: boolean;
  form: string;
  uses: string[];
  size: string;
  length: string;
  width: string;
  height: string;
  colors: string[];
  colorNote: string;
  freedom: number;
  budget: string;
  timeline: string;
  needBy: string;
};
