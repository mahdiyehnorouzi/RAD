import type { HelpQuestion } from "../database/entities";
import type { PolicySlug } from "../policies/type";
import type { SaveHelpQuestionDto } from "./dto";
import type { HelpQuestionView } from "./type";

const trimmed = (text: { fa: string; en: string }) => ({
  fa: text.fa.trim(),
  en: text.en.trim(),
});

export function toHelpQuestion(question: HelpQuestion): HelpQuestionView {
  return {
    id: question.id,
    question: question.question,
    answer: question.answer,
    more: question.moreSlug
      ? {
          slug: question.moreSlug as PolicySlug,
          section: question.moreSection ?? undefined,
        }
      : undefined,
  };
}

export function toHelpRecord(input: SaveHelpQuestionDto) {
  return {
    question: trimmed(input.question),
    answer: trimmed(input.answer),
    moreSlug: input.more?.slug ?? null,
    moreSection: input.more?.section?.trim() || null,
  };
}
