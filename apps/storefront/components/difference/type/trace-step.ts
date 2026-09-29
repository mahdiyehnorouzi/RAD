export type TraceIconName = "clay" | "hand" | "brush" | "kiln" | "bowl";

/** One stop on the thread timeline; without a photo the stage's palette stands in. */
export type TraceStep = {
  id: string;
  title: string;
  notes: string[];
  image?: { src: string; alt: string };
  swatch?: { color: string; accent: string; label: string };
  icon?: TraceIconName;
};
