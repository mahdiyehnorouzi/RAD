import type { MessageKey } from "./fa";

export const orderStageKeys = [
  "orderStage1",
  "orderStage2",
  "orderStage3",
  "orderStage4",
  "orderStage5",
  "orderStage6",
  "orderStage7",
  "orderStage8",
  "orderStage9",
  "orderStage10",
] as const satisfies readonly MessageKey[];

export const faqKeys = [
  { q: "faqDamageQ", a: "faqDamageA" },
  { q: "faqPackQ", a: "faqPackA" },
  { q: "faqTimeQ", a: "faqTimeA" },
  { q: "faqReturnQ", a: "faqReturnA" },
] as const satisfies ReadonlyArray<{ q: MessageKey; a: MessageKey }>;
