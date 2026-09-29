import type { LocalizedText } from "./artwork";
import type { Review } from "./index";
import type { PolicySlug } from "./policy";

/**
 * The feelings the shape quiz measures; each matches a key of
 * `PassportTraits`. Mirrored by `SHAPE_TRAITS` in the API (CommonJS cannot
 * import this package).
 */
export const SHAPE_TRAITS = [
  "crooked",
  "quiet",
  "worn",
  "surprise",
  "strange",
] as const;
export type ShapeTrait = (typeof SHAPE_TRAITS)[number];

export interface ShapeChoice {
  label: LocalizedText;
  note: LocalizedText;
  /** Path under the storefront (`/shape/…`) or an absolute image URL. */
  photo: { src: string; alt: LocalizedText };
  /** Where this answer sets the trait, from 0 to 1. */
  value: number;
}

/** One step of the "what shape is my RAD?" quiz. Always two choices. */
export interface ShapeQuestion {
  id: string;
  trait: ShapeTrait;
  prompt: LocalizedText;
  hint: LocalizedText;
  choices: [ShapeChoice, ShapeChoice];
}

export type ShapeQuestionInput = Omit<ShapeQuestion, "id">;

/** A common question on the help page; `more` points to its full rule. */
export interface HelpQuestion {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
  more?: { slug: PolicySlug; section?: string };
}

export type HelpQuestionInput = Omit<HelpQuestion, "id">;

/** A review as staff see it: hidden ones never reach the storefront. */
export interface AdminReview extends Review {
  hidden: boolean;
  productName?: string;
}
