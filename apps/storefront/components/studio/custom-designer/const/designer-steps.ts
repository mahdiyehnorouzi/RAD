import type { MessageKey } from "@/i18n/fa";

export const DESIGNER_STEPS = [
  "type",
  "details",
  "idea",
  "images",
  "send",
] as const;

export type DesignerStep = (typeof DESIGNER_STEPS)[number];

export const DESIGNER_STEP_KEY: Record<DesignerStep, MessageKey> = {
  type: "designerStepType",
  details: "designerStepDetails",
  idea: "designerStepIdea",
  images: "designerStepImages",
  send: "designerStepSend",
};
