export type ChoicesSectionId =
  | "category"
  | "size"
  | "color"
  | "similarity"
  | "budget"
  | "timeline";

/** The six Choices sections in reading order; "similarity" only applies
 * when the visitor attached a reference photo or sketch in the Idea phase. */
export function sectionOrder(hasReference: boolean): ChoicesSectionId[] {
  return [
    "category",
    "size",
    "color",
    ...(hasReference ? (["similarity"] as const) : []),
    "budget",
    "timeline",
  ];
}
