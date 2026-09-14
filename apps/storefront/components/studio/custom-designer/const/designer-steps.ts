import type { MessageKey } from "@/i18n/fa";

export const DESIGNER_STEPS = ["spark", "type", "freedom", "send"] as const;

export type DesignerStep = (typeof DESIGNER_STEPS)[number];

export const DESIGNER_STEP_KEY: Record<DesignerStep, MessageKey> = {
  spark: "designerStepSpark",
  type: "designerStepType",
  freedom: "designerStepFreedom",
  send: "designerStepSend",
};
