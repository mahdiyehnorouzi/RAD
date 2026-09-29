import type { PolicySlug } from "../../policies/type";

type Localized = { fa: string; en: string };

/** Mirrors `HelpQuestion` in `@rad/types`. */
export type HelpQuestionView = {
  id: string;
  question: Localized;
  answer: Localized;
  more?: { slug: PolicySlug; section?: string };
};
