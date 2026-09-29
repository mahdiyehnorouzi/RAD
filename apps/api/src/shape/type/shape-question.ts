import type { SHAPE_TRAITS } from "../const";

export type ShapeTrait = (typeof SHAPE_TRAITS)[number];

type Localized = { fa: string; en: string };

/** Mirrors `ShapeChoice` in `@rad/types`. */
export type ShapeChoiceView = {
  label: Localized;
  note: Localized;
  photo: { src: string; alt: Localized };
  value: number;
};

/** Mirrors `ShapeQuestion` in `@rad/types`. */
export type ShapeQuestionView = {
  id: string;
  trait: ShapeTrait;
  prompt: Localized;
  hint: Localized;
  choices: [ShapeChoiceView, ShapeChoiceView];
};
