import type { FlowScreen } from "./flow-screen";
import type { DesignerStep } from "../const";

/** Everything the visitor has typed or picked in the studio, kept across reloads and sign-in. */
export type DesignerDraft = {
  flowScreen?: FlowScreen;
  step: DesignerStep;
  reached: DesignerStep;
  prompt: string;
  uploads: string[];
  sketch: string;
  hasVoice: boolean;
  voice?: string;
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
